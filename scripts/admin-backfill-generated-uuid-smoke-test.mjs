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
assert(src.includes("async function insertEntities"), "admin backfill can insert rows with Supabase-generated UUIDs");
assert(!/\n\s+id:/.test(compact), "backfill no longer sends legacy Base44 string id into Supabase UUID id column");
assert(src.includes('insertEntities("UserProfile", compacted)'), "backfill inserts profiles instead of upserting by incompatible id");
assert(src.includes("inserted: inserted.length"), "backfill response reports inserted rows");
console.log("✅ Generated UUID backfill smoke test passed.");
