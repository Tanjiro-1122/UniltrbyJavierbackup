import type { ExpoConfig, ConfigContext } from 'expo/config'

const EXPO_PROJECT_ID = '0b576781-9044-41d1-bd11-9db9883db20e'
const IOS_BUNDLE_IDENTIFIER = 'com.huertas.unfiltr'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Unfiltr by Javier',
  slug: 'unfiltr-by-javier',
  scheme: 'unfiltr',
  version: '0.0.1',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  plugins: ['expo-router', 'expo-splash-screen'],
  experiments: {
    typedRoutes: true,
  },
  ios: {
    ...config.ios,
    bundleIdentifier: IOS_BUNDLE_IDENTIFIER,
    supportsTablet: true,
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
