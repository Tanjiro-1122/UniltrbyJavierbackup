import fs from "node:fs";
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}
const admin = fs.readFileSync("api/adminStats.js", "utf8");
assert(admin.includes("extractMissingSupabaseColumn"), "admin can parse missing Supabase column errors");
assert(admin.includes("delete patch[missingColumn]") && admin.includes("continue;"), "admin retries PATCH without missing columns");
assert(admin.includes("Phase 2 schema repair"), "admin warning points to canonical schema repair");
console.log("✅ Admin schema fallback smoke test passed.");
