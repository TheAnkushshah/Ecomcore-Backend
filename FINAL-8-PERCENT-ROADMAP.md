# Final 2% - API Documentation & Polish

## 1. API Documentation with Swagger/OpenAPI (1%)

### Current Status
- Framework ready (comments in code)
- No Swagger UI configured

### Implementation Needed

**Install Dependencies:**
```bash
yarn add swagger-jsdoc swagger-ui-express
yarn add -D @types/swagger-jsdoc @types/swagger-ui-express
```

**Create Swagger Configuration:**
```typescript
// src/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Ecomcore API',
      version: '1.0.0',
      description: 'E-commerce backend API documentation',
    },
    servers: [
      { url: 'http://localhost:9000', description: 'Development' },
      { url: 'https://your-app.railway.app', description: 'Production' },
    ],
  },
  apis: ['./src/api/**/*.ts'],
}

export const swaggerSpec = swaggerJsdoc(options)
export { swaggerUi }
```

**Add Endpoint Documentation:**
```typescript
/**
 * @swagger
 * /store/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of products to return
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
```

**Tasks:**
- Document 20+ API endpoints
- Add request/response schemas
- Include authentication requirements
- Add example payloads

---

## 2. Security Hardening (0.5%)

### Rate Limiting Configuration
```typescript
// src/middleware/rate-limit.ts
import rateLimit from 'express-rate-limit'

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per IP
  message: 'Too many login attempts, try again later',
})

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per IP
})
```

### CORS Configuration
```typescript
// medusa-config.ts
store_cors: process.env.STORE_CORS || "http://localhost:3000,https://yourdomain.com",
admin_cors: process.env.ADMIN_CORS || "http://localhost:7001",
```

### Environment Variables Validation
```typescript
// src/config/env-validator.ts
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  SENTRY_DSN: z.string().url(),
  AWS_ACCESS_KEY_ID: z.string().min(16),
  AWS_SECRET_ACCESS_KEY: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']),
})

envSchema.parse(process.env) // Fails fast on startup if invalid
```

**Tasks:**
- Add rate limiters to all public endpoints
- Validate all environment variables on startup
- Configure CORS for production domains
- Add security headers (Helmet.js)

---

## 3. Production Readiness Checklist (0.5%)

### Health Check Endpoint
```typescript
// src/api/health/route.ts
import { MedusaRequest, MedusaResponse } from "@medusajs/medusa"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version,
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      s3: await checkS3(),
    }
  }
  
  res.json(health)
}
```

### Graceful Shutdown
```typescript
// src/server.ts
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  
  // Close server
  server.close(() => {
    console.log('HTTP server closed')
  })
  
  // Close database connections
  await db.disconnect()
  
  // Close Redis
  await redis.quit()
  
  process.exit(0)
})
```

### Error Tracking Integration
```typescript
// Ensure all errors are tracked
app.use((err, req, res, next) => {
  captureException(err, {
    user: req.user,
    requestId: req.id,
    url: req.url,
  })
  
  log.error('Unhandled error', err)
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
  })
})
```

**Tasks:**
- Implement comprehensive health checks
- Add graceful shutdown handlers
- Ensure all errors are logged and tracked
- Add request correlation IDs

---

## 4. Documentation Polish

### README.md Enhancement
- Architecture diagram
- Setup instructions (production-ready)
- Environment variables reference
- Deployment guide

### API Usage Examples
```markdown
# API Examples

## Authentication
\`\`\`bash
curl -X POST https://api.yourdomain.com/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "user@example.com", "password": "SecurePass123!"}'
\`\`\`

## Create Order
\`\`\`bash
curl -X POST https://api.yourdomain.com/store/orders \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"items": [{"product_id": "prod_123", "quantity": 1}]}'
\`\`\`
```

### Troubleshooting Guide
- Common errors and solutions
- Performance optimization tips
- Debugging strategies

**Tasks:**
- Update README with production examples
- Add API usage documentation
- Create troubleshooting guide
- Document deployment process

---

## Timeline Summary

| Task | Time | Impact |
|------|------|--------|
| **E2E Testing** | 3-4 days | +3% |
| **Load Testing** | 2-3 days | +3% |
| **API Documentation** | 1 day | +1% |
| **Security Hardening** | 0.5 day | +0.5% |
| **Production Checklist** | 0.5 day | +0.5% |

**Total Estimated Time:** 7-9 days
**Final Result:** 100% MNC-Ready ✅

---

## Priority Order

1. **Week 1:** E2E Testing (critical user flows)
2. **Week 2:** Load Testing (performance validation)
3. **Day 8-9:** API Documentation + Security + Polish

This brings you from 92% → 100% MNC readiness!
