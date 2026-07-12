# Unfiltr Mobile

This folder contains the isolated Expo/React Native client for the live Unfiltr app.
The existing Vite application at the repository root remains the current Vercel web deployment.

## Current state

The mobile workspace now includes:

- Expo Router navigation
- TypeScript strict mode
- Existing EAS project linkage
- Existing iOS bundle identifier (`com.huertas.unfiltr`)
- Development, preview, and production EAS profiles
- A native connectivity/configuration status screen
- Environment validation that prevents authentication work from silently using missing settings

Android production identity is intentionally not configured until the exact live Play Store package name is verified.

## Run locally

```bash
cd mobile
cp .env.example .env
npm install
npx expo install --fix
npm run doctor
npm start
```

Use a development build when native modules such as purchases, secure storage, notifications, or biometrics are introduced.

## Validate Expo identity

```bash
cd mobile
npx eas-cli@latest project:info
```

Expected EAS project ID:

```text
0b576781-9044-41d1-bd11-9db9883db20e
```

## Public environment values

Only values prefixed with `EXPO_PUBLIC_` may be read by the mobile client. They are bundled into the app and must never contain server secrets.

Required before authentication/profile integration:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`

The anon key is designed for public clients when Row Level Security is correctly configured. Never place a Supabase service-role key in this folder.

## Next implementation milestone

1. Confirm the public API and Supabase client values used by production.
2. Add secure session persistence.
3. Load the existing signed-in user profile.
4. Add a protected native app shell.
5. Rebuild Journal and Chat against the existing backend.
