import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Rate, Trend, Counter, Gauge } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')
const apiDuration = new Trend('api_duration')
const successfulRequests = new Counter('successful_requests')
const currentVUs = new Gauge('vus')

export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp-up to 10 users over 2 minutes
    { duration: '5m', target: 10 }, // Stay at 10 users for 5 minutes
    { duration: '2m', target: 0 },  // Ramp-down to 0 users over 2 minutes
  ],
  thresholds: {
    // 95% of requests must complete below 500ms
    'api_duration': ['p(95)<500', 'p(99)<1000'],
    // Error rate must stay below 1%
    'errors': ['rate<0.01'],
    // HTTP request failures must be below 0.1%
    http_req_failed: ['rate<0.001'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:9000'
const STOREFRONT_URL = __ENV.STOREFRONT_URL || 'http://localhost:8000'

export default function () {
  currentVUs.set(__VU)
  
  group('Product API', () => {
    const listRes = http.get(`${BASE_URL}/store/products`, {
      tags: { name: 'ListProducts' },
    })
    
    apiDuration.add(listRes.timings.duration)
    check(listRes, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
      'has products': (r) => r.body.includes('id'),
    }) ? successfulRequests.add(1) : errorRate.add(1)
  })

  sleep(1)

  group('Product Details', () => {
    // Get a product first
    const listRes = http.get(`${BASE_URL}/store/products?limit=1`, {
      tags: { name: 'ListProducts' },
    })
    
    check(listRes, { 'status is 200': (r) => r.status === 200 })
    
    // Extract product ID from response
    const products = JSON.parse(listRes.body).products
    if (products && products.length > 0) {
      const productId = products[0].id
      
      const detailRes = http.get(`${BASE_URL}/store/products/${productId}`, {
        tags: { name: 'ProductDetails' },
      })
      
      apiDuration.add(detailRes.timings.duration)
      check(detailRes, {
        'status is 200': (r) => r.status === 200,
        'response time < 1000ms': (r) => r.timings.duration < 1000,
        'has variants': (r) => r.body.includes('variants'),
      }) ? successfulRequests.add(1) : errorRate.add(1)
    }
  })

  sleep(1)

  group('Category Listing', () => {
    const categoryRes = http.get(`${BASE_URL}/store/product-categories`, {
      tags: { name: 'ListCategories' },
    })
    
    apiDuration.add(categoryRes.timings.duration)
    check(categoryRes, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    }) ? successfulRequests.add(1) : errorRate.add(1)
  })

  sleep(1)

  group('Cart Operations', () => {
    // Create cart
    const createCartRes = http.post(
      `${BASE_URL}/store/carts`,
      JSON.stringify({ region_id: 'reg_01' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
    
    apiDuration.add(createCartRes.timings.duration)
    check(createCartRes, {
      'cart created': (r) => r.status === 200 || r.status === 201,
    }) ? successfulRequests.add(1) : errorRate.add(1)

    if (createCartRes.status === 200 || createCartRes.status === 201) {
      const cart = JSON.parse(createCartRes.body)
      const cartId = cart.cart?.id
      
      if (cartId) {
        sleep(0.5)

        // Add to cart
        const addToCartRes = http.post(
          `${BASE_URL}/store/carts/${cartId}/line-items`,
          JSON.stringify({
            variant_id: 'variant_01', // Will likely 404 but tests the endpoint
            quantity: 1,
          }),
          { headers: { 'Content-Type': 'application/json' } }
        )
        
        apiDuration.add(addToCartRes.timings.duration)
        check(addToCartRes, {
          'response received': (r) => r.status !== 0,
        }) ? successfulRequests.add(1) : errorRate.add(1)

        sleep(0.5)

        // Get cart
        const getCartRes = http.get(
          `${BASE_URL}/store/carts/${cartId}`,
          { tags: { name: 'GetCart' } }
        )
        
        apiDuration.add(getCartRes.timings.duration)
        check(getCartRes, {
          'status is 200': (r) => r.status === 200,
          'response time < 500ms': (r) => r.timings.duration < 500,
        }) ? successfulRequests.add(1) : errorRate.add(1)
      }
    }
  })

  sleep(2)
}
