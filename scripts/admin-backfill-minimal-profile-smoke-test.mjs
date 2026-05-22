import fs from "node:fs";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

const src = fs.readFileSync("api/adminStats.js", "utf8");
const compact = src.slice(src.indexOf("function compactUserProfileForBackfill"), src.indexOf("export default async function handler"));
for (const field of ["apple_user_id", "email", "display_name", "tier", "created_at", "updated_at"]) {
  assert(compact.includes(`${field}:`), `minimal backfill includes ${field}`);
}
for (const unsupported of ["annual_plan:", "is_premium:", "message_count:", "last_seen:", "last_active:", "account_delete_requested", "recovery_backups"]) {
  assert(!compact.includes(unsupported), `minimal backfill excludes ${unsupported}`);
}
assert(!/\n\s+id:/.test(compact), "minimal backfill excludes legacy id field");
console.log("✅ Minimal admin profile backfill smoke test passed.");
