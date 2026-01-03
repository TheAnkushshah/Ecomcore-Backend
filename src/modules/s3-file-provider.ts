/**
 * Custom S3 File Provider for Medusa
 * Forces all file uploads to go directly to S3
 */

import * as aws from "@aws-sdk/client-s3"
import { Upload } from "@aws-sdk/lib-storage"
import { Readable } from "stream"
import { logger } from "./logger"

export class CustomS3FileProvider {
  private s3Client: aws.S3Client
  private bucket: string
  private region: string
  private publicUrl: string

  constructor() {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_BUCKET_NAME) {
      throw new Error("AWS credentials not configured")
    }

    this.bucket = process.env.AWS_BUCKET_NAME
    this.region = process.env.AWS_REGION || "us-east-1"
    this.publicUrl = process.env.AWS_PUBLIC_URL || 
      `https://${this.bucket}.s3.${this.region}.amazonaws.com`

    this.s3Client = new aws.S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    })

    logger.info("✅ S3 File Provider initialized")
  }

  /**
   * Upload file to S3
   */
  async upload(
    fileData: {
      filename: string
      mimeType: string
      content: Buffer | Readable
    }
  ): Promise<{ key: string; url: string }> {
    try {
      const key = `products/${Date.now()}-${fileData.filename}`

      const upload = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.bucket,
          Key: key,
          Body: fileData.content as Buffer | Readable,
          ContentType: fileData.mimeType,
          ContentDisposition: "inline", // 🔹 CRITICAL: Images open, not download
          ACL: "public-read",
        },
      })

      await upload.done()

      const url = `${this.publicUrl}/${key}`

      logger.info(`✅ File uploaded to S3: ${url}`)

      return { key, url }
    } catch (error) {
      logger.error("S3 upload failed:", error)
      throw new Error(`S3 upload failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Delete file from S3
   */
  async delete(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new aws.DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      )
      logger.info(`✅ Deleted from S3: ${key}`)
    } catch (error) {
      logger.error("S3 delete failed:", error)
    }
  }

  /**
   * Get public URL for key
   */
  getUrl(key: string): string {
    return `${this.publicUrl}/${key}`
  }
}

let instance: CustomS3FileProvider | null = null

export function getS3FileProvider(): CustomS3FileProvider {
  if (!instance) {
    instance = new CustomS3FileProvider()
  }
  return instance
}
