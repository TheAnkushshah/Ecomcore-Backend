import { loadEnv, defineConfig } from "@medusajs/framework/utils"


loadEnv(process.env.NODE_ENV || "development", process.cwd())


// Initialize Sentry in production
if (process.env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
  require("./src/modules/sentry-config").initializeSentry()
}


// 🔹 Set the backend URL - prioritize BACKEND_URL over Railway's public domain
const backendUrl = process.env.BACKEND_URL ||
                   process.env.MEDUSA_BACKEND_URL ||
                   (process.env.NODE_ENV === "production"
                     ? "https://ecomcore-backend-production.up.railway.app"
                     : "http://localhost:9000")


// Ensure file service uses S3, not localhost
const fileBackendUrl = process.env.AWS_PUBLIC_URL ||
                       (process.env.AWS_BUCKET_NAME && process.env.AWS_REGION
                         ? `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`
                         : backendUrl)


// Override file backend to always use S3/production URL
process.env.FILE_BACKEND_URL = fileBackendUrl
process.env.MEDUSA_BACKEND_URL = backendUrl

// 🔹 DEBUG: Check S3 env vars
console.log("=== S3 FILE SERVICE DEBUG ===");
console.log("AWS_ACCESS_KEY_ID:", !!process.env.AWS_ACCESS_KEY_ID ? "✅" : "❌");
console.log("AWS_SECRET_ACCESS_KEY:", !!process.env.AWS_SECRET_ACCESS_KEY ? "✅" : "❌");
console.log("AWS_BUCKET_NAME:", process.env.AWS_BUCKET_NAME || "❌");
console.log("AWS_REGION:", process.env.AWS_REGION || "❌");
console.log("FILE_BACKEND_URL:", process.env.FILE_BACKEND_URL || "❌");
console.log("=============================");


module.exports = defineConfig({
  admin: {
    backendUrl,
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
  },


  projectConfig: {
    workerMode: process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server",
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,


    http: {
      storeCors: process.env.STORE_CORS || "",
      adminCors: process.env.ADMIN_CORS || "",
      authCors: process.env.AUTH_CORS || "",
      jwtSecret: process.env.JWT_SECRET || "",
      cookieSecret: process.env.COOKIE_SECRET || "",
    },
  },


  modules: [
    ...(process.env.REDIS_URL
      ? [
          {
            resolve: "@medusajs/medusa/cache-redis",
            options: {
              redisUrl: process.env.REDIS_URL,
              ttl: 30,
            },
          },
          {
            resolve: "@medusajs/medusa/event-bus-redis",
            options: {
              redisUrl: process.env.REDIS_URL,
            },
          },
          {
            resolve: "@medusajs/medusa/workflow-engine-redis",
            options: {
              redis: {
                url: process.env.REDIS_URL,
              },
            },
          },
        ]
      : []),
    // 🔹 File Service with S3 Provider + DEBUG LOGGING
    ...(process.env.AWS_ACCESS_KEY_ID && 
        process.env.AWS_SECRET_ACCESS_KEY && 
        process.env.AWS_BUCKET_NAME
      ? [
          {
            resolve: "@medusajs/medusa/file",
            options: {
              providers: [
                {
                  resolve: "@medusajs/file-s3",
                  id: "s3",
                  options: {
                    file_url: process.env.AWS_PUBLIC_URL || 
                             `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION || "ap-south-1"}.amazonaws.com`,
                    access_key_id: process.env.AWS_ACCESS_KEY_ID,
                    secret_access_key: process.env.AWS_SECRET_ACCESS_KEY,
                    region: process.env.AWS_REGION || "ap-south-1",
                    bucket: process.env.AWS_BUCKET_NAME,
                    cache_control: "max-age=31536000",
                    acl: "public-read",
                    // ✅ CRITICAL FIXES
                    force_path_style: true,
                    signature_version: "v4",
                    // ✅ DEBUG LOGGING - Will show exactly what's happening
                    logger: {
                      level: "debug"
                    },
                  },
                },
              ],
            },
          },
        ]
      : []),
  ],
})
