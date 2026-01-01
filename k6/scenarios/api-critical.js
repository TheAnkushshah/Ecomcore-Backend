import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Rate, Trend, Counter, Histogram } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')
const apiDuration = new Trend('api_duration')
const successfulRequests = new Counter('successful_requests')
const endpointDuration = new Trend('endpoint_duration')
const statusCodeDistribution = new Histogram('status_code_distribution')

export const options = {
  stages: [
    { duration: '2m', target: 20 },
    { duration: '10m', target: 30 },  // Focus on endpoints
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    'api_duration': ['p(95)<600', 'p(99)<1200'],
    'errors': ['rate<0.02'],
    http_req_failed: ['rate<0.01'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:9000'

// Helper function to measure endpoint performance
function measureEndpoint(name, method, url, body = null, headers = {}) {
  const startTime = new Date()
  
  let response
  if (method === 'GET') {
    response = http.get(url, { tags: { name } })
  } else if (method === 'POST') {
    response = http.post(url, body, { 
      headers: { 'Content-Type': 'application/json', ...headers },
      tags: { name }
    })
  } else if (method === 'PUT') {
    response = http.put(url, body, {
      headers: { 'Content-Type': 'application/json', ...headers },
      tags: { name }
    })
  }
  
  const duration = new Date() - startTime
  endpointDuration.add(duration, { endpoint: name })
  apiDuration.add(response.timings.duration)
  statusCodeDistribution.add(response.status)
  
  return response
}

export default function () {
  group('Endpoint Performance - Products', () => {
    // List products
    const listRes = measureEndpoint(
      'ListProducts',
      'GET',
      `${BASE_URL}/store/products?limit=50&offset=0`
    )
    
    check(listRes, {
      'list status 200': (r) => r.status === 200,
      'list response < 800ms': (r) => r.timings.duration < 800,
    }) ? successfulRequests.add(1) : errorRate.add(1)

    sleep(1)

    // List products with filters
    const filterRes = measureEndpoint(
      'FilteredProducts',
      'GET',
      `${BASE_URL}/store/products?limit=20&offset=0&collection_id=col_01`
    )
    
    check(filterRes, {
      'filter status 200': (r) => r.status === 200,
    }) ? successfulRequests.add(1) : errorRate.add(1)

    sleep(0.5)

    // Get product details
    const listFirstRes = http.get(`${BASE_URL}/store/products?limit=1`)
    if (listFirstRes.status === 200) {
      try {
        const products = JSON.parse(listFirstRes.body).products
        if (products && products.length > 0) {
          const detailRes = measureEndpoint(
            'ProductDetails',
            'GET',
            `${BASE_URL}/store/products/${products[0].id}`
          )
          
          check(detailRes, {
            'detail status 200': (r) => r.status === 200,
            'detail response < 500ms': (r) => r.timings.duration < 500,
          }) ? successfulRequests.add(1) : errorRate.add(1)
        }
      } catch (e) {
        errorRate.add(1)
      }
    }
  })

  sleep(1)

  group('Endpoint Performance - Collections', () => {
    // List collections
    const listRes = measureEndpoint(
      'ListCollections',
      'GET',
      `${BASE_URL}/store/collections`
    )
    
    check(listRes, {
      'collections status 200': (r) => r.status === 200,
    }) ? successfulRequests.add(1) : errorRate.add(1)

    sleep(0.5)

    // Get collection details
    if (listRes.status === 200) {
      try {
        const collections = JSON.parse(listRes.body).collections
        if (collections && collections.length > 0) {
          const collectionRes = measureEndpoint(
            'CollectionDetails',
            'GET',
            `${BASE_URL}/store/collections/${collections[0].id}`
          )
          
          check(collectionRes, {
            'collection detail status': (r) => r.status === 200,
          }) ? successfulRequests.add(1) : errorRate.add(1)
        }
      } catch (e) {
        errorRate.add(1)
      }
    }
  })

  sleep(1)

  group('Endpoint Performance - Categories', () => {
    const catRes = measureEndpoint(
      'ListCategories',
      'GET',
      `${BASE_URL}/store/product-categories`
    )
    
    check(catRes, {
      'categories status 200': (r) => r.status === 200,
      'categories response < 500ms': (r) => r.timings.duration < 500,
    }) ? successfulRequests.add(1) : errorRate.add(1)
  })

  sleep(1)

  group('Endpoint Performance - Cart', () => {
    // Create cart
    const createRes = measureEndpoint(
      'CreateCart',
      'POST',
      `${BASE_URL}/store/carts`,
      JSON.stringify({ region_id: 'reg_01' })
    )
    
    check(createRes, {
      'create cart status': (r) => r.status === 200 || r.status === 201,
      'create cart response < 1000ms': (r) => r.timings.duration < 1000,
    }) ? successfulRequests.add(1) : errorRate.add(1)

    if (createRes.status === 200 || createRes.status === 201) {
      try {
        const cart = JSON.parse(createRes.body)
        const cartId = cart.cart?.id
        
        if (cartId) {
          sleep(0.5)

          // Get cart
          const getRes = measureEndpoint(
            'GetCart',
            'GET',
            `${BASE_URL}/store/carts/${cartId}`
          )
          
          check(getRes, {
            'get cart status 200': (r) => r.status === 200,
          }) ? successfulRequests.add(1) : errorRate.add(1)

          sleep(0.5)

          // Add line item
          const addRes = measureEndpoint(
            'AddLineItem',
            'POST',
            `${BASE_URL}/store/carts/${cartId}/line-items`,
            JSON.stringify({
              variant_id: 'variant_01',
              quantity: 1,
            })
          )
          
          check(addRes, {
            'line item operation': (r) => r.status !== 0,
          }) ? successfulRequests.add(1) : errorRate.add(1)

          sleep(0.5)

          // Update line item
          try {
            const cartData = JSON.parse(getRes.body)
            if (cartData.cart?.items && cartData.cart.items.length > 0) {
              const itemId = cartData.cart.items[0].id
              
              const updateRes = measureEndpoint(
                'UpdateLineItem',
                'POST',
                `${BASE_URL}/store/carts/${cartId}/line-items/${itemId}`,
                JSON.stringify({ quantity: 2 })
              )
              
              check(updateRes, {
                'update item status': (r) => r.status !== 0,
              }) ? successfulRequests.add(1) : errorRate.add(1)
            }
          } catch (e) {
            errorRate.add(1)
          }
        }
      } catch (e) {
        errorRate.add(1)
      }
    }
  })

  sleep(1)

  group('Endpoint Performance - Regions', () => {
    const regRes = measureEndpoint(
      'ListRegions',
      'GET',
      `${BASE_URL}/store/regions`
    )
    
    check(regRes, {
      'regions status 200': (r) => r.status === 200,
    }) ? successfulRequests.add(1) : errorRate.add(1)
  })

  sleep(2)
}
