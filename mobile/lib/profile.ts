import { getPublicEnv } from './env'

export type UserProfile = {
  id: string
  apple_user_id?: string
  display_name?: string
  email?: string
  is_premium?: boolean
  premium?: boolean
  companion_id?: string
}

export async function loadProfileByAppleUserId(appleUserId: string): Promise<UserProfile | null> {
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv()
  if (!supabaseUrl || !supabaseAnonKey) return null

  const query = new URLSearchParams({
    apple_user_id: `eq.${appleUserId}`,
    select: '*',
    limit: '1',
  })

  const response = await fetch(`${supabaseUrl}/rest/v1/user_profiles?${query.toString()}`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Profile load failed (${response.status})`)
  }

  const rows = (await response.json()) as UserProfile[]
  return rows[0] ?? null
}
