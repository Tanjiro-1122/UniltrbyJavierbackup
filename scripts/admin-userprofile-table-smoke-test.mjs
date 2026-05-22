import fs from "node:fs";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

const adminStats = fs.readFileSync("api/adminStats.js", "utf8");

assert(adminStats.includes('UserProfile: "user_profiles"'), "Admin UserProfile entity maps to Supabase user_profiles table");
assert(adminStats.includes('AdminAuditLog: "admin_audit_logs"'), "Admin audit entity maps to Supabase admin_audit_logs table");
assert(adminStats.includes("function resolveAdminTable"), "Admin API resolves legacy entity names before REST calls");
assert(adminStats.includes("const table = resolveAdminTable(entity);") && adminStats.includes("encodeURIComponent(table)"), "Admin REST URL uses resolved Supabase table name");
assert(adminStats.includes("Supabase ${method} ${table} failed"), "Admin Supabase errors report the resolved table name");
assert(adminStats.includes('fetchEntity("UserProfile"') && adminStats.includes('updateEntity("UserProfile"'), "Existing admin action call sites remain stable");
console.log("✅ Admin UserProfile Supabase table smoke test passed.");
