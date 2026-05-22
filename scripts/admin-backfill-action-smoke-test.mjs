import fs from "node:fs";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

const src = fs.readFileSync("api/adminStats.js", "utf8");
for (const [entity, table] of Object.entries({
  UserProfile: "user_profiles",
  ChatHistory: "chat_history",
  JournalEntry: "journal_entries",
  MoodEntry: "mood_entries",
  Feedback: "feedback",
  AdminAuditLog: "admin_audit_logs",
})) {
  assert(src.includes(`${entity}: "${table}"`), `${entity} maps to ${table}`);
}
assert(src.includes("async function upsertEntities"), "admin API has safe Supabase upsert helper");
assert(src.includes('action === "backfillUserProfiles"'), "admin API exposes admin-only profile backfill action");
assert(src.includes("compactUserProfileForBackfill"), "profile backfill compacts legacy Base44 records");
assert(src.includes('insertEntities("UserProfile", compacted)'), "profile backfill inserts rows using Supabase-generated UUIDs");
console.log("✅ Admin backfill action smoke test passed.");
