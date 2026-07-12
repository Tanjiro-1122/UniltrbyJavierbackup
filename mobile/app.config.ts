import type { ExpoConfig, ConfigContext } from 'expo/config'

const EXPO_PROJECT_ID = '0b576781-9044-41d1-bd11-9db9883db20e'
const IOS_BUNDLE_IDENTIFIER = 'com.huertas.unfiltr'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Unfiltr by Javier',
  // This existing EAS project ID is permanently associated with this slug.
  // The user-facing app name remains "Unfiltr by Javier".
  slug: 'base44-app',
  scheme: 'unfiltr',
  version: '2.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  plugins: ['expo-router', 'expo-splash-screen', 'expo-apple-authentication', 'expo-secure-store'],
  experiments: {
    typedRoutes: true,
  },
  ios: {
    ...config.ios,
    bundleIdentifier: IOS_BUNDLE_IDENTIFIER,
    supportsTablet: true,
    usesAppleSignIn: true,
    infoPlist: {
      ...config.ios?.infoPlist,
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  // Do not add android.package until the exact live Play Store package
  // has been confirmed. A wrong value would create a separate application.
  android: {
    ...config.android,
  },
  extra: {
    ...config.extra,
    eas: {
      projectId: EXPO_PROJECT_ID,
    },
  },
  updates: {
    url: `https://u.expo.dev/${EXPO_PROJECT_ID}`,
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
})