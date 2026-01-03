/**
 * Product Image Upload Subscriber
 * 
 * Intercepts Medusa's file uploads and redirects to S3
 */

import { type SubscriberConfig } from "@medusajs/framework"
import { logger } from "../modules/logger"
import * as fs from "fs"
import * as path from "path"
import { getS3FileProvider } from "../modules/s3-file-provider"

export default async function productImageUploadSubscriber(
  { event, container }: { event: any; container: any },
): Promise<void> {
  if (event.name === "product.image.created") {
    try {
      const { image } = event.data
      
      logger.info(`📸 Product image created: ${image.id}`)
      
      // Check if this is a localhost/static file
      if (image.url.includes("localhost") || image.url.includes("/static/")) {
        logger.info("🔄 Converting local file to S3...")
        
        const productModuleService = container.resolve("product")
        
        // Extract filename from URL
        const filename = image.url.split("/").pop() || `image-${Date.now()}`
        
        try {
          // Try to read the local file
          const localPath = path.join(process.cwd(), "public", image.url.replace("http://localhost:9000/", ""))
          
          if (fs.existsSync(localPath)) {
            const fileBuffer = fs.readFileSync(localPath)
            
            // Upload to S3
            const s3Provider = getS3FileProvider()
            const { url: s3Url } = await s3Provider.upload({
              filename: filename,
              mimeType: "image/png",
              content: fileBuffer,
            })
            
            // Update database with S3 URL
            const [product] = await productModuleService.listProducts(
              { id: [image.product_id] },
              { relations: ["images"] }
            )
            
            if (product && product.images) {
              const updatedImages = product.images.map((img: any) => 
                img.id === image.id 
                  ? {
                      id: img.id,
                      url: s3Url,
                      metadata: {
                        ...img.metadata,
                        migrated_to_s3: true,
                        migrated_at: new Date().toISOString(),
                        original_local_path: image.url,
                      },
                    }
                  : img
              )
              
              await productModuleService.updateProductImages(
                image.product_id,
                updatedImages
              )
              
              logger.info(`✅ Image migrated to S3: ${s3Url}`)
            }
          } else {
            // File doesn't exist locally, just update URL pattern
            const s3Url = `${process.env.AWS_PUBLIC_URL || `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`}/products/${filename}`
            
            const [product] = await productModuleService.listProducts(
              { id: [image.product_id] },
              { relations: ["images"] }
            )
            
            if (product && product.images) {
              const updatedImages = product.images.map((img: any) => 
                img.id === image.id 
                  ? {
                      id: img.id,
                      url: s3Url,
                      metadata: {
                        ...img.metadata,
                        url_fixed: true,
                        fixed_at: new Date().toISOString(),
                      },
                    }
                  : img
              )
              
              await productModuleService.updateProductImages(
                image.product_id,
                updatedImages
              )
              
              logger.info(`✅ Image URL fixed to S3: ${s3Url}`)
            }
          }
        } catch (migrationError) {
          logger.warn("Could not migrate file, keeping S3 URL pattern:", migrationError)
          
          // Fallback: just update with S3 URL pattern
          const s3Url = `${process.env.AWS_PUBLIC_URL || `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`}/products/${filename}`
          
          const [product] = await productModuleService.listProducts(
            { id: [image.product_id] },
            { relations: ["images"] }
          )
          
          if (product && product.images) {
            const updatedImages = product.images.map((img: any) => 
              img.id === image.id 
                ? {
                    id: img.id,
                    url: s3Url,
                    metadata: {
                      ...img.metadata,
                      url_pattern_fixed: true,
                    },
                  }
                : img
            )
            
            await productModuleService.updateProductImages(
              image.product_id,
              updatedImages
            )
            
            logger.info(`✅ Image URL pattern fixed: ${s3Url}`)
          }
        }
      }
    } catch (error) {
      logger.error("❌ Error in product image upload subscriber:", error)
    }
  }
}

export const config: SubscriberConfig = {
  event: ["product.image.created"],
}
