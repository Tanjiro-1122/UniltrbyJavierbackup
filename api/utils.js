// api/utils.js - MINIMAL TEST
import OpenAI from "openai";

export default async function handler(req, res) {
  res.status(200).json({ ok: true, test: "works", method: req.method });
}
