import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { messages, profileId, companionName } = req.body;
    if (!messages?.length || !profileId) return res.status(400).json({ error: "Missing params" });

    const transcript = messages
      .filter(m => m.role !== "system")
      .map(m => `${m.role === "user" ? "User" : companionName || "Companion"}: ${m.content}`)
      .join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "system",
        content: "Summarize this conversation in 2-3 sentences. Focus on emotional themes, key topics, and anything important to remember about the user. Be warm and concise.",
      }, {
        role: "user",
        content: transcript,
      }],
      max_tokens: 200,
    });

    const summary = response.choices[0]?.message?.content || "";
    const date = new Date().toLocaleDateString();

    // Fetch existing profile
    const { data: profile } = await supabase
      .from("user_profile")
      .select("session_memory, memory_summary")
      .eq("id", profileId)
      .single();

    const existing = profile?.session_memory || [];
    const newMemory = [{ date, summary }, ...existing].slice(0, 10);
    const fullSummary = newMemory.map(m => `[${m.date}] ${m.summary}`).join(" | ");

    await supabase
      .from("user_profile")
      .update({ session_memory: newMemory, memory_summary: fullSummary, updated_at: new Date().toISOString() })
      .eq("id", profileId);

    res.status(200).json({ data: { summary } });
  } catch (err) {
    console.error("SummarizeSession error:", err);
    res.status(500).json({ error: err.message });
  }
}
