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

for (const field of ["id", "apple_user_id", "email", "display_name", "tier", "is_premium", "premium", "pro_plan", "annual_plan", "ultimate_friend", "family_unlimited", "message_count", "last_seen", "last_active", "created_at", "updated_at"]) {
  assert(compact.includes(`${field}:`), `lean backfill includes ${field}`);
}
for (const legacyField of ["account_delete_requested", "account_paused", "created_date:", "updated_date:", "recovery_backups", "session_memory", "push_token"]) {
  assert(!compact.includes(legacyField), `lean backfill excludes legacy/wide field ${legacyField}`);
}
assert(src.includes("p.created_date || p.created_at"), "admin dashboard maps Supabase created_at fallback");
console.log("✅ Lean admin profile backfill smoke test passed.");
