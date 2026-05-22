-- Unfiltr Supabase Schema Migration
-- Safe to re-run: uses IF NOT EXISTS and DROP IF EXISTS on policies

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

CREATE TABLE IF NOT EXISTS public.chat_history (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apple_user_id  TEXT NOT NULL,
  messages       JSONB NOT NULL DEFAULT '[]',
  saved_at       TIMESTAMPTZ DEFAULT NOW(),
  tier           TEXT,
  message_count  INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apple_user_id  TEXT NOT NULL,
  title          TEXT,
  content        TEXT,
  mood           TEXT,
  tier           TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.mood_entries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apple_user_id  TEXT NOT NULL,
  mood           INTEGER,
  mood_label     TEXT,
  date           DATE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.streaks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apple_user_id  TEXT UNIQUE NOT NULL,
  count          INTEGER DEFAULT 0,
  last_active    DATE,
  longest        INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.time_capsules (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apple_user_id  TEXT NOT NULL,
  message        TEXT,
  open_date      DATE,
  opened         BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.feedback (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apple_user_id  TEXT,
  email          TEXT,
  message        TEXT,
  type           TEXT DEFAULT 'general',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.companion_memory (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apple_user_id  TEXT NOT NULL,
  key            TEXT,
  value          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_entries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_capsules     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companion_memory  ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe to re-run)
DO $$ 
DECLARE
  tables TEXT[] := ARRAY['user_profiles','chat_history','journal_entries','mood_entries','streaks','time_capsules','feedback','companion_memory'];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS service_role_all ON public.%I', t);
  END LOOP;
END $$;

-- Service role bypass policies
CREATE POLICY service_role_all ON public.user_profiles    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all ON public.chat_history     FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all ON public.journal_entries  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all ON public.mood_entries     FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all ON public.streaks          FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all ON public.time_capsules    FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all ON public.feedback         FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all ON public.companion_memory FOR ALL USING (auth.role() = 'service_role');

-- Phase 2 Base44 -> Supabase parity repair
-- Safe to re-run. Keeps the live admin/API contract aligned with fields that
-- previously existed as Base44 entity properties.
ALTER TABLE IF EXISTS public.user_profiles ADD COLUMN IF NOT EXISTS premium BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS public.user_profiles ADD COLUMN IF NOT EXISTS pro_plan BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS public.user_profiles ADD COLUMN IF NOT EXISTS annual_plan BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS public.user_profiles ADD COLUMN IF NOT EXISTS ultimate_friend BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS public.user_profiles ADD COLUMN IF NOT EXISTS family_plan BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS public.user_profiles ADD COLUMN IF NOT EXISTS trial_active BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS public.user_profiles ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.user_profiles ADD COLUMN IF NOT EXISTS subscription_expires TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.user_profiles ADD COLUMN IF NOT EXISTS subscription_override BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS public.user_profiles ADD COLUMN IF NOT EXISTS subscription_type TEXT;
ALTER TABLE IF EXISTS public.user_profiles ADD COLUMN IF NOT EXISTS revenuecat_customer_id TEXT;
ALTER TABLE IF EXISTS public.user_profiles ADD COLUMN IF NOT EXISTS legacy_base44_id TEXT;
ALTER TABLE IF EXISTS public.user_profiles ADD COLUMN IF NOT EXISTS last_restore_at TIMESTAMPTZ;
ALTER TABLE IF EXISTS public.user_profiles ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS public.user_profiles ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_user_profiles_apple_user_id ON public.user_profiles (apple_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles (email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_revenuecat_customer_id ON public.user_profiles (revenuecat_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_legacy_base44_id ON public.user_profiles (legacy_base44_id);

CREATE TABLE IF NOT EXISTS public.purchase_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apple_user_id TEXT,
  user_email TEXT,
  product_id TEXT,
  transaction_id TEXT,
  amount NUMERIC,
  currency TEXT,
  platform TEXT,
  status TEXT,
  credits_granted INTEGER DEFAULT 0,
  subscription_type TEXT,
  raw_receipt JSONB DEFAULT '{}',
  legacy_base44_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apple_user_id TEXT,
  user_email TEXT,
  page TEXT,
  error_message TEXT,
  error_stack TEXT,
  context JSONB DEFAULT '{}',
  severity TEXT DEFAULT 'error',
  resolved BOOLEAN DEFAULT FALSE,
  legacy_base44_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.chat_history ADD COLUMN IF NOT EXISTS legacy_base44_id TEXT;
ALTER TABLE IF EXISTS public.journal_entries ADD COLUMN IF NOT EXISTS legacy_base44_id TEXT;
ALTER TABLE IF EXISTS public.mood_entries ADD COLUMN IF NOT EXISTS legacy_base44_id TEXT;
ALTER TABLE IF EXISTS public.purchase_audits ADD COLUMN IF NOT EXISTS legacy_base44_id TEXT;
ALTER TABLE IF EXISTS public.error_logs ADD COLUMN IF NOT EXISTS legacy_base44_id TEXT;

CREATE INDEX IF NOT EXISTS idx_chat_history_legacy_base44_id ON public.chat_history (legacy_base44_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_legacy_base44_id ON public.journal_entries (legacy_base44_id);
CREATE INDEX IF NOT EXISTS idx_mood_entries_legacy_base44_id ON public.mood_entries (legacy_base44_id);
CREATE INDEX IF NOT EXISTS idx_purchase_audits_transaction_id ON public.purchase_audits (transaction_id);
CREATE INDEX IF NOT EXISTS idx_purchase_audits_legacy_base44_id ON public.purchase_audits (legacy_base44_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_legacy_base44_id ON public.error_logs (legacy_base44_id);

ALTER TABLE public.purchase_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS service_role_all ON public.purchase_audits;
DROP POLICY IF EXISTS service_role_all ON public.error_logs;
CREATE POLICY service_role_all ON public.purchase_audits FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY service_role_all ON public.error_logs FOR ALL USING (auth.role() = 'service_role');
