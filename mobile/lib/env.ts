type PublicEnv = {
  webAppUrl: string
  apiBaseUrl?: string
  supabaseUrl?: string
  supabaseAnonKey?: string
}

function optional(value: string | undefined): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

export function getPublicEnv(): PublicEnv {
  return {
    webAppUrl:
      optional(process.env.EXPO_PUBLIC_WEB_APP_URL) ??
      'https://unfiltrbyjavier2.vercel.app',
    apiBaseUrl: optional(process.env.EXPO_PUBLIC_API_BASE_URL),
    supabaseUrl: optional(process.env.EXPO_PUBLIC_SUPABASE_URL),
    supabaseAnonKey: optional(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
  }
}

export function getMissingMobileConfig(): string[] {
  const env = getPublicEnv()
  const missing: string[] = []

  if (!env.apiBaseUrl) missing.push('EXPO_PUBLIC_API_BASE_URL')
  if (!env.supabaseUrl) missing.push('EXPO_PUBLIC_SUPABASE_URL')
  if (!env.supabaseAnonKey) missing.push('EXPO_PUBLIC_SUPABASE_ANON_KEY')

  return missing
}
