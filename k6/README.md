# K6 Load Testing

Comprehensive load testing suite for Ecomcore backend using k6.

## 📁 Structure

```
k6/
├── scenarios/
│   ├── baseline.js       # Normal traffic (10 users, 9 minutes)
│   ├── stress.js         # Stress test (up to 200 users)
│   ├── spike.js          # Sudden traffic spike (500 users)
│   ├── soak.js           # Long-running test (4 hours at 20 users)
│   └── api-critical.js   # Endpoint-specific performance analysis
└── README.md
```

## 🚀 Installation

### Prerequisites

- Node.js 14+ (for running scripts)
- K6 (load testing tool)

### Install K6

**macOS (Homebrew):**
```bash
brew install k6
```

**Windows (Chocolatey):**
```bash
choco install k6
```

**Windows (Manual):**
1. Download from https://github.com/grafana/k6/releases
2. Add to PATH or run with full path

**Ubuntu/Debian:**
```bash
sudo apt-get install k6
```

**Verify Installation:**
```bash
k6 version
```

## 📊 Test Scenarios

### 1. Baseline Test (`baseline.js`)
**Duration:** 9 minutes  
**Users:** Ramps up to 10 users over 2 minutes, stays for 5 minutes, ramps down

**Purpose:** Establish baseline performance metrics under normal load

**Metrics:**
- Response time: p(95) < 500ms, p(99) < 1000ms
- Error rate: < 1%
- HTTP failures: < 0.1%

**Run:**
```bash
k6 run k6/scenarios/baseline.js
```

**Expected Results:**
- Most requests complete in 100-300ms
- Nearly 0% errors
- Consistent throughput

### 2. Stress Test (`stress.js`)
**Duration:** 15 minutes  
**Users:** Ramps up to 200 users (high stress)

**Purpose:** Find the system's breaking point

**Metrics:**
- Response time: p(95) < 1000ms, p(99) < 2000ms
- Error rate: < 5%
- HTTP failures: < 5%

**Run:**
```bash
k6 run k6/scenarios/stress.js
```

**Expected Results:**
- Performance degrades under heavy load
- Identify which endpoints struggle
- See where timeouts occur

### 3. Spike Test (`spike.js`)
**Duration:** 9 minutes  
**Users:** Sudden jump from 10 to 500 users

**Purpose:** Test system's ability to handle traffic spikes

**Metrics:**
- Response time: p(95) < 2000ms
- Error rate: < 10% (acceptable during spike)

**Run:**
```bash
k6 run k6/scenarios/spike.js
```

**Expected Results:**
- Initial spike in latency
- System recovers gracefully
- No persistent errors

### 4. Soak Test (`soak.js`)
**Duration:** 250 minutes (4+ hours!)  
**Users:** Constant 20 users

**Purpose:** Detect memory leaks, connection issues over time

**Metrics:**
- Consistent performance over time
- Error rate: < 1%
- No memory growth

**Run (limited version - 30 minutes instead of 4 hours):**
```bash
K6_SOAK_DURATION=30 k6 run k6/scenarios/soak.js
```

**Full soak test (4 hours):**
```bash
# Run overnight or in background
k6 run k6/scenarios/soak.js --duration 4h
```

### 5. API Critical Endpoints (`api-critical.js`)
**Duration:** 14 minutes  
**Focus:** Per-endpoint performance analysis

**Purpose:** Identify slow endpoints and bottlenecks

**Endpoints Tested:**
- Product listing and filtering
- Product details
- Collection queries
- Category browsing
- Cart operations (create, read, update)
- Region lookups

**Run:**
```bash
k6 run k6/scenarios/api-critical.js
```

**Expected Results:**
- Detailed performance breakdown per endpoint
- Identify which APIs are slow
- Prioritize optimization efforts

## 🛠️ Running Tests

### Basic Usage

```bash
# Run a scenario
k6 run k6/scenarios/baseline.js

# Run with custom backend URL
k6 run k6/scenarios/baseline.js --env BASE_URL=http://production.example.com:9000

# Run with results output
k6 run k6/scenarios/baseline.js --out csv=results.csv
```

