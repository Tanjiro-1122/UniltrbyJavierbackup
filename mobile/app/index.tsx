import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { getMissingMobileConfig, getPublicEnv } from '@/lib/env'

type ConnectionState = 'idle' | 'checking' | 'online' | 'offline'

export default function HomeScreen() {
  const env = useMemo(() => getPublicEnv(), [])
  const missingConfig = useMemo(() => getMissingMobileConfig(), [])
  const [connection, setConnection] = useState<ConnectionState>('idle')
  const [detail, setDetail] = useState('Not checked yet')

  const checkConnection = useCallback(async () => {
    setConnection('checking')
    setDetail('Contacting the current Unfiltr production app…')

    try {
      const response = await fetch(env.webAppUrl, {
        method: 'GET',
        headers: { Accept: 'text/html' },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      setConnection('online')
      setDetail(`Production responded successfully (${response.status})`)
    } catch (error) {
      setConnection('offline')
      setDetail(error instanceof Error ? error.message : 'Unknown connection error')
    }
  }, [env.webAppUrl])

  const statusLabel = {
    idle: 'Ready to test',
    checking: 'Checking…',
    online: 'Connected',
    offline: 'Connection failed',
  }[connection]

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>U</Text>
        </View>

        <Text style={styles.eyebrow}>NATIVE FOUNDATION</Text>
        <Text style={styles.title}>Unfiltr by Javier</Text>
        <Text style={styles.subtitle}>
          The first Expo screen is running from the same repository as the live Vercel app.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Production connection</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                connection === 'online' && styles.statusDotOnline,
                connection === 'offline' && styles.statusDotOffline,
              ]}
            />
            <Text style={styles.statusText}>{statusLabel}</Text>
          </View>
          <Text style={styles.detail}>{detail}</Text>
          <Text style={styles.url}>{env.webAppUrl}</Text>

          <Pressable
            accessibilityRole="button"
            disabled={connection === 'checking'}
            onPress={checkConnection}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              connection === 'checking' && styles.buttonDisabled,
            ]}
          >
            {connection === 'checking' ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.buttonText}>Test production connection</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Mobile configuration</Text>
          {missingConfig.length === 0 ? (
            <Text style={styles.successText}>All required public settings are present.</Text>
          ) : (
            <>
              <Text style={styles.warningText}>
                Native authentication remains locked until these public values are configured:
              </Text>
              {missingConfig.map((name) => (
                <Text key={name} style={styles.configItem}>
                  • {name}
                </Text>
              ))}
            </>
          )}
        </View>

        <Text style={styles.footer}>
          Next: connect the existing account session and load the signed-in user profile.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090811',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 42,
    paddingBottom: 40,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6D4AFF',
    marginBottom: 28,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '800',
  },
  eyebrow: {
    color: '#9E8CFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
  },
  subtitle: {
    color: '#B9B4C8',
    fontSize: 16,
    lineHeight: 24,
    marginTop: 12,
    marginBottom: 28,
  },
  card: {
    backgroundColor: '#151321',
    borderWidth: 1,
    borderColor: '#29243B',
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
  },
  cardLabel: {
    color: '#D8D2E8',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#8E879F',
    marginRight: 10,
  },
  statusDotOnline: {
    backgroundColor: '#55D68B',
  },
  statusDotOffline: {
    backgroundColor: '#FF6B7A',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  detail: {
    color: '#B9B4C8',
    marginTop: 12,
    lineHeight: 20,
  },
  url: {
    color: '#8F82C9',
    fontSize: 12,
    marginTop: 8,
  },
  button: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7454FF',
    borderRadius: 16,
    marginTop: 20,
    paddingHorizontal: 18,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  successText: {
    color: '#70E1A0',
    lineHeight: 22,
    marginTop: 14,
  },
  warningText: {
    color: '#F2C66D',
    lineHeight: 22,
    marginTop: 14,
    marginBottom: 8,
  },
  configItem: {
    color: '#D8D2E8',
    fontFamily: 'Courier',
    fontSize: 12,
    lineHeight: 22,
  },
  footer: {
    color: '#817A91',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 10,
  },
})
