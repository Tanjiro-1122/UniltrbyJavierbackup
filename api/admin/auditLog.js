import { B44_ENTITIES, b44Fetch } from "../_b44.js";

const ADMIN_TOKEN = "unfiltr_admin_javier1122_secret";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { adminToken } = req.body || {};
  if (adminToken !== ADMIN_TOKEN) return res.status(401).json({ error: "Unauthorized" });

  try {
    const raw = await b44Fetch(`${B44_ENTITIES}/AdminAuditLog?limit=100`).catch(() => []);
    const entries = Array.isArray(raw) ? raw : (raw.records || raw.data || []);

    const sorted = [...entries].sort((a, b) =>
      (b.timestamp || b.created_date || "").localeCompare(a.timestamp || a.created_date || "")
    );

    return res.status(200).json({ entries: sorted.slice(0, 100) });
  } catch (err) {
    console.error("[admin/auditLog] Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
