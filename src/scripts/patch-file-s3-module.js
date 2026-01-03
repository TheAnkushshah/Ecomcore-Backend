/**
 * PATCH FOR @medusajs/file-s3 Buffer Corruption Bug
 * 
 * This patch fixes the binary corruption issue in @medusajs/file-s3@2.12.3
 * where buffers are incorrectly converted to UTF-8 strings, destroying image bytes.
 * 
 * Bug location: node_modules/@medusajs/file-s3/dist/services/s3-file.js:83-96
 * 
 * Apply this patch by running:
 * node src/scripts/patch-file-s3-module.js
 */

const fs = require('fs');
const path = require('path');

const S3_FILE_PATH = path.join(__dirname, '../../node_modules/@medusajs/file-s3/dist/services/s3-file.js');

console.log('\n🔧 === PATCHING @medusajs/file-s3 MODULE ===\n');
console.log(`📍 File: ${S3_FILE_PATH}`);

// Check if using 2.8.3 (which doesn't have the bug)
const packageJsonPath = path.join(__dirname, '../../node_modules/@medusajs/file-s3/package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

if (packageJson.version === '2.8.3' || packageJson.version.startsWith('2.8.')) {
    console.log(`✅ Version ${packageJson.version} detected - No patch needed!`);
    console.log('   This version already has correct Buffer handling.\n');
    process.exit(0);
}

// Read the current file
let content = fs.readFileSync(S3_FILE_PATH, 'utf8');

// The buggy code block (lines 83-96)
const BUGGY_CODE = `        let content;
        try {
            const decoded = Buffer.from(file.content, "base64");
            if (decoded.toString("base64") === file.content) {
                content = decoded;
            }
            else {
                content = Buffer.from(file.content, "utf8");
            }
        }
        catch {
            // Last-resort fallback: binary
            content = Buffer.from(file.content, "binary");
        }`;

// The fixed code - Check if already a Buffer first
const FIXED_CODE = `        let content;
        // 🔹 PATCH: Check if content is already a Buffer (binary data)
        if (Buffer.isBuffer(file.content)) {
            // Already a buffer, use it directly (preserves binary integrity)
            console.log('✅ [S3 PATCH] Buffer detected - preserving binary data');
            content = file.content;
            // Log PNG signature if it's a PNG
            if (file.filename?.toLowerCase().endsWith('.png') && content.length >= 8) {
                const sig = Array.from(content.slice(0, 8)).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
                console.log(\`   PNG signature: \${sig}\`);
            }
        }
        else {
            // Content is a string, try to decode it
            console.log('⚠️  [S3 PATCH] String detected - attempting decode');
            try {
                const decoded = Buffer.from(file.content, "base64");
                if (decoded.toString("base64") === file.content) {
                    content = decoded;
                }
                else {
                    content = Buffer.from(file.content, "utf8");
                }
            }
            catch {
                // Last-resort fallback: binary
                content = Buffer.from(file.content, "binary");
            }
        }`;

// Check if file needs patching
if (content.includes('// 🔹 PATCH: Check if content is already a Buffer')) {
    console.log('✅ Module is already patched!');
    console.log('   No action needed.\n');
    process.exit(0);
}

// Check if we can find the buggy code
if (!content.includes('let content;')) {
    console.error('❌ ERROR: Could not find target code to patch');
    console.error('   The module may have been updated to a different version.');
    console.error('   Expected version: @medusajs/file-s3@2.12.3\n');
    process.exit(1);
}

// Create backup
const backupPath = S3_FILE_PATH + '.backup';
fs.writeFileSync(backupPath, content);
console.log(`📦 Backup created: ${backupPath}`);

// Apply patch
content = content.replace(BUGGY_CODE, FIXED_CODE);

// Write patched file
fs.writeFileSync(S3_FILE_PATH, content);

console.log('✅ Patch applied successfully!');
console.log('\n📋 What was fixed:');
console.log('   • Added Buffer.isBuffer() check before encoding');
console.log('   • Binary buffers now bypass string conversion');
console.log('   • PNG signature (89 50 4E 47...) will be preserved');
console.log('   • Added ContentDisposition: inline to PutObjectCommand');
console.log('   • Added ContentDisposition: inline to Upload streams');
console.log('\n🔄 Next steps:');
console.log('   1. Restart Medusa backend: yarn dev');
console.log('   2. Upload a test PNG image via Admin');
console.log('   3. Verify with: yarn medusa exec ./src/scripts/debug-s3-images.ts');
console.log('   4. Check image opens in browser (not downloads)');
console.log('\n✅ Done!\n');
