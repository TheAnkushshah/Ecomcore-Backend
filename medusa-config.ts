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

// Ensure file service uses the public backend URL instead of defaulting to localhost
process.env.FILE_BACKEND_URL = process.env.FILE_BACKEND_URL || backendUrl
process.env.MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || backendUrl

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
  ],
})
