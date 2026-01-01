import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')
const apiDuration = new Trend('api_duration')
const successfulRequests = new Counter('successful_requests')

export const options = {
  stages: [
    { duration: '2m', target: 10 },    // Normal load: 10 users
    { duration: '1m', target: 500 },   // SPIKE: Jump to 500 users (huge spike!)
    { duration: '3m', target: 500 },   // Hold at 500 users
    { duration: '2m', target: 10 },    // Recovery to 10 users
    { duration: '3m', target: 0 },     // Cooldown
  ],
  thresholds: {
    'api_duration': ['p(95)<2000'],    // Very relaxed for spike
    'errors': ['rate<0.1'],             // 10% error rate acceptable during spike
    http_req_failed: ['rate<0.1'],
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:9000'

export default function () {
  // During spike, keep requests simple and fast to maximize concurrency
  
  group('Spike Test - Rapid Requests', () => {
    const res = http.get(`${BASE_URL}/store/products?limit=10`, {
      tags: { name: 'SpikeProducts' },
    })
    
    apiDuration.add(res.timings.duration)
    check(res, {
      'status is 200': (r) => r.status === 200,
    }) ? successfulRequests.add(1) : errorRate.add(1)
  })

  sleep(0.5)

  group('Spike Test - Category Requests', () => {
    const res = http.get(`${BASE_URL}/store/product-categories`, {
      tags: { name: 'SpikeCategories' },
    })
    
    apiDuration.add(res.timings.duration)
    check(res, {
      'status received': (r) => r.status !== 0,
    }) ? successfulRequests.add(1) : errorRate.add(1)
  })

  sleep(0.5)

  group('Spike Test - Quick Cart Creation', () => {
    const res = http.post(`${BASE_URL}/store/carts`, JSON.stringify({ region_id: 'reg_01' }), {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'SpikeCart' },
    })
    
    apiDuration.add(res.timings.duration)
    check(res, {
      'cart endpoint responding': (r) => r.status !== 0,
    }) ? successfulRequests.add(1) : errorRate.add(1)
  })

  sleep(0.5)

  group('Spike Test - Regions Request', () => {
    const res = http.get(`${BASE_URL}/store/regions`, {
      tags: { name: 'SpikeRegions' },
    })
    
    apiDuration.add(res.timings.duration)
    check(res, {
      'endpoint responding': (r) => r.status !== 0,
    }) ? successfulRequests.add(1) : errorRate.add(1)
  })

  // Minimal sleep during spike to maximize requests
  sleep(0.1)
}
