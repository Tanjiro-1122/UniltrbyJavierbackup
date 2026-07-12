# Expo migration status

## Source of truth

- Repository: `Tanjiro-1122/UniltrbyJavierbackup`
- Web production: existing Vite/Vercel application at repository root
- Expo/EAS project ID: `0b576781-9044-41d1-bd11-9db9883db20e`
- iOS bundle identifier: `com.huertas.unfiltr`

## Completed

- Created an isolated `mobile/` workspace.
- Preserved the existing EAS project and iOS application identity.
- Added EAS development, preview, and production profiles.
- Added Expo Router and strict TypeScript configuration.
- Added a runnable native root layout.
- Added the first native status screen.
- Added a production-web connectivity check.
- Added public environment validation.
- Kept all existing Vite/Vercel runtime files unchanged.

## Blocked intentionally

- Android production package remains unset until the exact live Play Store application ID is verified.
- Authentication and profile loading remain locked until the production public API/Supabase client settings are confirmed.
- No store build or submission has been triggered.

## Next slice

1. Install dependencies and run Expo Doctor from `mobile/`.
2. Confirm EAS project identity with `eas project:info`.
3. Configure the public production client values.
4. Add secure native session persistence.
5. Load the existing user profile into a protected native app shell.
