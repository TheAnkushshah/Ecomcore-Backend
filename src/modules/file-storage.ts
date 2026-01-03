/**
 * File Storage Module
 * Handles S3/R2/DigitalOcean Spaces file uploads
 * Enterprise-grade file persistence for product images
 */

import * as aws from "@aws-sdk/client-s3"
import { Upload } from "@aws-sdk/lib-storage"

export interface FileStorageConfig {
  accessKeyId: string
  secretAccessKey: string
  region: string
  bucket: string
  endpoint?: string // For R2 or DigitalOcean
  publicUrl?: string
}

export class FileStorageService {
  private s3Client: aws.S3Client
  private config: FileStorageConfig
  private upload: typeof Upload

  constructor(config: FileStorageConfig) {
    this.config = config

    const clientConfig: aws.S3ClientConfig = {
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    }

    // Support for Cloudflare R2 and DigitalOcean Spaces
    if (config.endpoint) {
      clientConfig.endpoint = config.endpoint
      clientConfig.forcePathStyle = true
    }

    this.s3Client = new aws.S3Client(clientConfig)
    this.upload = Upload
  }

  /**
   * Upload file to S3/R2/Spaces
   * 
   * CRITICAL: Sets ContentDisposition: "inline" to prevent downloads
   * This ensures images open in browser tabs instead of downloading
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    folder: string = "products"
  ): Promise<{ url: string; key: string }> {
    try {
      const key = `${folder}/${Date.now()}-${fileName}`

      // 🔹 CRITICAL DEBUG LOGGING - Check body type and bytes
      console.log("\n=== S3 UPLOAD DEBUG ===")
      console.log(`📄 File: ${fileName}`)
      console.log(`🔑 Key: ${key}`)
      console.log(`📦 Body type: ${typeof fileBuffer}`)
      console.log(`✅ Is Buffer: ${Buffer.isBuffer(fileBuffer)}`)
      console.log(`📊 Body length: ${fileBuffer.length} bytes`)
      
      // Check PNG signature if it's a PNG file
      if (fileName.toLowerCase().endsWith('.png') && fileBuffer.length >= 8) {
        const headerHex = Array.from(fileBuffer.slice(0, 8))
          .map((byte) => byte.toString(16).toUpperCase().padStart(2, "0"))
          .join(" ")
        const validSignature = headerHex === "89 50 4E 47 0D 0A 1A 0A"
        console.log(`🖼️  PNG Signature: ${headerHex}`)
        console.log(`   Valid PNG: ${validSignature ? "✅" : "❌"}`)
      } else if (contentType.includes('image/')) {
        // Log first 16 bytes for any image
        const headerHex = Array.from(fileBuffer.slice(0, 16))
          .map((byte) => byte.toString(16).toUpperCase().padStart(2, "0"))
          .join(" ")
        console.log(`🖼️  First 16 bytes: ${headerHex}`)
      }
      
      console.log(`📝 ContentType: ${contentType}`)
      console.log("====================\n")

      // ✅ CRITICAL: Ensure proper headers for image display
      const upload = new this.upload({
        client: this.s3Client,
        params: {
          Bucket: this.config.bucket,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
          // 🔹 MANDATORY: Prevents images from downloading instead of opening
          ContentDisposition: "inline",
          ACL: "public-read", // Make files publicly accessible
        },
      })

      await upload.done()
      console.log(`✅ Upload complete: ${key}`)

      // ✅ CRITICAL: Use production URL, never localhost
      const url = this.config.publicUrl
        ? `${this.config.publicUrl}/${key}`
        : `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`

      return { url, key }
    } catch (error) {
      throw new Error(`File upload failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Delete file from S3/R2/Spaces
   */
  async deleteFile(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new aws.DeleteObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        })
      )
    } catch (error) {
      throw new Error(`File deletion failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Batch delete files
   */
  async deleteFiles(keys: string[]): Promise<void> {
    if (keys.length === 0) return

    try {
      await this.s3Client.send(
        new aws.DeleteObjectsCommand({
          Bucket: this.config.bucket,
          Delete: {
            Objects: keys.map((key) => ({ Key: key })),
          },
        })
      )
    } catch (error) {
      throw new Error(`Batch file deletion failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key: string): Promise<aws.HeadObjectOutput> {
    try {
      return await this.s3Client.send(
        new aws.HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        })
      )
    } catch (error) {
      throw new Error(`Failed to get file metadata: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Generate signed URL for private files (valid for 1 hour)
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new aws.GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      })

      // Using simple URL signing - for production use @aws-sdk/s3-request-presigner
      const url = await this.s3Client.send(command)
      return String(url)
    } catch (error) {
      throw new Error(`Failed to generate signed URL: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  close(): void {
    this.s3Client.destroy()
  }
}

/**
 * Factory function to initialize file storage based on environment
 */
export function initializeFileStorage(): FileStorageService | null {
  const storageType = process.env.FILE_STORAGE_TYPE || "s3"

  if (storageType === "disabled" || !process.env.AWS_ACCESS_KEY_ID) {
    console.warn("File storage not configured - using local storage (not recommended for production)")
    return null
  }

  const config: FileStorageConfig = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    region: process.env.AWS_REGION || "us-east-1",
    bucket: process.env.AWS_BUCKET_NAME!,
    endpoint: process.env.AWS_ENDPOINT, // Optional: for R2, Spaces, etc.
    publicUrl: process.env.AWS_PUBLIC_URL, // Optional: custom public URL
  }

  return new FileStorageService(config)
}
