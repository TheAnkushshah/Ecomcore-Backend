/**
 * Product Image Upload Endpoint
 * 
 * POST /admin/products/{id}/images
 * 
 * Handles product image uploads with:
 * ✅ Production URL enforcement (NO localhost)
 * ✅ Proper Content-Disposition headers (inline, not attachment)
 * ✅ S3/R2 file storage
 * ✅ Validation & error handling
 * ✅ Database record creation
 */

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { Multer } from "multer"
import { initializeFileStorage } from "../../../../../modules/file-storage"
import { FileUploadSchema } from "../../../../../modules/validation"

declare global {
  namespace Express {
    interface Request {
      user?: { id: string }
      file?: Multer.File
      files?: Multer.File[]
    }
  }
}

interface FileRequest extends MedusaRequest {
  file?: Multer.File
  files?: Multer.File[]
}

export async function POST(
  req: FileRequest,
  res: MedusaResponse
) {
  try {
    const { id: productId } = req.params
    
    // 🔹 Check authentication
    if (!req.user?.id) {
      return res.status(401).json({ 
        error: "Unauthorized: Admin authentication required" 
      })
    }

    // 🔹 Validate product exists
    const productModuleService = req.scope.resolve("product")
    const products = await productModuleService.listProducts(
      { id: productId },
      { relations: ["images"] }
    )
    const product = products[0]

    if (!product) {
      return res.status(404).json({ error: "Product not found" })
    }

    // 🔹 Get uploaded file from request
    const file = req.file || req.files?.[0]

    if (!file) {
      return res.status(400).json({ 
        error: "No file provided. Use multipart/form-data with 'file' field" 
      })
    }

    // 🔹 Validate file metadata
    const fileValidation = FileUploadSchema.safeParse({
      filename: file.originalname || file.filename || "image",
      contentType: file.mimetype || "image/jpeg",
      size: file.size || 0,
    })

    if (!fileValidation.success) {
      return res.status(400).json({
        error: "File validation failed",
        details: fileValidation.error.errors,
      })
    }

    // 🔹 Validate image MIME type
    const mimeType = file.mimetype || "image/jpeg"
    if (!mimeType.startsWith("image/")) {
      return res.status(400).json({
        error: "Invalid file type. Only images allowed.",
        accepted: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      })
    }

    // 🔹 Initialize file storage
    const fileStorage = initializeFileStorage()
    if (!fileStorage) {
      console.error("File storage not configured - S3 credentials missing")
      return res.status(500).json({
        error: "File storage not configured",
        details: "AWS S3 credentials are missing from environment variables",
      })
    }

    // 🔹 Upload file to S3/R2
    const buffer = Buffer.isBuffer(file.buffer)
      ? file.buffer
      : Buffer.from(file.buffer)

    const { url, key } = await fileStorage.uploadFile(
      buffer,
      file.originalname || file.filename || `image-${Date.now()}`,
      mimeType,
      "products"
    )

    // ✅ CRITICAL: Verify URL is production-safe (no localhost)
    if (url.includes("localhost") || url.includes("127.0.0.1")) {
      console.error(`❌ CRITICAL: File stored with localhost URL: ${url}`)
      return res.status(500).json({
        error: "URL generation failed - localhost detected",
        details: "Backend URL environment variables not properly configured",
        hint: "Ensure BACKEND_URL and AWS_PUBLIC_URL are set in production",
      })
    }

    // 🔹 Create image record in database
    const productImageService = req.scope.resolve("product_image") as any
    const imageRecord = await productImageService.create({
      product_id: productId,
      url: url,
      alt_text: file.originalname || "Product image",
      metadata: {
        s3_key: key,
        file_size: file.size,
        mime_type: mimeType,
        uploaded_at: new Date().toISOString(),
        backend_url: process.env.BACKEND_URL || process.env.MEDUSA_BACKEND_URL,
      },
    })

    // 🔹 Log for debugging
    console.log(`✅ Image uploaded: ${url}`)
    console.log(`   Product: ${productId}`)
    console.log(`   Key: ${key}`)
    console.log(`   Size: ${file.size} bytes`)
    console.log(`   MIME: ${mimeType}`)

    return res.status(201).json({
      success: true,
      image: {
        id: imageRecord.id,
        url: url,
        alt_text: imageRecord.alt_text,
        created_at: imageRecord.created_at,
      },
      meta: {
        s3_key: key,
        file_size: file.size,
        mime_type: mimeType,
      },
    })
  } catch (error) {
    console.error("Image upload error:", error)
    return res.status(500).json({
      error: "Image upload failed",
      message: error instanceof Error ? error.message : String(error),
    })
  }
}

/**
 * GET endpoint to list product images
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { id: productId } = req.params

    const productModuleService = req.scope.resolve("product")
    const [product] = await productModuleService.listProducts(
      { id: [productId] },
      { relations: ["images"] }
    )

    if (!product) {
      return res.status(404).json({ error: "Product not found" })
    }

    return res.json({
      images: product.images || [],
      count: (product.images || []).length,
    })
  } catch (error) {
    console.error("Error fetching product images:", error)
    return res.status(500).json({
      error: "Failed to fetch images",
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
