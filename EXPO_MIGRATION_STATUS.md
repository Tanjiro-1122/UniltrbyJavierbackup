# Expo migration status

## Source of truth

`Tanjiro-1122/UniltrbyJavierbackup`

## Confirmed

- Production web app remains on Vite/Vercel.
- Existing Expo/EAS project ID: `0b576781-9044-41d1-bd11-9db9883db20e`.
- Existing iOS bundle identifier: `com.huertas.unfiltr`.
- Expo work is isolated under `mobile/`.

## Blocked pending verification

- Exact live Android application/package ID.
- Current App Store build number.
- Current Google Play version code, if Android is live.
- Expo account owner/slug confirmation through `eas project:info`.

## Release rule

No production store build or submission may occur until the identifiers above are verified against the existing store listings.
