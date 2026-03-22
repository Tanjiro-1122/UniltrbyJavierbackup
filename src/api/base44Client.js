import { createClient } from "@base44/sdk";

export const base44 = createClient({
  appId: import.meta.env.VITE_BASE44_APP_ID || "69b22f8b58e45d23cafd78d2",
  requiresAuth: false,
  appBaseUrl: import.meta.env.VITE_BASE44_APP_BASE_URL || "https://unfiltrbyjavier.base44.app",
  functionsVersion: import.meta.env.VITE_BASE44_FUNCTIONS_VERSION || "prod",
});
