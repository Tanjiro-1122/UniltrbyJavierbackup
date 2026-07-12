import * as AppleAuthentication from 'expo-apple-authentication'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAuth } from '@/lib/auth-context'
import { getMissingMobileConfig } from '@/lib/env'

export default function HomeScreen() {
  const { loading, session, profile, error, signInWithApple, signOut, refreshProfile } = useAuth()
  const missingConfig = getMissingMobileConfig()

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logo}><Text style={styles.logoText}>U</Text></View>
        <Text style={styles.eyebrow}>NATIVE ACCOUNT BOOTSTRAP</Text>
        <Text style={styles.title}>Unfiltr by Javier</Text>

        {loading ? (
          <View style={styles.card}><ActivityIndicator /><Text style={styles.muted}>Restoring your secure session…</Text></View>
        ) : session ? (
          <>
            <View style={styles.card}>
              <Text style={styles.label}>Signed in</Text>
              <Text style={styles.value}>{profile?.display_name || session.displayName || 'Unfiltr member'}</Text>
              <Text style={styles.muted}>{session.email || 'Apple private relay email'}</Text>
              <Text style={styles.muted}>Profile: {profile?.id || 'not found yet'}</Text>
              <Text style={styles.muted}>Plan: {profile?.is_premium || profile?.premium ? 'Premium' : 'Free'}</Text>
            </View>
            <Pressable style={styles.primaryButton} onPress={() => void refreshProfile()}>
              <Text style={styles.primaryText}>Refresh profile</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={() => void signOut()}>
              <Text style={styles.secondaryText}>Sign out</Text>
            </Pressable>
          </>
        ) : (
          <View style={styles.card}>
            <Text style={styles.value}>Continue with your existing Unfiltr account</Text>
            <Text style={styles.muted}>The native app uses the same Apple identity anchor and user profile records as the live app.</Text>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
              cornerRadius={14}
              style={styles.appleButton}
              onPress={() => void signInWithApple()}
            />
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {missingConfig.length ? (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>Profile loading needs public configuration</Text>
            {missingConfig.map((item) => <Text key={item} style={styles.warningText}>• {item}</Text>)}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#090811' },
  content: { flexGrow: 1, padding: 24, paddingTop: 42, paddingBottom: 40 },
  logo: { width: 76, height: 76, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#6D4AFF', marginBottom: 28 },
  logoText: { color: '#FFF', fontSize: 34, fontWeight: '800' },
  eyebrow: { color: '#9E8CFF', fontSize: 12, fontWeight: '800', letterSpacing: 1.8, marginBottom: 10 },
  title: { color: '#FFF', fontSize: 34, fontWeight: '800', marginBottom: 24 },
  card: { backgroundColor: '#151321', borderWidth: 1, borderColor: '#29243B', borderRadius: 22, padding: 20, marginBottom: 16 },
  label: { color: '#9E8CFF', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  value: { color: '#FFF', fontSize: 22, fontWeight: '800', marginTop: 10 },
  muted: { color: '#B9B4C8', fontSize: 14, lineHeight: 21, marginTop: 8 },
  appleButton: { height: 54, marginTop: 22 },
  primaryButton: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#7454FF', marginBottom: 12 },
  primaryText: { color: '#FFF', fontWeight: '800' },
  secondaryButton: { minHeight: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#3B3550' },
  secondaryText: { color: '#D8D2E8', fontWeight: '700' },
  error: { color: '#FF7F8C', marginTop: 16 },
  warningCard: { backgroundColor: '#251F14', borderRadius: 18, padding: 18, marginTop: 18 },
  warningTitle: { color: '#F2C66D', fontWeight: '800', marginBottom: 8 },
  warningText: { color: '#E8D8B1', fontFamily: 'Courier', fontSize: 12, lineHeight: 20 },
})
