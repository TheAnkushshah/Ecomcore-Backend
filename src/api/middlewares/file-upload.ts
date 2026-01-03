/**
 * File Upload Middleware
 * Forces all file uploads to use S3 instead of local filesystem
 */

import { defineMiddlewares } from "@medusajs/framework/http"
import { logger } from "../../modules/logger"
import { initializeFileStorage } from "../../modules/file-storage"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/uploads",
      middlewares: [
        async (req: any, res: any, next: any) => {
          try {
            logger.info("🔹 File upload intercepted - redirecting to S3")

            if (!req.file && !req.files) {
              return next()
            }

            // Initialize S3 storage
            const s3Storage = initializeFileStorage()
            if (!s3Storage) {
              logger.error("❌ S3 not configured - cannot upload")
              return res.status(500).json({
                error: "File storage not configured",
              })
            }

            // Get uploaded file
            const file = req.file || req.files?.[0]
            if (!file) return next()

            try {
              // Convert buffer
              const buffer = Buffer.isBuffer(file.buffer)
                ? file.buffer
                : Buffer.from(file.buffer)

              // Upload to S3
              const { url, key } = await s3Storage.uploadFile(
                buffer,
                file.originalname || file.filename || `file-${Date.now()}`,
                file.mimetype || "application/octet-stream",
                "uploads"
              )

              logger.info(`✅ Uploaded to S3: ${url}`)

              // Override Medusa's response with S3 URL
              req.file = {
                ...file,
                path: url, // S3 URL instead of local path
                filename: key,
                url: url,
              }

              // Continue with S3 URL instead of local
              next()
            } catch (uploadError) {
              logger.error("S3 upload error:", uploadError)
              return res.status(500).json({
                error: "Failed to upload to S3",
                details: uploadError instanceof Error ? uploadError.message : String(uploadError),
              })
            }
          } catch (error) {
            logger.error("File upload middleware error:", error)
            next()
          }
        },
      ],
    },
  ],
})
