# Load Testing Roadmap - K6 Performance Testing

## Overview
Implement load testing to ensure the system can handle production traffic volumes and identify performance bottlenecks before they impact users.

## Prerequisites
Already installed in package.json:
- k6 (via CLI or Docker)

## Test Scenarios to Create

### Scenario 1: Baseline Load Test (Priority: High)
**File:** `k6/scenarios/baseline.js`

**Objective:** Establish normal operating performance

```javascript
import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  stages: [
    { duration: '2m', target: 10 },  // Ramp up to 10 users
    { duration: '5m', target: 10 },  // Stay at 10 users
    { duration: '2m', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],   // <1% failure rate
  },
}

export default function () {
  // Test product listing
  const listRes = http.get('http://localhost:9000/store/products')
  check(listRes, { 'product list status 200': (r) => r.status === 200 })
  
  sleep(1)
  
  // Test product detail
  const detailRes = http.get('http://localhost:9000/store/products/prod_123')
  check(detailRes, { 'product detail status 200': (r) => r.status === 200 })
  
  sleep(1)
}
```

**Metrics:**
- Response times: p50, p95, p99
- Request rate (RPS)
- Error rate
- Throughput

---

### Scenario 2: Stress Test (Priority: High)
**File:** `k6/scenarios/stress.js`

**Objective:** Find breaking point and recovery behavior

```javascript
export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50
    { duration: '2m', target: 100 },  // Spike to 100
    { duration: '5m', target: 100 },  // Stay at 100
    { duration: '2m', target: 150 },  // Push to 150
    { duration: '5m', target: 150 },  // Stay at 150
    { duration: '5m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // More lenient under stress
    http_req_failed: ['rate<0.05'],    // <5% failure rate
  },
}

export default function () {
  // Authentication
  const loginPayload = JSON.stringify({
    email: 'test@example.com',
    password: 'TestPassword123!',
  })
  
  const loginRes = http.post('http://localhost:9000/auth/customer/login', loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  })
  
  check(loginRes, { 'login status 200': (r) => r.status === 200 })
  
  const token = loginRes.json('token')
  
  // Browse products
  http.get('http://localhost:9000/store/products', {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  
  sleep(2)
}
```

**Metrics:**
- Max concurrent users before degradation
- Recovery time after stress
- Database connection pool exhaustion
- Memory leaks

---

### Scenario 3: Spike Test (Priority: High)
**File:** `k6/scenarios/spike.js`

**Objective:** Test sudden traffic spikes (flash sales, viral content)

```javascript
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Normal traffic
    { duration: '1m', target: 500 },   // SPIKE to 500 users
    { duration: '3m', target: 500 },   // Sustain spike
    { duration: '30s', target: 10 },   // Drop back to normal
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95% < 3s during spike
    http_req_failed: ['rate<0.1'],     // <10% failure rate
  },
}

export default function () {
  // Simulate checkout flow
  const cartPayload = JSON.stringify({
    product_id: 'prod_123',
    quantity: 1,
  })
  
  http.post('http://localhost:9000/store/cart/add', cartPayload, {
    headers: { 'Content-Type': 'application/json' },
  })
  
  sleep(0.5)
  
  http.get('http://localhost:9000/store/cart')
  
  sleep(0.5)
}
```

**Metrics:**
- System stability during sudden load
- Auto-scaling effectiveness (Railway)
- Rate limiter performance
- Queue system behavior

---

### Scenario 4: Soak Test (Priority: Medium)
**File:** `k6/scenarios/soak.js`

**Objective:** Test system stability over extended period (memory leaks, resource exhaustion)

```javascript
export const options = {
  stages: [
    { duration: '5m', target: 50 },   // Ramp up
    { duration: '4h', target: 50 },   // Run for 4 hours
    { duration: '5m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],
    http_req_failed: ['rate<0.01'],
  },
}

export default function () {
  // Full user journey
  // 1. Browse products
  http.get('http://localhost:9000/store/products')
  sleep(2)
  
  // 2. View product
  http.get('http://localhost:9000/store/products/prod_123')
  sleep(3)
  
  // 3. Add to cart
  http.post('http://localhost:9000/store/cart/add', /* ... */)
  sleep(1)
  
  // 4. View cart
  http.get('http://localhost:9000/store/cart')
  sleep(5)
}
```

