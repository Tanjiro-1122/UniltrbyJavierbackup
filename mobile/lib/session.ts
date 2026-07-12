import * as SecureStore from 'expo-secure-store'

const KEYS = {
  appleUserId: 'unfiltr_apple_user_id',
  email: 'unfiltr_apple_email',
  profileId: 'userProfileId',
  displayName: 'unfiltr_display_name',
} as const

export type NativeSession = {
  appleUserId: string
  email?: string
  profileId?: string
  displayName?: string
}

export async function readSession(): Promise<NativeSession | null> {
  const appleUserId = await SecureStore.getItemAsync(KEYS.appleUserId)
  if (!appleUserId) return null

  const [email, profileId, displayName] = await Promise.all([
    SecureStore.getItemAsync(KEYS.email),
    SecureStore.getItemAsync(KEYS.profileId),
    SecureStore.getItemAsync(KEYS.displayName),
  ])

  return {
    appleUserId,
    email: email || undefined,
    profileId: profileId || undefined,
    displayName: displayName || undefined,
  }
}

export async function writeSession(session: NativeSession): Promise<void> {
  await SecureStore.setItemAsync(KEYS.appleUserId, session.appleUserId)
  if (session.email) await SecureStore.setItemAsync(KEYS.email, session.email)
  if (session.profileId) await SecureStore.setItemAsync(KEYS.profileId, session.profileId)
  if (session.displayName) await SecureStore.setItemAsync(KEYS.displayName, session.displayName)
}

export async function clearSession(): Promise<void> {
  await Promise.all(Object.values(KEYS).map((key) => SecureStore.deleteItemAsync(key)))
}
