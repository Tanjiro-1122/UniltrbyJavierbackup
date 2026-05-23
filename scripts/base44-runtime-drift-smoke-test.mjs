import fs from "node:fs";
import path from "node:path";
const allowed = new Set([
  ".env.example",
  "README.md",
  "UNFILTR_COMPLETE_BUILD_GUIDE.md",
  "scripts/base44-runtime-drift-smoke-test.mjs",
  "scripts/base44-adapter-smoke-test.mjs",
]);
const banned = [/base44\.app\/api/i, /https:\/\/api\.base44\.com/i, /@\/api\/entities/, /from\s+["']@base44\//i, /VITE_BASE44_/, /BASE44_SERVICE_TOKEN/, /BASE44_API_KEY/];
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if ([".git", "node_modules", ".next", "dist", "build", "base44"].includes(entry.name)) return [];
      return walk(full);
    }
    return [full];
  });
}
const offenders = [];
for (const file of walk(".")) {
  const rel = file.replace(/^\.\//, "");
  if (allowed.has(rel)) continue;
  if (!/\.(js|jsx|ts|tsx|mjs|json)$/.test(rel)) continue;
  const text = fs.readFileSync(file, "utf8");
  for (const pattern of banned) if (pattern.test(text)) offenders.push(`${rel} :: ${pattern}`);
}
if (offenders.length) {
  console.error("❌ Direct Base44 runtime endpoints/imports found:\n" + offenders.join("\n"));
  process.exit(1);
}
console.log("✅ No direct Base44 runtime HTTP endpoints or SDK imports detected outside archived Base44 exports.");