**Metrics:**
- Memory usage over time
- Database connection leaks
- Log file growth
- Response time degradation

---

### Scenario 5: API Endpoint Focused (Priority: High)
**File:** `k6/scenarios/api-critical.js`

**Objective:** Test critical API endpoints under load

```javascript
export const options = {
  scenarios: {
    product_listing: {
      executor: 'constant-arrival-rate',
      rate: 100,           // 100 RPS
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 50,
      maxVUs: 100,
    },
    checkout: {
      executor: 'constant-arrival-rate',
      rate: 20,            // 20 RPS
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 20,
      maxVUs: 50,
    },
  },
}

export default function () {
  const endpoint = __ENV.SCENARIO
  
  if (endpoint === 'product_listing') {
    http.get('http://localhost:9000/store/products')
  } else if (endpoint === 'checkout') {
    http.post('http://localhost:9000/store/checkout', /* ... */)
  }
  
  sleep(1)
}
```

**Metrics:**
- Per-endpoint performance
- Bottleneck identification
- Database query optimization needs
- Cache effectiveness

---

## Execution Commands

### Local Testing
```bash
# Run baseline test
k6 run k6/scenarios/baseline.js

# Run stress test
k6 run k6/scenarios/stress.js

# Run spike test
k6 run k6/scenarios/spike.js

# Run with results output
k6 run --out json=results.json k6/scenarios/baseline.js

# Run with cloud results (k6.io)
k6 run --out cloud k6/scenarios/baseline.js
```

### CI/CD Integration
```yaml
# .github/workflows/load-tests.yml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Run daily at 2 AM
  workflow_dispatch:      # Manual trigger

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run k6 load test
        uses: grafana/k6-action@v0.3.0
        with:
          filename: k6/scenarios/baseline.js
        env:
          K6_CLOUD_TOKEN: ${{ secrets.K6_CLOUD_TOKEN }}
      
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: k6-results
          path: results.json
```

---

## Performance Targets

### Response Time Targets
| Endpoint | p50 | p95 | p99 |
|----------|-----|-----|-----|
| Product List | <100ms | <300ms | <500ms |
| Product Detail | <150ms | <400ms | <800ms |
| Add to Cart | <200ms | <500ms | <1s |
| Checkout | <500ms | <1.5s | <3s |
| Search | <200ms | <600ms | <1.2s |

### Concurrency Targets
- **Normal Load:** 100 concurrent users
- **Peak Load:** 500 concurrent users
- **Maximum:** 1000 concurrent users (with degradation)

### Error Rate Targets
- **Normal:** <0.1% (1 in 1000)
- **Stress:** <1% (1 in 100)
- **Spike:** <5% (1 in 20)

---

## Results Analysis

### Key Metrics to Monitor
1. **Response Times:** p50, p95, p99 for all endpoints
2. **Throughput:** Requests per second (RPS)
3. **Error Rates:** HTTP 4xx/5xx responses
4. **Database Performance:** Query times, connection pool usage
5. **Memory Usage:** Heap size, garbage collection frequency
6. **CPU Usage:** % utilization under load

### Tools for Visualization
- **k6 Cloud:** Real-time dashboards
- **Grafana + InfluxDB:** Custom dashboards
- **DataDog:** APM integration
- **Sentry:** Error tracking correlation

---

## Optimization Actions (Based on Results)

### If Response Times > Targets
- Add database indexes
- Implement Redis caching
- Optimize N+1 queries
- Enable CDN for static assets

### If High Error Rates
- Increase database connection pool
- Add request queuing
- Implement circuit breakers
- Scale horizontally (Railway)

### If Memory Leaks Detected
- Review event listener cleanup
- Check database connection closing
- Monitor Winston log rotation
- Profile Node.js heap

---

## Success Metrics

✅ **All 5 load test scenarios executed**
✅ **Performance targets met** (p95 < 500ms for critical paths)
✅ **Zero memory leaks** in 4-hour soak test
✅ **System recovers** from spike within 2 minutes
✅ **Documentation** of bottlenecks and optimizations

**Estimated Time:** 2-3 days for implementation + optimization
**Coverage Impact:** +3% MNC readiness
