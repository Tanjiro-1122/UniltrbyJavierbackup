#!/usr/bin/env node
/**
 * migrate-base44-to-supabase.mjs
 * Reads from Base44 app 69b332a392004d139d4ba495 and inserts into
 * Supabase project qphizjwoijvjoygihkle.
 *
 * Target tables (singular names):
 *   user_profile   — uses user_id column (maps from apple_user_id / id)
 *   message        — singular
 *   journal_entry  — singular
 *
 * Usage:
 *   BASE44_SERVICE_TOKEN=xxx SUPABASE_URL=https://qphizjwoijvjoygihkle.supabase.co SUPABASE_SERVICE_KEY=xxx node scripts/migrate-base44-to-supabase.mjs
 */

import { createClient } from "@supabase/supabase-js";

const B44_APP_ID = "69b332a392004d139d4ba495";
const B44_BASE    = "https://app.base44.com/api/apps";
const B44_TOKEN   = process.env.BASE44_SERVICE_TOKEN;
const SB_URL      = process.env.SUPABASE_URL;
const SB_KEY      = process.env.SUPABASE_SERVICE_KEY;

if (!B44_TOKEN || !SB_URL || !SB_KEY) {
  console.error("❌ Required env vars: BASE44_SERVICE_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const sb = createClient(SB_URL, SB_KEY);

async function b44List(entity, page = 1, pageSize = 100) {
  const res = await fetch(
    `${B44_BASE}/${B44_APP_ID}/entities/${entity}/records?page=${page}&page_size=${pageSize}`,
    { headers: { Authorization: `Bearer ${B44_TOKEN}`, "Content-Type": "application/json" } }
  );
  if (!res.ok) throw new Error(`Base44 ${entity} fetch failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function fetchAll(entity) {
  const rows = [];
  let page = 1;
  while (true) {
    const data = await b44List(entity, page, 100);
    const items = Array.isArray(data) ? data : (data?.records ?? data?.items ?? []);
    if (!items.length) break;
    rows.push(...items);
    if (items.length < 100) break;
    page++;
  }
  return rows;
}

async function countSb(table) {
  const { count } = await sb.from(table).select("*", { count: "exact", head: true });
  return count ?? 0;
}

async function run() {
  console.log("=== Base44 → Supabase Migration ===\n");

  // ── Pre-flight counts ──────────────────────────────────────────────────
  const before = {
    user_profile:  await countSb("user_profile"),
    message:       await countSb("message"),
    journal_entry: await countSb("journal_entry"),
  };
  console.log("Supabase rows BEFORE:", before);

  // ── 1. UserProfile ─────────────────────────────────────────────────────
  console.log("\n[1/3] Fetching UserProfile from Base44…");
  const b44Users = await fetchAll("UserProfile");
  console.log(`  Base44 has ${b44Users.length} UserProfile records`);

  if (b44Users.length > 0) {
    const mapped = b44Users.map((u) => ({
      user_id:           u.apple_user_id ?? u.id,
      email:             u.email ?? null,
      display_name:      u.display_name ?? u.full_name ?? null,
      avatar_id:         u.avatar_id ?? "aria",
      companion_name:    u.companion_name ?? null,
      personality:       u.personality ?? "empathetic",
      onboarding_done:   u.onboarding_done ?? false,
      tier:              u.tier ?? "free",
      is_premium:        u.is_premium ?? false,
      is_pro:            u.is_pro ?? false,
      msg_count_today:   u.msg_count_today ?? 0,
      streak_count:      u.streak_count ?? 0,
      last_active_at:    u.last_active_at ?? null,
      preferences:       u.preferences ?? {},
      created_at:        u.created_date ?? new Date().toISOString(),
      updated_at:        u.updated_date ?? new Date().toISOString(),
    }));
    const { error } = await sb.from("user_profile").upsert(mapped, { onConflict: "user_id", ignoreDuplicates: true });
    if (error) console.error("  ❌ user_profile insert error:", error.message);
    else console.log(`  ✅ Upserted ${mapped.length} user_profile rows`);
  }

  // ── 2. Messages ────────────────────────────────────────────────────────
  console.log("\n[2/3] Fetching messages from Base44…");
  // Try common Base44 entity names
  let b44Messages = [];
  for (const entity of ["ChatHistory", "Message", "Messages"]) {
    try {
      b44Messages = await fetchAll(entity);
      if (b44Messages.length) { console.log(`  Found ${b44Messages.length} records in entity '${entity}'`); break; }
    } catch { /* try next */ }
  }
  if (!b44Messages.length) console.log("  ⚠️  No message records found in Base44");

  if (b44Messages.length > 0) {
    const mapped = b44Messages.map((m) => ({
      user_id:    m.apple_user_id ?? m.user_id ?? null,
      role:       m.role ?? "user",
      content:    m.content ?? m.body ?? "",
      tier:       m.tier ?? null,
      created_at: m.created_date ?? new Date().toISOString(),
    }));
    const { error } = await sb.from("message").upsert(mapped, { ignoreDuplicates: true });
    if (error) console.error("  ❌ message insert error:", error.message);
    else console.log(`  ✅ Upserted ${mapped.length} message rows`);
  }

  // ── 3. Journal entries ─────────────────────────────────────────────────
  console.log("\n[3/3] Fetching JournalEntry from Base44…");
  let b44Journals = [];
  for (const entity of ["JournalEntry", "JournalEntries", "Journal"]) {
    try {
      b44Journals = await fetchAll(entity);
      if (b44Journals.length) { console.log(`  Found ${b44Journals.length} records in entity '${entity}'`); break; }
    } catch { /* try next */ }
  }
  if (!b44Journals.length) console.log("  ⚠️  No journal records found in Base44");

  if (b44Journals.length > 0) {
    const mapped = b44Journals.map((j) => ({
      user_id:    j.apple_user_id ?? j.user_id ?? null,
      title:      j.title ?? null,
      content:    j.content ?? null,
      mood:       j.mood ?? null,
      tier:       j.tier ?? null,
      created_at: j.created_date ?? new Date().toISOString(),
    }));
    const { error } = await sb.from("journal_entry").upsert(mapped, { ignoreDuplicates: true });
    if (error) console.error("  ❌ journal_entry insert error:", error.message);
    else console.log(`  ✅ Upserted ${mapped.length} journal_entry rows`);
  }

  // ── Post-flight counts ─────────────────────────────────────────────────
  const after = {
    user_profile:  await countSb("user_profile"),
    message:       await countSb("message"),
    journal_entry: await countSb("journal_entry"),
  };
  console.log("\nSupabase rows AFTER:", after);
  console.log("\nDelta:");
  for (const t of Object.keys(before)) {
    const delta = (after[t] ?? 0) - (before[t] ?? 0);
    console.log(`  ${t}: +${delta} rows inserted`);
  }

  console.log("\n✅ Migration complete.");
}

run().catch((e) => { console.error("Fatal:", e); process.exit(1); });
