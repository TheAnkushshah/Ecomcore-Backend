import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')
const apiDuration = new Trend('api_duration')
const successfulRequests = new Counter('successful_requests')

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp-up to 50 users over 2 minutes
    { duration: '5m', target: 100 },  // Ramp-up to 100 users over 5 minutes
    { duration: '5m', target: 200 },  // Ramp-up to 200 users over 5 minutes (stress)
    { duration: '3m', target: 0 },    // Ramp-down to 0 users
  ],
  thresholds: {
    // Relax thresholds for stress test
    'api_duration': ['p(95)<1000', 'p(99)<2000'],
    'errors': ['rate<0.05'], // Allow up to 5% error rate
    http_req_failed: ['rate<0.05'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:9000'

export default function () {
  group('Heavy Load - Product Listing', () => {
    // Simulate multiple users browsing products
    for (let page = 1; page <= 3; page++) {
      const res = http.get(`${BASE_URL}/store/products?limit=20&offset=${(page - 1) * 20}`, {
        tags: { name: 'ProductPagination' },
      })
      
      apiDuration.add(res.timings.duration)
      check(res, {
        'status is 200': (r) => r.status === 200,
      }) ? successfulRequests.add(1) : errorRate.add(1)
      
      sleep(0.5)
    }
  })

  group('Concurrent Product Details Requests', () => {
    // Simulate multiple concurrent detail requests
    const batchRes = http.batch([
      ['GET', `${BASE_URL}/store/products?limit=1`],
      ['GET', `${BASE_URL}/store/product-categories`],
      ['GET', `${BASE_URL}/store/regions`],
      ['GET', `${BASE_URL}/store/products?limit=1`],
      ['GET', `${BASE_URL}/store/product-categories?limit=10`],
    ], {
      tags: { name: 'BatchRequests' },
    })

    batchRes.forEach((res) => {
      apiDuration.add(res.timings.duration)
      check(res, {
        'status is 2xx': (r) => r.status >= 200 && r.status < 300,
      }) ? successfulRequests.add(1) : errorRate.add(1)
    })
  })

  sleep(1)

  group('Multiple Cart Operations', () => {
    // Simulate multiple users creating/managing carts
    const createRes = http.post(`${BASE_URL}/store/carts`, JSON.stringify({ region_id: 'reg_01' }), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'CreateCart' },
    })

    apiDuration.add(createRes.timings.duration)
    check(createRes, {
      'cart operation successful': (r) => r.status === 200 || r.status === 201,
    }) ? successfulRequests.add(1) : errorRate.add(1)

    if (createRes.status === 200 || createRes.status === 201) {
      try {
        const cart = JSON.parse(createRes.body)
        const cartId = cart.cart?.id
        
        if (cartId) {
          // Multiple sequential operations on same cart
          for (let i = 0; i < 2; i++) {
            const getRes = http.get(`${BASE_URL}/store/carts/${cartId}`, {
              tags: { name: 'GetCart' },
            })
            
            apiDuration.add(getRes.timings.duration)
            check(getRes, {
              'can retrieve cart': (r) => r.status === 200,
            }) ? successfulRequests.add(1) : errorRate.add(1)
            
            sleep(0.3)
          }
        }
      } catch (e) {
        errorRate.add(1)
      }
    }
  })

  sleep(1)

  group('Search Operations', () => {
    // Simulate search traffic
    const searchQueries = ['shirt', 'pants', 'shoes', 'jacket', 'hat']
    
    searchQueries.forEach((query) => {
      const searchRes = http.get(`${BASE_URL}/store/products?q=${query}`, {
        tags: { name: 'Search' },
      })
      
      apiDuration.add(searchRes.timings.duration)
      check(searchRes, {
        'search returns results': (r) => r.status === 200,
      }) ? successfulRequests.add(1) : errorRate.add(1)
      
      sleep(0.2)
    })
  })

  sleep(1)
}
