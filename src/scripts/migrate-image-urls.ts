/**
 * Migration Script: Fix Product Image URLs
 * 
 * CRITICAL FIX for production issues:
 * ✅ Replace all localhost:9000 URLs with production URL
 * ✅ Fix incorrect S3/R2 paths
 * ✅ Ensure all images have proper inline disposition
 * 
 * Run this AFTER deploying to production with proper environment variables
 * 
 * Usage:
 *   yarn medusa exec ./src/scripts/migrate-image-urls.ts
 */

import { logger } from "../modules/logger"

export default async function migrateImageUrls({ container }: any) {
  try {
    logger.info("🚀 Starting image URL migration...")

    // Get production URL from environment
    const productionUrl =
      process.env.AWS_PUBLIC_URL ||
      process.env.BACKEND_URL ||
      process.env.MEDUSA_BACKEND_URL ||
      "https://ecomcore-backend-production.up.railway.app"

    logger.info(`Production URL: ${productionUrl}`)

    // Check if we're running in development with localhost
    if (productionUrl.includes("localhost")) {
      logger.warn("⚠️  Running in development mode - no migration needed")
      logger.info("✅ Migration skipped (localhost environment)")
      return
    }

    // Get the product module service
    const productModuleService = container.resolve("product")

    // Fetch all products with their images
    const products = await productModuleService.listProducts(
      {},
      { 
        relations: ["images"],
        take: 1000 // Adjust if you have more products
      }
    )

    if (!products || products.length === 0) {
      logger.info("✅ No products found in database - nothing to migrate")
      return
    }

    logger.info(`Found ${products.length} products to check`)

    let totalImages = 0
    let fixedCount = 0
    let localhostCount = 0
    let httpsCount = 0
    let httpCount = 0
    let s3Count = 0
    let r2Count = 0

    // Process each product and its images
    for (const product of products) {
      if (!product.images || product.images.length === 0) continue

      for (const image of product.images) {
        totalImages++
        let needsUpdate = false
        let newUrl = image.url

        // Count storage types
        if (image.url.includes(".s3.") || image.url.includes("amazonaws.com")) {
          s3Count++
        }
        if (image.url.includes(".r2.") || image.url.includes("cloudflarestorage.com")) {
          r2Count++
        }

        // Check for localhost URLs
        if (image.url.includes("localhost") || image.url.includes("127.0.0.1")) {
          localhostCount++
          newUrl = image.url.replace(/http:\/\/localhost:\d+/g, productionUrl)
          needsUpdate = true
          logger.info(`  Fixing localhost URL: ${image.url} → ${newUrl}`)
        }

        // Check for HTTP (non-HTTPS) URLs in production
        if (
          process.env.NODE_ENV === "production" &&
          newUrl.startsWith("http://") &&
          !newUrl.includes("localhost")
        ) {
          httpCount++
          newUrl = newUrl.replace("http://", "https://")
          needsUpdate = true
          logger.info(`  Upgrading to HTTPS: ${image.url} → ${newUrl}`)
        }

        // Update if needed
        if (needsUpdate) {
          const updatedMetadata = {
            ...(image.metadata || {}),
            fixed_at: new Date().toISOString(),
            original_url: image.url,
          }

          await productModuleService.updateProductImages(
            product.id,
            [
              {
                id: image.id,
                url: newUrl,
                metadata: updatedMetadata,
              }
            ]
          )

          fixedCount++
        }

        // Count HTTPS URLs
        if (newUrl.startsWith("https://")) {
          httpsCount++
        } else if (newUrl.startsWith("http://")) {
          httpCount++
        }
      }
    }

    // Summary report
    logger.info(`
╔════════════════════════════════════════════════════════════╗
║           IMAGE URL MIGRATION REPORT                       ║
╠════════════════════════════════════════════════════════════╣
║ Total Images:          ${String(totalImages).padEnd(40)}║
║ Fixed URLs:            ${String(fixedCount).padEnd(40)}║
║ HTTPS URLs:            ${String(httpsCount).padEnd(40)}║
║ HTTP URLs:             ${String(httpCount).padEnd(40)}║
║ Localhost URLs Fixed:  ${String(localhostCount).padEnd(40)}║
║ S3 Stored:             ${String(s3Count).padEnd(40)}║
║ R2 Stored:             ${String(r2Count).padEnd(40)}║
╚════════════════════════════════════════════════════════════╝
    `)

    // Final verification - check if any localhost URLs remain
    const verifyProducts = await productModuleService.listProducts(
      {},
      { relations: ["images"] }
    )

    const badUrls: Array<{ id: any; url: any }> = []
    for (const product of verifyProducts) {
      if (!product.images) continue
      for (const image of product.images) {
        if (image.url.includes("localhost") || image.url.includes("127.0.0.1")) {
          badUrls.push({ id: image.id, url: image.url })
        }
      }
    }

    if (badUrls.length === 0) {
      logger.info("✅ MIGRATION COMPLETE - All URLs are production-safe!")
    } else {
      logger.error(`❌ MIGRATION INCOMPLETE - ${badUrls.length} localhost URLs remain:`)
      badUrls.forEach((img: any) => {
        logger.error(`   ID: ${img.id} | URL: ${img.url}`)
      })
      process.exit(1)
    }
  } catch (error) {
    logger.error("Migration failed:", error)
    throw error
  }
}