### Advanced Options

```bash
# Run with duration override
k6 run k6/scenarios/baseline.js --duration 20m

# Run with virtual user limit
k6 run k6/scenarios/baseline.js --vus 50

# Run with iterations instead of duration
k6 run k6/scenarios/baseline.js --iterations 1000

# Run in quiet mode (minimal output)
k6 run k6/scenarios/baseline.js --quiet

# Collect metrics in JSON format
k6 run k6/scenarios/baseline.js --out json=results.json

# Collect metrics in InfluxDB (if available)
k6 run k6/scenarios/baseline.js --out influxdb=http://localhost:8086/k6
```

### Run All Tests in Sequence

```bash
#!/bin/bash
# save as run_all_tests.sh

echo "Running Baseline Test..."
k6 run k6/scenarios/baseline.js

echo "Running Stress Test..."
k6 run k6/scenarios/stress.js

echo "Running Spike Test..."
k6 run k6/scenarios/spike.js

echo "Running API Critical Test..."
k6 run k6/scenarios/api-critical.js

echo "All tests completed!"
```

Make executable and run:
```bash
chmod +x run_all_tests.sh
./run_all_tests.sh
```

## 📈 Interpreting Results

### Key Metrics

**Response Time (api_duration):**
- p(50): 50th percentile (median)
- p(95): 95th percentile (good for SLAs)
- p(99): 99th percentile (worst case)

```
✅ Good:    p(95) < 500ms
⚠️ Okay:    p(95) < 1000ms
❌ Bad:     p(95) > 1000ms
```

**Error Rate:**
```
✅ Good:    < 0.1%
⚠️ Okay:    < 1%
❌ Bad:     > 1%
```

**HTTP Status Distribution:**
```
✅ Good:    99%+ 2xx responses
⚠️ Okay:    95%+ 2xx responses
❌ Bad:     < 95% 2xx responses
```

### Example Output

```
     data_received..................: 487 MB  1.5 MB/s
     data_sent.......................: 123 MB  380 kB/s
     http_req_blocked................: avg=5.23ms   min=1.23ms   med=2.11ms   max=156.34ms p(90)=8.23ms   p(95)=12.34ms  
     http_req_connecting.............: avg=3.45ms   min=0s       med=0s       max=89.23ms  p(90)=0s       p(95)=2.34ms   
     http_req_duration...............: avg=234.5ms  min=12.3ms   med=145.2ms  max=3450ms   p(90)=445.3ms  p(95)=632.1ms  
       { expected_response:true }...: avg=234.5ms  min=12.3ms   med=145.2ms  max=3450ms   p(90)=445.3ms  p(95)=632.1ms  
     http_req_failed.................: 0.23%
     http_req_receiving..............: avg=45.2ms   min=1.2ms    med=23.4ms   max=234.5ms  p(90)=89.2ms   p(95)=123.4ms  
     http_req_sending................: avg=2.1ms    min=0.3ms    med=1.2ms    max=23.4ms   p(90)=4.3ms    p(95)=5.6ms    
     http_req_tls_handshaking........: avg=0s       min=0s       med=0s       max=0s       p(90)=0s       p(95)=0s       
     http_req_waiting................: avg=187.2ms  min=10.8ms   med=120.1ms  max=3200ms   p(90)=389.2ms  p(95)=512.3ms  
     http_reqs........................: 50000  154.32/s
     http_reqs_per_vuser.............: 5000   154.32/s
     iterations........................: 10000  30.86/s
     vus............................: 0      min=0       max=100
     vus_max..........................: 100
```

**Interpretation:**
- ✅ p(95) for http_req_duration = 632.1ms (acceptable)
- ✅ http_req_failed = 0.23% (acceptable)
- ✅ Consistent throughput of 154 requests/sec

## 🎯 Performance Targets

Set appropriate targets for your application:

