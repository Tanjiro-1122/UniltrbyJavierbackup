import fs from "node:fs";
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}
const adapter = fs.readFileSync("api/_b44.js", "utf8");
assert(adapter.includes("Supabase compatibility adapter"), "Base44 helper is now a Supabase adapter");
assert(!adapter.includes("base44.app/api") && !adapter.includes("api.base44.com"), "adapter has no Base44 HTTP endpoint");
assert(adapter.includes("ENTITY_TABLES") && adapter.includes("UserProfile: \"user_profiles\""), "adapter maps Base44 entity names to Supabase tables");
assert(adapter.includes("method === \"PUT\" ? \"PATCH\""), "adapter converts legacy PUT updates to Supabase PATCH");
console.log("✅ Base44 adapter smoke test passed.");
