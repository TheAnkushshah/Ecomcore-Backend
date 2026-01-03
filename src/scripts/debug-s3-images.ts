/**
 * Debug Script: Check S3 Image Corruption
 * 
 * Verifies that uploaded images have correct PNG headers
 * PNG files must start with: 89 50 4E 47 0D 0A 1A 0A
 * 
 * Usage: yarn medusa exec ./src/scripts/debug-s3-images.ts
 */

import * as aws from "@aws-sdk/client-s3"

const VALID_PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const PNG_SIGNATURE_HEX = "89 50 4E 47 0D 0A 1A 0A"

async function debugS3Images() {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  const bucket = process.env.AWS_BUCKET_NAME
  const region = process.env.AWS_REGION || "ap-south-1"

  if (!accessKeyId || !secretAccessKey || !bucket) {
    console.error("❌ Missing AWS credentials:")
    console.error("   AWS_ACCESS_KEY_ID:", !!accessKeyId ? "✅" : "❌")
    console.error("   AWS_SECRET_ACCESS_KEY:", !!secretAccessKey ? "✅" : "❌")
    console.error("   AWS_BUCKET_NAME:", bucket || "❌")
    process.exit(1)
  }

  const s3Client = new aws.S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })

  console.log("\n📊 === PNG CORRUPTION DEBUG REPORT ===\n")
  console.log(`🔍 Checking bucket: ${bucket}`)
  console.log(`📍 Region: ${region}`)
  console.log(`✅ Valid PNG signature (hex): ${PNG_SIGNATURE_HEX}\n`)

  try {
    // List all PNG objects in products folder
    const listCommand = new aws.ListObjectsV2Command({
      Bucket: bucket,
      Prefix: "products/",
    })

    const listResponse = await s3Client.send(listCommand)
    const objects = listResponse.Contents || []
    const pngObjects = objects.filter((obj) => obj.Key?.endsWith(".png"))

    if (pngObjects.length === 0) {
      console.log("⚠️  No PNG files found in products/ folder")
      return
    }

    console.log(`📁 Found ${pngObjects.length} PNG file(s) in S3:\n`)

    for (const obj of pngObjects.slice(0, 5)) {
      // Check first 5 files
      const key = obj.Key
      if (!key) continue

      console.log(`📄 ${key}`)
      console.log(`   Size: ${obj.Size} bytes`)

      try {
        // Download first 16 bytes
        const getCommand = new aws.GetObjectCommand({
          Bucket: bucket,
          Key: key,
          Range: "bytes=0-15", // Only read first 16 bytes
        })

        const getResponse = await s3Client.send(getCommand)
        const buffer = await getResponse.Body?.transformToByteArray()

        if (!buffer || buffer.length === 0) {
          console.log(`   ❌ CORRUPTED: Empty file`)
          continue
        }

        const headerBytes = Buffer.from(buffer)
        const headerHex = Array.from(headerBytes)
          .map((byte) => byte.toString(16).toUpperCase().padStart(2, "0"))
          .join(" ")

        // Check PNG signature
        const signature = Buffer.from(buffer.slice(0, 8))
        const isValidPNG = signature.equals(VALID_PNG_SIGNATURE)

        if (isValidPNG) {
          console.log(`   ✅ VALID PNG signature: ${headerHex.substring(0, 23)}`)
        } else {
          console.log(`   ❌ CORRUPTED: Wrong header: ${headerHex.substring(0, 23)}`)
          console.log(`      Expected: ${PNG_SIGNATURE_HEX}`)
        }
      } catch (error) {
        console.log(`   ❌ Error reading: ${error instanceof Error ? error.message : String(error)}`)
      }

      console.log()
    }

    console.log("\n💡 NEXT STEPS:")
    console.log("   1. If all PNGs show ❌ CORRUPTED:")
    console.log("      → Check file-storage.ts uploadFile() method")
    console.log("      → Ensure Body is a Buffer, not a string")
    console.log("      → Add logging: console.log(Buffer.isBuffer(body), body.slice(0, 8))")
    console.log()
    console.log("   2. To fix, update medusa-config.ts file module options:")
    console.log("      → Check that file buffer is not being stringified")
    console.log("      → Verify @medusajs/file-s3 is v2.12.3 (yarn why @medusajs/file-s3)")
    console.log()
  } catch (error) {
    console.error("\n❌ Error:", error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

export default debugS3Images
