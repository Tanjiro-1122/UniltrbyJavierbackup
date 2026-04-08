// api/b44proxy.js — Vercel serverless function that proxies Base44 entity calls
// Supports both:
//   1. Query style: GET /api/b44proxy?path=/UserProfile/123
//   2. Body style:  POST /api/b44proxy { entity, action, id, data }

const APP_ID = "69b332a392004d139d4ba495";
const BASE44_API = `https://app.base44.com/api/apps/${APP_ID}/entities`;
const getToken = () => process.env.BASE44_SERVICE_TOKEN || process.env.BASE44_API_KEY || "";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${getToken()}`,
  };

  try {
    // ── Body-style: { entity, action, id, data } ──────────────────────────────
    if (req.method === "POST" && req.body?.entity && req.body?.action) {
      const { entity, action, id, data } = req.body;

      if (action === "get") {
        if (!id) return res.status(400).json({ error: "id required for get" });
        const r = await fetch(`${BASE44_API}/${entity}/${id}`, { headers });
        const d = await r.json().catch(() => ({}));
        return res.status(r.status).json(d);
      }

      if (action === "update") {
        if (!id) return res.status(400).json({ error: "id required for update" });
        const r = await fetch(`${BASE44_API}/${entity}/${id}`, {
          method: "PUT", headers, body: JSON.stringify(data || {}),
        });
        const d = await r.json().catch(() => ({}));
        return res.status(r.status).json(d);
      }

      if (action === "list") {
        const params = new URLSearchParams(data || {});
        const r = await fetch(`${BASE44_API}/${entity}?${params.toString()}`, { headers });
        const d = await r.json().catch(() => ({}));
        return res.status(r.status).json(d);
      }

      return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    // ── Query-style: ?path=/UserProfile/123 ───────────────────────────────────
    const entityPath = req.query.path || "";
    const targetUrl = `${BASE44_API}${entityPath}`;
    const fetchOptions = { method: req.method, headers };
    if (req.method !== "GET" && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }
    const upstream = await fetch(targetUrl, fetchOptions);
    const upData = await upstream.json().catch(() => ({}));
    return res.status(upstream.status).json(upData);

  } catch (err) {
    console.error("[b44proxy] error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
