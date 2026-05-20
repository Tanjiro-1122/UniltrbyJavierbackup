// src/api/base44Client.js
// Supabase client — replaces @base44/sdk
// Exports the same shape as before so all existing imports still work.

import { UserProfile, ChatHistory, JournalEntry, MoodEntry, Streak, TimeCapsule, Feedback, Companion, Notification } from "@/api/db";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Auth — Apple Sign-In already stores to localStorage.
// This auth layer reads/writes that same localStorage state.
const auth = {
  async me() {
    const appleUserId = localStorage.getItem("unfiltr_apple_user_id");
    const userId      = localStorage.getItem("unfiltr_user_id");
    const email       = localStorage.getItem("unfiltr_user_email") || localStorage.getItem("unfiltr_apple_email") || "";
    const id          = appleUserId || userId;
    if (!id) return null;
    return { id, email, apple_user_id: appleUserId };
  },
  async logout() {
    const keys = [
      "unfiltr_user_id","unfiltr_auth_token","unfiltr_apple_user_id",
      "unfiltr_user_email","unfiltr_apple_email","unfiltr_onboarding_complete",
      "unfiltr_is_premium","unfiltr_is_pro","unfiltr_is_annual","unfiltr_is_family",
      "unfiltr_family_unlimited","unfiltr_family_unlimited_expires_at",
    ];
    keys.forEach(k => localStorage.removeItem(k));
    window.dispatchEvent(new Event("unfiltr_auth_updated"));
    return { success: true };
  },
};

// Custom functions layer — routes to Vercel /api/* serverless functions
const API_BASE = "";
const functions = {
  async invoke(name, body = {}) {
    try {
      const res = await fetch(`${API_BASE}/api/${name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) return { data: null, error: json.error || "API error" };
      if (json.data !== undefined) return { data: json.data, error: null };
      return { data: json, error: null };
    } catch (err) {
      console.error(`[functions] ${name} failed:`, err);
      return { data: null, error: err.message };
    }
  },
};

// Entities — all backed by Supabase now
const entities = {
  UserProfile,
  ChatHistory,
  JournalEntry,
  MoodEntry,
  Streak,
  TimeCapsule,
  Feedback,
  Companion,
  Notification,
};

export const base44 = {
  entities,
  auth,
  functions,
};

export { entities };
export default base44;
