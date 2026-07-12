import * as AppleAuthentication from 'expo-apple-authentication'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { loadProfileByAppleUserId, type UserProfile } from './profile'
import { clearSession, readSession, writeSession, type NativeSession } from './session'

type AuthState = {
  loading: boolean
  session: NativeSession | null
  profile: UserProfile | null
  error: string | null
  signInWithApple: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<NativeSession | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)

  const bootstrapProfile = useCallback(async (nextSession: NativeSession | null) => {
    if (!nextSession) {
      setProfile(null)
      return
    }
    const nextProfile = await loadProfileByAppleUserId(nextSession.appleUserId)
    setProfile(nextProfile)
    if (nextProfile?.id && nextProfile.id !== nextSession.profileId) {
      const updated = { ...nextSession, profileId: nextProfile.id, displayName: nextProfile.display_name }
      await writeSession(updated)
      setSession(updated)
    }
  }, [])

  useEffect(() => {
    void (async () => {
      try {
        const existing = await readSession()
        setSession(existing)
        await bootstrapProfile(existing)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Could not restore session')
      } finally {
        setLoading(false)
      }
    })()
  }, [bootstrapProfile])

  const signInWithApple = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })
      const nextSession: NativeSession = {
        appleUserId: credential.user,
        email: credential.email ?? undefined,
        displayName: credential.fullName?.givenName ?? undefined,
      }
      await writeSession(nextSession)
      setSession(nextSession)
      await bootstrapProfile(nextSession)
    } catch (cause) {
      const code = typeof cause === 'object' && cause && 'code' in cause ? String(cause.code) : ''
      if (code !== 'ERR_REQUEST_CANCELED') {
        setError(cause instanceof Error ? cause.message : 'Apple sign-in failed')
      }
    } finally {
      setLoading(false)
    }
  }, [bootstrapProfile])

  const signOut = useCallback(async () => {
    await clearSession()
    setSession(null)
    setProfile(null)
    setError(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    setError(null)
    try {
      await bootstrapProfile(session)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Profile refresh failed')
    }
  }, [bootstrapProfile, session])

  const value = useMemo(
    () => ({ loading, session, profile, error, signInWithApple, signOut, refreshProfile }),
    [loading, session, profile, error, signInWithApple, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
