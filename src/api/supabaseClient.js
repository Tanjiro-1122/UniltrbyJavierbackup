import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://qphizjwoijvjoygihkle.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwaGl6andvaWp2am95Z2loa2xlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3ODUzOTgsImV4cCI6MjA4OTM2MTM5OH0.EbskqMiKsJ2npZj7hSWUOIvmJaro4mmeaC_2rNxD40Q";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// ─── Auth helpers ─────────────────────────────────────────────────────────────
export const signUp = (email, password, metadata = {}) =>
  supabase.auth.signUp({ email, password, options: { data: metadata } });

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password });

export const signOut = () => supabase.auth.signOut();

export const getUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const onAuthStateChange = (callback) =>
  supabase.auth.onAuthStateChange(callback);

// ─── Functions — calls backend /api/* routes ──────────────────────────────────
const API_BASE = import.meta.env.VITE_API_BASE || "";

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
      return { data: json.data ?? json, error: null };
    } catch (err) {
      console.error(`Function ${name} failed:`, err);
      return { data: null, error: err.message };
    }
  },
};

// ─── Integrations shim — replaces base44.integrations.Core ───────────────────
const integrations = {
  Core: {
    async InvokeLLM({ prompt, response_json_schema, model = "gpt-4o-mini" }) {
      try {
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, response_json_schema, model, mode: "invoke" }),
        });
        if (!res.ok) throw new Error("InvokeLLM failed");
        const json = await res.json();
        return json.data ?? json;
      } catch (err) {
        console.error("InvokeLLM error:", err);
        return null;
      }
    },

    async UploadFile({ file, fileName }) {
      try {
        const name = fileName || `upload_${Date.now()}_${(file.name || "file")}`;
        const { data, error } = await supabase.storage
          .from("uploads")
          .upload(name, file, { upsert: true });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(data.path);
        return { file_url: urlData.publicUrl };
      } catch (err) {
        console.error("UploadFile error:", err);
        return { file_url: null };
      }
    },
  },
};

// ─── Generic entity helpers (mirrors Base44 API shape) ───────────────────────
const makeEntity = (tableName) => ({
  async list(query = {}) {
    let q = supabase.from(tableName).select("*");
    Object.entries(query).forEach(([k, v]) => { q = q.eq(k, v); });
    const { data, error } = await q.order("created_date", { ascending: false }).catch(() =>
      q.order("id", { ascending: false })
    );
    if (error) throw error;
    return data || [];
  },

  async get(id) {
    const { data, error } = await supabase.from(tableName).select("*").eq("id", id).single();
    if (error) throw error;
    return data;
  },

  async create(payload) {
    const { data, error } = await supabase.from(tableName).insert(payload).select().single();
    if (error) throw error;
    return data;
  },

  async update(id, payload) {
    const { data, error } = await supabase
      .from(tableName)
      .update({ ...payload, updated_date: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from(tableName).delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  async filter(params = {}) {
    let q = supabase.from(tableName).select("*");
    Object.entries(params).forEach(([k, v]) => { q = q.eq(k, v); });
    const { data, error } = await q.order("created_date", { ascending: false }).catch(() =>
      q.order("id", { ascending: false })
    );
    if (error) throw error;
    return data || [];
  },
});

// ─── Entities ─────────────────────────────────────────────────────────────────
export const entities = {
  Companion:    makeEntity("companion"),
  Message:      makeEntity("message"),
  UserProfile:  makeEntity("user_profile"),
  Feedback:     makeEntity("feedback"),
  JournalEntry: makeEntity("journal_entry"),
};

// ─── Drop-in replacement for base44 ──────────────────────────────────────────
export const base44 = {
  entities,
  functions,
  integrations,
  auth: {
    getUser,
    signUp,
    signIn,
    signOut,
    onAuthStateChange,
    logout: (redirectUrl) => {
      signOut().then(() => {
        window.location.replace(redirectUrl || "/welcome");
      });
    },
    redirectToLogin: () => {
      window.location.replace("/onboarding/consent");
    },
  },
};

export default supabase;
