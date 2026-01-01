import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')
const apiDuration = new Trend('api_duration')
const successfulRequests = new Counter('successful_requests')
const memoryLeakDetector = new Trend('memory_usage')

export const options = {
  stages: [
    { duration: '5m', target: 20 },    // Ramp-up to 20 users
    { duration: '240m', target: 20 },  // Stay at 20 users for 4 HOURS (soak test)
    { duration: '5m', target: 0 },     // Ramp-down
  ],
  thresholds: {
    // More relaxed for long-running tests
    'api_duration': ['p(99)<3000'],
    'errors': ['rate<0.01'],
    http_req_failed: ['rate<0.001'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:9000'

export default function () {
  // Simulate realistic usage patterns over extended period
  
  group('Soak Test - Regular User Journey', () => {
    // Browse products
    const browseRes = http.get(`${BASE_URL}/store/products?limit=20`, {
      tags: { name: 'SoakBrowse' },
    })
    
    apiDuration.add(browseRes.timings.duration)
    check(browseRes, {
      'browse successful': (r) => r.status === 200,
    }) ? successfulRequests.add(1) : errorRate.add(1)
  })

  sleep(2)

  group('Soak Test - View Product Details', () => {
    // Get product details
    const listRes = http.get(`${BASE_URL}/store/products?limit=1`, {
      tags: { name: 'SoakList' },
    })

    if (listRes.status === 200) {
      try {
        const products = JSON.parse(listRes.body).products
        if (products && products.length > 0) {
          const productId = products[0].id
          
          const detailRes = http.get(`${BASE_URL}/store/products/${productId}`, {
            tags: { name: 'SoakDetails' },
          })
          
          apiDuration.add(detailRes.timings.duration)
          check(detailRes, {
            'detail view successful': (r) => r.status === 200,
          }) ? successfulRequests.add(1) : errorRate.add(1)
        }
      } catch (e) {
        errorRate.add(1)
      }
    }
  })

  sleep(2)

  group('Soak Test - Cart Maintenance', () => {
    // Create a cart
    const createRes = http.post(`${BASE_URL}/store/carts`, JSON.stringify({ region_id: 'reg_01' }), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'SoakCreateCart' },
    })

    apiDuration.add(createRes.timings.duration)
    check(createRes, {
      'cart creation successful': (r) => r.status === 200 || r.status === 201,
    }) ? successfulRequests.add(1) : errorRate.add(1)

    if (createRes.status === 200 || createRes.status === 201) {
      try {
        const cart = JSON.parse(createRes.body)
        const cartId = cart.cart?.id
        
        if (cartId) {
          // Periodically check cart
          for (let i = 0; i < 3; i++) {
            const getRes = http.get(`${BASE_URL}/store/carts/${cartId}`, {
              tags: { name: 'SoakGetCart' },
            })
            
            apiDuration.add(getRes.timings.duration)
            check(getRes, {
              'cart accessible': (r) => r.status === 200,
            }) ? successfulRequests.add(1) : errorRate.add(1)
            
            sleep(1)
          }
        }
      } catch (e) {
        errorRate.add(1)
      }
    }
  })

  sleep(2)

  group('Soak Test - Search Queries', () => {
    const queries = ['electronics', 'clothing', 'accessories', 'books', 'home']
    
    // Rotate through queries
    const query = queries[Math.floor(Math.random() * queries.length)]
    
    const searchRes = http.get(`${BASE_URL}/store/products?q=${query}`, {
      tags: { name: 'SoakSearch' },
    })
    
    apiDuration.add(searchRes.timings.duration)
    check(searchRes, {
      'search working': (r) => r.status === 200,
    }) ? successfulRequests.add(1) : errorRate.add(1)
  })

  sleep(3)

  group('Soak Test - Category Browsing', () => {
    const categoryRes = http.get(`${BASE_URL}/store/product-categories`, {
      tags: { name: 'SoakCategories' },
    })
    
    apiDuration.add(categoryRes.timings.duration)
    check(categoryRes, {
      'categories accessible': (r) => r.status === 200,
    }) ? successfulRequests.add(1) : errorRate.add(1)
  })

  // Realistic delay between user actions
  sleep(5)
}
