import fs from "node:fs";

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

const adminStats = fs.readFileSync("api/adminStats.js", "utf8");
const b44 = fs.readFileSync("api/_b44.js", "utf8");

assert(b44.includes("DEPRECATED"), "Base44 helper is explicitly deprecated");
assert(!adminStats.includes("b44Fetch") && !adminStats.includes("B44_ENTITIES"), "adminStats no longer imports deprecated Base44 helpers");
assert(adminStats.includes("SUPABASE_URL") && adminStats.includes("/rest/v1/"), "adminStats reads data through Supabase REST");
assert(adminStats.includes("safeAdminError"), "adminStats has overview-safe error messages");
assert(adminStats.includes("Admin overview failed to load"), "overview catch path is labeled clearly");
console.log("✅ Admin stats Supabase smoke test passed.");
