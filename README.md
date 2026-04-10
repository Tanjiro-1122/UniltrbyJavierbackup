**Welcome to your Base44 project** 

**About**

View and Edit  your app on [Base44.com](http://Base44.com) 

This project contains everything you need to run your app locally.

**Edit the code in your local development environment**

Any change pushed to the repo will also be reflected in the Base44 Builder.

**Prerequisites:** 

1. Clone the repository using the project's Git URL 
2. Navigate to the project directory
3. Install dependencies: `npm install`
4. Create an `.env.local` file and set the right environment variables

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url

e.g.
VITE_BASE44_APP_ID=cbef744a8545c389ef439ea6
VITE_BASE44_APP_BASE_URL=https://my-to-do-list-81bfaad7.base44.app
```

Run the app: `npm run dev`

**Publish your changes**

Open [Base44.com](http://Base44.com) and click on Publish.

**Docs & Support**

Documentation: [https://docs.base44.com/Integrations/Using-GitHub](https://docs.base44.com/Integrations/Using-GitHub)

Support: [https://app.base44.com/support](https://app.base44.com/support)

---

## Vercel Serverless Environment Variables

All serverless functions in `api/` require these variables set in **Vercel → Project → Settings → Environment Variables**:

| Variable | Required | Description |
|---|---|---|
| `BASE44_SERVICE_TOKEN` | ✅ | Service-role token for server-side Base44 API calls. |
| `REVENUECAT_WEBHOOK_AUTH_HEADER` | ✅ | Authorization header value that RevenueCat sends with webhook requests (e.g. `Bearer <token>`). Must match exactly what is configured in the RevenueCat dashboard under Webhooks → Authorization header. |
| `REVENUECAT_SECRET_KEY` | ✅ | RevenueCat server-side secret key. |
| `OPENAI_API_KEY` | ✅ | OpenAI API key for serverless chat/summarize functions. |
| `B44_PROXY_SECRET` | ✅ | Shared secret between the frontend and the Base44 proxy endpoint. |
| `BASE44_BASE_URL` | optional | Base44 API root URL. Defaults to `https://app.base44.com`. Only override if Base44 provides a different host. |
| `B44_APP_ID` | optional | Base44 application ID. Defaults to the production app ID baked into the code. |

> **Note on `BASE44_BASE_URL`:** The correct Base44 API host is `https://app.base44.com`. The old value `https://api.base44.com` is a disconnected domain (returns an HTML Wix page) and will cause `SyntaxError: Unexpected token '<'` crashes in the webhook handler. If you previously had `B44_BASE_URL=https://api.base44.com` set in Vercel, update its value to `https://app.base44.com` (both `BASE44_BASE_URL` and `B44_BASE_URL` are supported variable names) and redeploy.

See `.env.example` for a full list of supported variables with descriptions.

<!-- deploy: 2026-03-27 06:37 UTC -->
