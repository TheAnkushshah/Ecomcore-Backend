# Railway Deployment Guide

## Issues Fixed

1. **Redis connection errors** - Made Redis optional, won't crash if not configured
2. **CORS errors** - Added fallback values
3. **502 Gateway errors** - Fixed module configuration
4. **Slow responses** - Redis timeout issues resolved

## Required Railway Environment Variables

Set these in your Railway service:

### Critical Variables
```bash
MEDUSA_BACKEND_URL=https://your-backend.up.railway.app
JWT_SECRET=<generate-random-32-char-string>
COOKIE_SECRET=<generate-random-32-char-string>
```

### CORS Variables
```bash
STORE_CORS=https://your-frontend.com,http://localhost:8000
ADMIN_CORS=https://your-backend.up.railway.app
AUTH_CORS=https://your-backend.up.railway.app,https://your-frontend.com
```

### Generate Secrets
Run these commands to generate secure secrets:
```bash
openssl rand -base64 32
openssl rand -base64 32
```

## Redis Setup (Optional but Recommended)

**Option 1: Without Redis (Quick Start)**
- Don't set REDIS_URL
- App will use in-memory cache (resets on restart)
- Good for testing, not recommended for production

**Option 2: With Railway Redis (Recommended)**
1. Add Redis service in Railway
2. Reference it: `REDIS_URL=${{Redis.REDIS_URL}}`
3. Set `REDIS_TLS=false` (Railway Redis doesn't use TLS internally)

## File Storage Issue

**Problem:** Product images don't show in production because Railway containers are ephemeral.

**Solutions:**

### Quick Fix (Temporary)
Images will work until next deployment, then disappear.

### Production Fix (Required)
Use cloud storage:

1. **AWS S3** (Recommended)
2. **Cloudflare R2** (S3-compatible, cheaper)
3. **DigitalOcean Spaces**

Install S3 file plugin:
```bash
cd ecomcore
yarn add @medusajs/file-s3
```

Then update `medusa-config.ts` to include S3 module.

## Deployment Steps

1. **Set environment variables in Railway**
2. **Redeploy** (Railway will auto-deploy on git push)
3. **Wait 2-3 minutes** for startup
4. **Test endpoints:**
   - Health: `https://your-backend.up.railway.app/health`
   - Admin: `https://your-backend.up.railway.app/app`

## Troubleshooting

### 502 Errors
- Check Railway logs for startup errors
- Verify DATABASE_URL is set
- Ensure port binding (Railway sets PORT automatically)

### Login Issues (401/500)
- Verify JWT_SECRET and COOKIE_SECRET are set
- Check CORS variables include your frontend URL
- Clear browser cookies and try again

### Slow Responses (Timeouts)
- Remove REDIS_URL if Redis is misconfigured
- Check database connection
- Railway free tier may have cold starts

### Images Not Loading
- Implement S3 storage (see above)
- Or use external image hosting (Cloudinary, imgix)
