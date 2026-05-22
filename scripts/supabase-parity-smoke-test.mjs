import fs from "node:fs";
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}
const schema = fs.readFileSync("supabase/unfiltr_schema.sql", "utf8");
for (const column of [
  "annual_plan",
  "premium",
  "pro_plan",
  "ultimate_friend",
  "family_plan",
  "trial_active",
  "subscription_expires",
  "subscription_override",
  "subscription_type",
  "revenuecat_customer_id",
  "legacy_base44_id",
]) {
  assert(schema.includes(`ADD COLUMN IF NOT EXISTS ${column}`) || schema.includes(`${column} `), `schema includes ${column}`);
}
for (const table of ["purchase_audits", "error_logs", "chat_history", "journal_entries", "mood_entries"]) {
  assert(schema.includes(table), `schema covers ${table}`);
}
console.log("✅ Supabase parity schema smoke test passed.");
