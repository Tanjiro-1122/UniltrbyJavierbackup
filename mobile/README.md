# Unfiltr Expo mobile client

This directory is the isolated Expo/React Native client for the existing live Unfiltr app.

## Confirmed production identity

- Expo/EAS project ID: `0b576781-9044-41d1-bd11-9db9883db20e`
- iOS bundle identifier: `com.huertas.unfiltr`
- Existing web production repository: `Tanjiro-1122/UniltrbyJavierbackup`

Do not create a new Expo project, change the iOS bundle identifier, or submit a production Android build until the exact live Android package name is confirmed.

## Bootstrap

Run from the repository root on a development computer:

```bash
npx create-expo-app@latest mobile-bootstrap
```

Then copy the generated Expo Router application files into this `mobile/` directory without replacing:

- `app.config.ts`
- `eas.json`
- this README

Install and link EAS:

```bash
cd mobile
npm install
npx eas-cli@latest login
npx eas-cli@latest project:info
```

`project:info` must resolve to project ID `0b576781-9044-41d1-bd11-9db9883db20e` before any build is started.

## First implementation slice

1. Expo Router shell and native splash screen.
2. Existing user/profile bootstrap against the current backend.
3. Native authentication/session storage.
4. Read-only home screen and backend health indicator.
5. Development build for a physical iPhone.
6. Chat, journal, mood tracking, notifications, and purchases migrated one feature at a time.

## Secret handling

Only public client configuration may use `EXPO_PUBLIC_*` variables. Never place OpenAI keys, service-role keys, Apple secrets, Google Play credentials, RevenueCat secret keys, or Base44 server secrets in the mobile bundle.
