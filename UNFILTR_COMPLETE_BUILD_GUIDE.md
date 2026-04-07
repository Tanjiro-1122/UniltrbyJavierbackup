# 🚀 Unfiltr — Complete Build, Export & Deployment Guide
**Last Updated:** March 23, 2026
**Built by:** Javier | Assisted by Art 🎨

---

## Table of Contents
1. [The Full Stack — How Everything Connects](#1-the-full-stack)
2. [Services We Use & How They're Set Up](#2-services-we-use)
3. [Step 1 — Exporting from Base44](#3-step-1--exporting-from-base44)
4. [Step 2 — Pushing to GitHub](#4-step-2--pushing-to-github)
5. [Step 3 — Vercel Auto-Deploy](#5-step-3--vercel-auto-deploy)
6. [Step 4 — EAS Build (iOS .ipa)](#6-step-4--eas-build)
7. [Step 5 — EAS Submit to TestFlight](#7-step-5--eas-submit-to-testflight)
8. [Step 6 — App Store Connect](#8-step-6--app-store-connect)
9. [RevenueCat IAP Flow](#9-revenuecat-iap-flow)
10. [Error Reference Guide](#10-error-reference-guide)
11. [Quick Reference Cheat Sheet](#11-quick-reference-cheat-sheet)

---

## 1. The Full Stack

Unfiltr is three separate layers that work together:

```
┌─────────────────────────────────────────────────────────────┐
│  USER'S IPHONE (TestFlight / App Store)                     │
│  iOS Wrapper (Expo/React Native WebView)                    │
│   - Loads Vercel URL inside native shell                    │
│   - Handles RevenueCat StoreKit purchases                   │
└────────────────────┬────────────────────────────────────────┘
                     │ loads
┌────────────────────▼────────────────────────────────────────┐
│  VERCEL (Frontend)                                          │
│  unfiltrbyjavier2.vercel.app                                │
│   - All UI pages (React + Vite)                             │
│   - Reads/writes to Base44 backend                          │
│   - Source: GitHub → Tanjiro-1122/unfiltrbyjavier2          │
└────────────────────┬────────────────────────────────────────┘
                     │ API calls
┌────────────────────▼────────────────────────────────────────┐
│  BASE44 (Backend)                                           │
│  unfiltrbyjavier.base44.app                                 │
│   - Database (Companion, Message, UserProfile, Feedback)    │
│   - Serverless functions (chat, TTS, avatars, etc.)         │
│   - Auth, file storage, automations                         │
└─────────────────────────────────────────────────────────────┘
```

**The golden rule:** Changes to UI go through Base44 → GitHub → Vercel. Changes to the iOS shell go through GitHub → EAS → TestFlight.

---

## 2. Services We Use

### 🟣 Base44 — app.base44.com
**Role:** Backend brain — database, auth, functions, file storage
- App URL: `unfiltrbyjavier.base44.app`
- App ID: `69b22f8b58e45d23cafd78d2`
- Login: `huertasfam@gmail.com`
- Entities: `Companion`, `Message`, `UserProfile`, `Feedback`
- Functions: `chat.ts`, `tts.ts`, `generateAndProcessAvatar.ts`, `verifyGooglePlayPurchase.ts`

### ⚫ GitHub — github.com
**Role:** Source control for both repos
- Frontend: `github.com/Tanjiro-1122/unfiltrbyjavier2`
- iOS Wrapper: `github.com/Tanjiro-1122/unfiltr-ios-wrapper`
- Login: Tanjiro-1122

### ▲ Vercel — vercel.com
**Role:** Hosts the frontend, auto-deploys from GitHub
- Live URL: `https://unfiltrbyjavier2.vercel.app`
- Connected to: `Tanjiro-1122/unfiltrbyjavier2` (auto-deploy on push)
- Framework: Vite
- Environment variables:
  ```
  VITE_BASE44_APP_ID              = 69b22f8b58e45d23cafd78d2
  VITE_BASE44_APP_BASE_URL        = https://unfiltrbyjavier.base44.app
  VITE_BASE44_FUNCTIONS_VERSION   = prod
  REVENUECAT_SECRET_KEY           = sk_vbJBTyJIbFmJCgZJhqdKybEVekzxl
  ```

### 🍎 App Store Connect — appstoreconnect.apple.com
**Role:** Manages iOS app listing, TestFlight, IAP, submissions
- Apple ID: `huertasfam1@icloud.com`
- Team ID: `6YCRK652JB`
- Bundle ID: `com.huertas.unfiltr`
- ASC App ID: `6760604917`
- ASC API Key ID: `7F2VX43S3G`

### 💚 RevenueCat — app.revenuecat.com
**Role:** Manages subscriptions and validates purchases
- Project: `projb39f8e3b`
- Apple SDK Key: `[REVENUECAT_KEY_REDACTED]`
- Entitlement: `unfiltr by javier Pro` (exact, case-sensitive)
- Products: `com.huertas.unfiltr.premium.monthly` / `.annual`

### ⚡ EAS — expo.dev
**Role:** Builds and submits your iOS app without a Mac
- Account: `huertasfam`
- Project: `unfiltr-by-javier` (ID: `b5e183d4-c4fa-4eb0-8d00-5b70263449c3`)
- Local path: `C:\unfiltr-submit\unfiltr-ios-wrapper`

---

## 3. Step 1 — Exporting from Base44

This is the starting point. Every UI change begins in Base44's editor and ends up on Vercel via GitHub.

### How Base44 + GitHub are connected
Base44 is linked directly to your GitHub repo `Tanjiro-1122/unfiltrbyjavier2`. When you click **Publish** inside Base44's editor, it automatically pushes the updated code to GitHub — which then triggers a Vercel deploy.

### Option A — Using Base44 Editor (standard flow)
1. Go to `app.base44.com`
2. Open your app **Unfiltr by Javier**
3. Make your changes in the editor (pages, components, etc.)
4. Click **Publish** (top right)
5. Base44 pushes to GitHub → Vercel auto-deploys → live in ~60 seconds

### Option B — Art makes code changes directly (what we do)
When Art edits files directly via the GitHub API (e.g. fixes bugs, pushes new pages):
1. Changes are pushed directly to `Tanjiro-1122/unfiltrbyjavier2` on GitHub
2. Vercel detects the push and auto-deploys
3. The iOS WebView wrapper loads the updated Vercel URL — no new app build needed

**Important:** Base44 editor and direct GitHub pushes can conflict if used at the same time. Always do one or the other, not both simultaneously.

### Exporting your full source code from Base44
If you ever need to download the complete source code:
1. Go to `app.base44.com` → your app
2. Click **...** (three dots) → **Export to GitHub** or **Download**
3. This gives you the full React/Vite project
4. The exported code is the same as what's in `Tanjiro-1122/unfiltrbyjavier2`

### What's in the exported project
```
src/
  pages/          ← All your app screens
  components/     ← Reusable UI pieces (BottomTabs, PaywallModal, etc.)
  api/            ← Base44 SDK client
  lib/            ← Auth context, routing
  hooks/          ← useMessageLimit, useAppleSubscriptions
  utils/          ← Helpers
functions/        ← Serverless backend functions (chat.ts, tts.ts, etc.)
index.html        ← Entry point (has viewport-fit=cover for iOS safe areas)
vite.config.js    ← Build config (Base44 plugin removed for Vercel)
vercel.json       ← SPA routing rules
```

---

## 4. Step 2 — Pushing to GitHub

### If Art made changes (most common)
Art pushes directly via GitHub API — nothing for you to do. Vercel auto-deploys.

### If you made local changes on your PC
```powershell
# Navigate to the frontend repo
cd path\to\unfiltrbyjavier2

# See what changed
git status

# Stage all changes
git add .

# Commit with a description
git commit -m "describe what you changed"

# Push to GitHub (triggers Vercel deploy)
git push origin main
```

### If you need to pull Art's latest changes to your local machine
```powershell
cd path\to\unfiltrbyjavier2
git pull origin main
```

### Always do this before EAS builds (iOS wrapper)
```powershell
cd C:\unfiltr-submit\unfiltr-ios-wrapper
git pull origin main
```

---

## 5. Step 3 — Vercel Auto-Deploy

Vercel watches GitHub. Every push to `main` on `unfiltrbyjavier2` triggers a new deploy automatically.

### Checking deploy status
1. Go to `vercel.com` → Unfiltr project → **Deployments**
2. You'll see a list of deploys — green checkmark = success
3. Each deploy takes ~30–90 seconds

### Manually triggering a redeploy
Only needed if something went wrong:
1. Vercel dashboard → Deployments → click the latest → **Redeploy**

### Verifying your deploy worked
Open `https://unfiltrbyjavier2.vercel.app` in an incognito window (important — clears cache).

---

## 6. Step 4 — EAS Build

You only need a new EAS build when you change the **iOS wrapper** itself (e.g. RevenueCat config, WebView URL, app version for App Store submission). UI/page changes don't need a new build — they update automatically via Vercel.

### When do you need a new EAS build?
| Change type | New EAS build needed? |
|------------|----------------------|
| UI change (pages, colors, text) | ❌ No — Vercel handles it |
| Bug fix in React components | ❌ No — Vercel handles it |
| New Vercel URL | ✅ Yes — update URL in index.tsx |
| RevenueCat SDK update | ✅ Yes |
| Submitting to App Store | ✅ Yes |
| Bundle ID or version change | ✅ Yes |

### Standard build commands
```powershell
# Step 1 — Go to iOS wrapper folder
cd C:\unfiltr-submit\unfiltr-ios-wrapper

# Step 2 — Always pull latest first!
git pull origin main

# Step 3 — Build
eas build --platform ios --profile production
```

### What happens during the build
1. EAS uploads your code to their cloud Mac servers
2. Installs dependencies (`npm install`)
3. Builds using Xcode 16 (macOS Sonoma)
4. Signs the `.ipa` with your distribution certificate (auto-managed)
5. Gives you a download link + build ID when done
6. Takes about 10–15 minutes

### Monitoring the build
- Watch it live in PowerShell, OR
- Go to `expo.dev` → Projects → `unfiltr-by-javier` → Builds

### Version management
- **Version** (`"version"` in app.json): The marketing version shown in App Store (e.g. `1.0.0`, `1.1.0`). Bump this for major updates.
- **Build number** (`"buildNumber"`): Auto-incremented by EAS thanks to `"autoIncrement": true` in `eas.json`. Never touch this manually.

### Key files in the iOS wrapper
```
app.json          ← App name, bundle ID, version number
eas.json          ← Build profiles, Xcode version, autoIncrement, API keys
app/index.tsx     ← WebView loader + RevenueCat IAP message bridge
package.json      ← react-native-purchases, expo dependencies
```

### Current eas.json (for reference)
```json
{
  "cli": { "version": ">= 12.0.0", "appVersionSource": "remote" },
  "build": {
    "production": {
      "env": {
        "EXPO_NO_DOCTOR": "1",
        "EAS_BUILD_NO_DOCTOR": "true"
      },
      "ios": {
        "resourceClass": "m-medium",
        "image": "macos-sonoma-14.6-xcode-16.0",
        "autoIncrement": true
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "huertasfam1@icloud.com",
        "ascAppId": "6760604917",
        "appleTeamId": "6YCRK652JB"
      }
    }
  }
}
```

---

## 7. Step 5 — EAS Submit to TestFlight

After the build finishes:

```powershell
# Submit latest build to App Store Connect
eas submit --platform ios --latest
```

### What happens
1. EAS grabs your latest `.ipa` from their servers
2. Uploads it to App Store Connect using your ASC API key
3. Apple processes it (10–30 min)
4. Build appears in TestFlight

### Submitting a specific build (not latest)
```powershell
eas submit --platform ios --id YOUR_BUILD_ID
```
Get build IDs from `expo.dev` → your project → Builds.

### After submitting — export compliance
Apple almost always sends an email asking about export compliance (encryption).
- Check `huertasfam1@icloud.com`
- OR go to App Store Connect → TestFlight → your build → answer compliance
- Answer: **No** — the app does not use encryption beyond standard HTTPS/TLS
- Build appears in TestFlight within minutes after answering

### Testing on your iPhone
1. Install **TestFlight** app from the App Store on your iPhone
2. Open TestFlight → your app should appear
3. Tap Install or Update

---

## 8. Step 6 — App Store Connect

### Current app configuration
| Field | Value |
|-------|-------|
| App name | Unfiltr by Javier |
| Bundle ID | com.huertas.unfiltr |
| ASC App ID | 6760604917 |
| Category | Lifestyle |
| Age Rating | 17+ |
| Price | Free (IAP for premium) |

### Submitting for App Store Review (when ready)
1. Go to `appstoreconnect.apple.com`
2. Open Unfiltr → **App Store** tab
3. Make sure all required fields are filled:
   - App description, keywords, screenshots (6.7", 5.5")
   - Privacy Policy URL
   - Support URL
   - Review notes (include test account if needed)
4. Under **Build** → select the TestFlight build you want to submit
5. Click **Submit for Review**
6. Apple reviews in 1–3 days typically

### In-App Purchases
- Monthly: `com.huertas.unfiltr.premium.monthly` → $9.99/month
- Annual: `com.huertas.unfiltr.premium.annual` → $59.99/year
- Both linked to RevenueCat entitlement: `unfiltr by javier Pro`

---

## 9. RevenueCat IAP Flow

### How a purchase works end to end
```
1. User taps Subscribe in Pricing.jsx
2. useAppleSubscriptions hook sends:
   postMessage({ type: 'PURCHASE', packageId: 'monthly' })
3. iOS wrapper (index.tsx) receives the message
4. Calls RevenueCat: purchasePackage(package)
5. Apple shows native payment sheet (StoreKit)
6. User confirms payment
7. RevenueCat sends back customerInfo
8. Hook checks: customerInfo.entitlements.active['unfiltr by javier Pro']
9. If active:
   - localStorage.setItem('unfiltr_is_premium', 'true')
   - POST to /api/handleAppleIAP
   - Base44 UserProfile.is_premium updated to true
10. App unlocks premium features
```

### Testing with Sandbox
1. iPhone Settings → App Store → Sandbox Account → add sandbox tester Apple ID
2. Create sandbox tester at: `appstoreconnect.apple.com` → Users → Sandbox Testers
3. Open TestFlight build → tap Subscribe
4. Payment sheet shows "Environment: Sandbox" — no real charge
5. Use sandbox Apple ID when prompted

### Restore purchases
User taps "Restore Purchases" → hook sends `{ type: 'RESTORE' }` → wrapper calls `restorePurchases()` → same entitlement check flow.

---

## 10. Error Reference Guide

---

### ❌ Build number already used
**Error:** `Build number 1 for app version 1.0.0 has already been used`
**Cause:** Apple saw this exact version + build number before.
**Fix:** Already handled — `eas.json` has `"autoIncrement": true`. If it still appears:
```json
// In app.json, manually increment buildNumber
"buildNumber": "3"  // whatever is one higher than last submitted
```

---

### ❌ Something went wrong submitting to App Store Connect
**Error:** `Something went wrong when submitting your app to Apple App Store Connect`
**Cause:** Wrong `ascAppId`, bundle ID mismatch, or build number conflict.
**Fix:** Check `eas.json` submit section matches exactly:
```json
"appleId": "huertasfam1@icloud.com",
"ascAppId": "6760604917",
"appleTeamId": "6YCRK652JB"
```
Also verify the bundle ID in `app.json` is `com.huertas.unfiltr`.

---

### ❌ Ampersand error in PowerShell
**Error:** `The ampersand (&) character is not allowed`
**Cause:** You accidentally typed `&` in PowerShell (like `M&K1122!`).
**Fix:** This is just a typo error in the terminal — NOT a build error. Your build completed fine. Just re-run the next command.

---

### ❌ expo doctor version mismatch
**Error:** Various version incompatibility warnings from `expo doctor`
**Cause:** Package version conflicts in the iOS wrapper.
**Fix:** Already suppressed. `eas.json` has `"EXPO_NO_DOCTOR": "1"`. If it appears locally:
```powershell
$env:EXPO_NO_DOCTOR="1"; eas build --platform ios --profile production
```

---

### ❌ Error 90725 — iOS SDK too old
**Error:** `ERROR ITMS-90725: SDK version issue`
**Cause:** Build used an Xcode version below Apple's minimum requirement.
**Fix:** Already handled — `eas.json` uses `"image": "macos-sonoma-14.6-xcode-16.0"`.
If Apple raises the minimum in the future, update to the next image (e.g. `xcode-16.2`).

---

### ❌ eas: command not found
**Cause:** EAS CLI not installed or PATH not set.
**Fix:**
```powershell
npm install -g eas-cli
# Close and reopen PowerShell
eas --version
```

---

### ❌ EAS build uses old code / doesn't have my latest changes
**Cause:** You forgot to `git pull` before building, or Art pushed changes after your last pull.
**Fix:** Always run this before every build:
```powershell
cd C:\unfiltr-submit\unfiltr-ios-wrapper
git pull origin main
```

---

### ❌ Vercel deploy fails
**Cause:** Usually a JavaScript syntax error in a recently pushed file.
**Fix:**
1. Go to `vercel.com` → your project → Deployments
2. Click the failed deploy → read the error log
3. Find the broken file, fix it, push again

---

### ❌ Vercel shows old version / white screen
**Cause:** Deploy still in progress, or browser cache.
**Fix:**
1. Wait 60–90 seconds for deploy to finish
2. Hard refresh: `Ctrl + Shift + R` in browser
3. Test in incognito window (always best for testing)
4. If still wrong: Vercel dashboard → Deployments → Redeploy

---

### ❌ Base44 editor and GitHub are out of sync
**Cause:** Art pushed directly to GitHub while you were also editing in Base44 editor.
**Fix:**
1. In Base44 editor → click **Pull from GitHub** (syncs latest code into editor)
2. Make your edits
3. Click **Publish** to push back to GitHub
**Rule:** If Art is actively making changes, don't edit in Base44 editor at the same time. Wait for Art to finish, then pull.

---

### ❌ App opens on wrong screen after update
**Cause:** localStorage keys may have stale data from an older version.
**Fix:**
1. On the Vercel URL → open browser DevTools (F12) → Application → Local Storage → Clear all
2. On iPhone → delete app from TestFlight → reinstall
3. This simulates a fresh install

---

### ❌ RevenueCat purchase not unlocking premium
**Cause:** One of several things — entitlement name mismatch, Base44 update failed, or sandbox mode.
**Fix checklist:**
- [ ] Entitlement name is exactly: `unfiltr by javier Pro` (case-sensitive)
- [ ] `is_premium` in Base44 UserProfile — check the dashboard
- [ ] Check RevenueCat dashboard → Customers → search the user
- [ ] If sandbox: make sure you're using a sandbox Apple ID in Settings
- [ ] Check browser console for errors in the IAP bridge

---

### ❌ TestFlight build not appearing after submit
**Cause:** Apple processing delay or export compliance needed.
**Fix:**
1. Wait 30 minutes
2. Check `huertasfam1@icloud.com` for an email from Apple
3. If compliance email: App Store Connect → TestFlight → build → answer compliance (answer: No)
4. Build appears within minutes after answering

---

### ❌ Age verification not showing on fresh open
**Cause:** `unfiltr_age_verified` key already exists in localStorage from a previous session.
**Fix for testing:** Clear localStorage in browser DevTools or reinstall the app.
**Not a bug for real users** — they only see it once, which is correct.

---

### ❌ 404 on any app route (e.g. /onboarding, /chat)
**Cause:** Vercel doesn't know to serve `index.html` for these routes (SPA routing issue).
**Fix:** Already handled. `vercel.json` in the repo root:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```
If a new route still 404s, make sure it's defined in `src/App.jsx` under `<Routes>`.

---

## 11. Quick Reference Cheat Sheet

### Complete standard workflow (copy-paste ready)

```powershell
# ── FRONTEND UPDATE (no new app build needed) ──────────────────
# Art pushes changes → Vercel auto-deploys. Nothing to do.
# Test at: https://unfiltrbyjavier2.vercel.app (incognito)

# ── IOS BUILD + TESTFLIGHT ─────────────────────────────────────
cd C:\unfiltr-submit\unfiltr-ios-wrapper
git pull origin main
eas build --platform ios --profile production
# (wait ~15 min for build to finish)
eas submit --platform ios --latest
# (check email for Apple compliance question, answer No)
# (wait ~30 min → open TestFlight on iPhone)
```

### Key URLs
| What | URL |
|------|-----|
| Live app (web) | https://unfiltrbyjavier2.vercel.app |
| Base44 backend | https://app.base44.com |
| GitHub (frontend) | https://github.com/Tanjiro-1122/unfiltrbyjavier2 |
| GitHub (iOS wrapper) | https://github.com/Tanjiro-1122/unfiltr-ios-wrapper |
| EAS builds | https://expo.dev/accounts/huertasfam/projects/unfiltr-by-javier/builds |
| App Store Connect | https://appstoreconnect.apple.com |
| RevenueCat | https://app.revenuecat.com |
| Vercel | https://vercel.com |

### Key credentials at a glance
| What | Value |
|------|-------|
| Apple ID | huertasfam1@icloud.com |
| Apple Team ID | 6YCRK652JB |
| Bundle ID | com.huertas.unfiltr |
| ASC App ID | 6760604917 |
| Base44 App ID | 69b22f8b58e45d23cafd78d2 |
| RC Entitlement | unfiltr by javier Pro |
| iOS wrapper path | C:\unfiltr-submit\unfiltr-ios-wrapper |

---

*Keep this guide updated. Every time a new error is solved or a process changes, add it here.*