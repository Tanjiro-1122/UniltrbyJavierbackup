-- Unfiltr Supabase Schema Migration
-- Run this in your Supabase SQL editor: https://hvvrbpvsgjxiicigkwhu.supabase.co

-- UserProfile
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apple_user_id   TEXT UNIQUE,
  email           TEXT,
  display_name    TEXT,
  avatar_id       TEXT DEFAULT 'aria',
  companion_name  TEXT,
  personality     TEXT DEFAULT 'empathetic',
  onboarding_done BOOLEAN DEFAULT FALSE,
  tier            TEXT DEFAULT 'free',
  is_premium      BOOLEAN DEFAULT FALSE,
  is_pro          BOOLEAN DEFAULT FALSE,
  is_annual       BOOLEAN DEFAULT FALSE,
  is_family       BOOLEAN DEFAULT FALSE,
  msg_count_today INTEGER DEFAULT 0,
  msg_reset_date  DATE,
  streak_count    INTEGER DEFAULT 0,
  last_active_at  TIMESTAMPTZ,
  preferences     JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ChatHistory
CREATE TABLE IF NOT EXISTS public.chat_history (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apple_user_id  TEXT NOT NULL,
  messages       JSONB NOT NULL DEFAULT '[]',
  saved_at       TIMESTAMPTZ DEFAULT NOW(),
  tier           TEXT,
  message_count  INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- JournalEntry
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apple_user_id  TEXT NOT NULL,
  title          TEXT,
  content        TEXT,
  mood           TEXT,
  tier           TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- MoodEntry
CREATE TABLE IF NOT EXISTS public.mood_entries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apple_user_id  TEXT NOT NULL,
  mood           INTEGER,
  mood_label     TEXT,
  date           DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Streak
CREATE TABLE IF NOT EXISTS public.streaks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apple_user_id  TEXT UNIQUE NOT NULL,
  count          INTEGER DEFAULT 0,
  last_active    DATE,
  longest        INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- TimeCapsule
CREATE TABLE IF NOT EXISTS public.time_capsules (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apple_user_id  TEXT NOT NULL,
  message        TEXT,
  open_date      DATE,
  opened         BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Feedback
CREATE TABLE IF NOT EXISTS public.feedback (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apple_user_id  TEXT,
  email          TEXT,
  message        TEXT,
  type           TEXT DEFAULT 'general',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Companion memory
CREATE TABLE IF NOT EXISTS public.companion_memory (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apple_user_id  TEXT NOT NULL,
  key            TEXT,
  value          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: enable row-level security on all tables
ALTER TABLE public.user_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_entries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_capsules     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companion_memory  ENABLE ROW LEVEL SECURITY;

-- Service role bypass (used by your Vercel API routes)
CREATE POLICY "service_role_all" ON public.user_profiles    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON public.chat_history     FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON public.journal_entries  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON public.mood_entries     FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON public.streaks          FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON public.time_capsules    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON public.feedback         FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON public.companion_memory FOR ALL USING (auth.role() = 'service_role');
