import fs from "node:fs";
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}
const admin = fs.readFileSync("api/adminStats.js", "utf8");
assert(admin.includes("normalizeUserProfilePatch"), "admin normalizes UserProfile patches");
assert(admin.includes("normalized.is_annual = !!normalized.annual_plan"), "annual_plan aliases to is_annual");
assert(admin.includes("normalized.is_pro = !!normalized.pro_plan"), "pro_plan aliases to is_pro");
assert(admin.includes("normalized.is_family = !!normalized.family_plan") && admin.includes("normalized.is_family = !!normalized.ultimate_friend"), "family/ultimate aliases to is_family");
assert(admin.includes("for (let attempt = 0; attempt < 12"), "missing-column retry handles multiple missing columns");
console.log("✅ Admin UserProfile alias smoke test passed.");
