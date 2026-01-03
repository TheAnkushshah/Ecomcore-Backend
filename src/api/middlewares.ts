/**
 * File Upload Middleware - DEBUG ONLY
 * 
 * This middleware logs file upload details for debugging.
 * It does NOT interfere with the upload process.
 */

import { defineMiddlewares } from "@medusajs/framework/http"
import type {
  MedusaRequest,
  MedusaResponse,
  MedusaNextFunction,
} from "@medusajs/framework/http"

/**
 * Log upload attempts (non-intrusive)
 */
async function logFileUpload(
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction
) {
  const contentType = req.headers["content-type"] || ""
  
  if (contentType.includes("multipart/form-data")) {
    console.log("\n🔍 === FILE UPLOAD REQUEST ===")
    console.log(`📍 Path: ${req.path}`)
    console.log(`📝 Method: ${req.method}`)
    console.log(`📦 Content-Type: ${contentType}`)
    console.log("==============================\n")
  }
  
  // Don't interfere with request processing
  next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/uploads*",
      middlewares: [logFileUpload],
    },
  ],
})
