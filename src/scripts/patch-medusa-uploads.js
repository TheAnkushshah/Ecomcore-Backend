/**
 * PATCH FOR MEDUSA ADMIN UPLOADS - Buffer Preservation
 * 
 * Medusa's /admin/uploads route converts buffers to strings with .toString("binary")
 * This destroys image bytes. We need to pass the Buffer directly.
 * 
 * Bug location: node_modules/@medusajs/medusa/dist/api/admin/uploads/route.js:16
 * 
 * Apply this patch by running:
 * node src/scripts/patch-medusa-uploads.js
 */

const fs = require('fs');
const path = require('path');

const UPLOADS_ROUTE_PATH = path.join(__dirname, '../../node_modules/@medusajs/medusa/dist/api/admin/uploads/route.js');

console.log('\n🔧 === PATCHING MEDUSA UPLOADS ROUTE ===\n');
console.log(`📍 File: ${UPLOADS_ROUTE_PATH}`);

// Read the current file
let content = fs.readFileSync(UPLOADS_ROUTE_PATH, 'utf8');

// The buggy line
const BUGGY_LINE = `                content: f.buffer.toString("binary"),`;

// The fixed line - Pass buffer directly
const FIXED_LINE = `                content: f.buffer, // 🔹 PATCH: Keep as Buffer, don't stringify`;

// Check if file needs patching
if (content.includes('// 🔹 PATCH: Keep as Buffer')) {
    console.log('✅ Route is already patched!');
    console.log('   No action needed.\n');
    process.exit(0);
}

// Check if we can find the buggy code
if (!content.includes('toString("binary")')) {
    console.error('❌ ERROR: Could not find target code to patch');
    console.error('   The Medusa version may be different.\n');
    process.exit(1);
}

// Create backup
const backupPath = UPLOADS_ROUTE_PATH + '.backup';
if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, content);
    console.log(`📦 Backup created: ${backupPath}`);
}

// Apply patch
content = content.replace(BUGGY_LINE, FIXED_LINE);

// Write patched file
fs.writeFileSync(UPLOADS_ROUTE_PATH, content);

console.log('✅ Patch applied successfully!');
console.log('\n📋 What was fixed:');
console.log('   • Changed: f.buffer.toString("binary")');
console.log('   • To: f.buffer (keep as Buffer)');
console.log('   • Binary integrity preserved!');
console.log('\n🔄 Next steps:');
console.log('   1. Restart Medusa backend');
console.log('   2. Upload a test image');
console.log('   3. Should see: "✅ [S3 PATCH] Buffer detected"');
console.log('\n✅ Done!\n');
