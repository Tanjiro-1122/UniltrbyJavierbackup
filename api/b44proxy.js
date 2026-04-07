// api/b44proxy.js — Vercel serverless function that proxies Base44 entity calls
// This bypasses CORS since the proxy runs server-side

const APP_ID = "69b22f8b58e45d23cafd78d2";
const BASE44_API = `https://app.base44.com/api/apps/${APP_ID}/entities`;

export default async function handler(req, res) {
  // Allow all origins (we control this)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // Path comes as ?path=/UserProfile/123
    const entityPath = req.query.path || "";
    const targetUrl = `${BASE44_API}${entityPath}`;
    
    const headers = { "Content-Type": "application/json" };
    if (req.headers.authorization) {
      headers["Authorization"] = req.headers.authorization;
    }

    const fetchOptions = {
      method: req.method,
      headers,
    };

    if (req.method !== "GET" && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const upstream = await fetch(targetUrl, fetchOptions);
    const data = await upstream.json().catch(() => ({}));
    
    return res.status(upstream.status).json(data);
  } catch (err) {
    console.error("[b44proxy] error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
