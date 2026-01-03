import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3"

export default async function () {
  const client = new S3Client({ region: process.env.AWS_REGION || "ap-south-1" })
  
  console.log("\n📦 === S3 BUCKET CONTENTS ===\n")
  console.log(`Bucket: ${process.env.AWS_BUCKET_NAME}`)
  console.log(`Region: ${process.env.AWS_REGION}\n`)

  try {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: process.env.AWS_BUCKET_NAME,
        MaxKeys: 50,
      })
    )

    if (response.Contents && response.Contents.length > 0) {
      console.log(`Found ${response.Contents.length} objects:\n`)
      response.Contents.forEach((obj) => {
        const sizeMB = ((obj.Size || 0) / 1024).toFixed(2)
        const date = obj.LastModified?.toLocaleString() || "unknown"
        console.log(`  📄 ${obj.Key}`)
        console.log(`     Size: ${sizeMB} KB | Modified: ${date}\n`)
      })
    } else {
      console.log("⚠️  Bucket is empty or no objects found")
    }
  } catch (error) {
    console.error("❌ Error listing S3 objects:", error)
  }
}