```javascript
thresholds: {
  // API response time targets
  'api_duration': [
    'p(95)<500',   // 95% of requests under 500ms
    'p(99)<1000',  // 99% of requests under 1s
  ],
  
  // Error rate targets
  'errors': [
    'rate<0.01',   // Less than 1% errors
  ],
  
  // HTTP failure targets
  'http_req_failed': [
    'rate<0.001',  // Less than 0.1% failures
  ],
}
```

## 🐛 Debugging

### Verbose Output

```bash
k6 run k6/scenarios/baseline.js -v
```

### Log Specific Requests

Add to test file:
```javascript
import { check } from 'k6'
import { logResponse } from 'k6/http'

const res = http.get('http://example.com')
console.log('Response:', res.status, res.body)
```

### Find Slow Endpoints

```bash
k6 run k6/scenarios/api-critical.js --out csv=results.csv
# Then analyze results.csv for high response times
```

## 📊 Continuous Integration

### GitHub Actions Example

```yaml
name: K6 Load Tests
on: [schedule, workflow_dispatch]

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install K6
        run: sudo apt-get install k6
        
      - name: Start backend
        run: |
          cd ecomcore
          yarn install
          yarn dev &
          
      - name: Wait for backend
        run: npx wait-on http://localhost:9000
        
      - name: Run baseline test
        run: k6 run k6/scenarios/baseline.js
        
      - name: Run stress test
        run: k6 run k6/scenarios/stress.js
        
      - name: Run spike test
        run: k6 run k6/scenarios/spike.js
```

## 🔍 Optimization Strategies

Based on k6 results:

### If p(95) response time is high (>500ms):
1. Check database query performance
2. Add caching (Redis)
3. Optimize N+1 queries
4. Add database indexes

### If error rate is high (>1%):
1. Check server logs for errors
2. Increase server memory
3. Implement circuit breakers
4. Add rate limiting

### If specific endpoints are slow:
1. Profile that endpoint
2. Add caching
3. Optimize queries
4. Add CDN for static assets

## 📚 Best Practices

1. **Run tests regularly:** Weekly or before deployments
2. **Establish baselines:** Know your normal performance
3. **Test before production:** Never deploy untested code
4. **Monitor over time:** Track performance trends
5. **Optimize based on results:** Use data, not guesses
6. **Test realistic scenarios:** Match real user behavior
7. **Set appropriate thresholds:** Don't aim for perfection

## 🎓 Resources

- [K6 Documentation](https://k6.io/docs/)
- [K6 JavaScript API](https://k6.io/docs/javascript-api/)
- [K6 Best Practices](https://k6.io/docs/testing-guides/test-types/)
- [Performance Testing Guide](https://k6.io/blog/performance-testing-guide/)

## 🆘 Troubleshooting

### K6 command not found
**Solution:** Ensure K6 is installed and in your PATH

### Connection refused (backend not running)
**Solution:** Start backend before running tests
```bash
cd ecomcore && yarn dev
```

### Tests timeout or hang
**Solution:** Increase timeout or check backend health
```bash
k6 run k6/scenarios/baseline.js --timeout 30s
```

### Out of memory
**Solution:** Run fewer concurrent users
```bash
k6 run k6/scenarios/baseline.js --max-vus 10
```

### Results don't match expectations
**Solution:** 
1. Verify backend is running properly
2. Check if test data exists
3. Review application logs
4. Run smaller test first (baseline)

## 📋 Testing Checklist

- [ ] Install K6
- [ ] Start backend (`yarn dev`)
- [ ] Run baseline test
- [ ] Review baseline results
- [ ] Run stress test
- [ ] Run spike test
- [ ] Run API critical test
- [ ] Document findings
- [ ] Implement optimizations
- [ ] Re-run tests to verify improvements
- [ ] Set up CI/CD testing
- [ ] Schedule regular test runs

## 🎉 Next Steps

1. Install K6: `brew install k6` or `choco install k6`
2. Start backend: `cd ecomcore && yarn dev`
3. Run baseline: `k6 run k6/scenarios/baseline.js`
4. Review results
5. Optimize based on findings
6. Run other scenarios
7. Document performance targets
