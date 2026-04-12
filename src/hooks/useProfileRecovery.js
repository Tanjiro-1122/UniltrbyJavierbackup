/**
 * useProfileRecovery
 *
 * Loads the UserProfile and Companion from the database on mount.
 * Falls back to syncProfile if the stored profileId is missing.
 * Calls onProfile(profile, companion) when data is ready.
 */
import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function useProfileRecovery({ onProfile, onPersonality } = {}) {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        let profileId = localStorage.getItem("userProfileId");

        // Recovery: profileId missing — try to re-link via Apple user ID
        if (!profileId) {
          const appleUserId = localStorage.getItem("unfiltr_apple_user_id");
          const displayName = localStorage.getItem("unfiltr_display_name");
          // Only attempt recovery when we have a real Apple user ID.
          // Never send "lookup" or a blank string — that could match an unrelated profile.
          if (appleUserId) {
            try {
              const r = await fetch("/api/syncProfile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "sync",
                  appleUserId,
                  fullName: displayName,
                }),
              });
              const rd = await r.json();
              if (rd.data?.profileId) {
                profileId = rd.data.profileId;
                localStorage.setItem("userProfileId", profileId);
                localStorage.setItem("unfiltr_user_id", profileId);
                localStorage.setItem("unfiltr_auth_token", profileId);
                console.log("[useProfileRecovery] Recovered profileId:", profileId);
              }
            } catch (e) {
              console.warn("[useProfileRecovery] syncProfile lookup failed:", e.message);
            }
          }
        }

        if (!profileId || cancelled) return;

        const profile = await base44.entities.UserProfile.get(profileId).catch(() => null);
        if (!profile || cancelled) return;

        // Persist useful fields as local backups
        if (profile.display_name) localStorage.setItem("unfiltr_display_name", profile.display_name);
        if (profile.id) {
          if (!localStorage.getItem("unfiltr_user_id"))    localStorage.setItem("unfiltr_user_id", profile.id);
          if (!localStorage.getItem("unfiltr_auth_token")) localStorage.setItem("unfiltr_auth_token", profile.id);
        }
        if (profile.companion_id && profile.companion_id !== "pending") {
          localStorage.setItem("unfiltr_companion_id", profile.companion_id);
          localStorage.setItem("companionId", profile.companion_id);
        }

        // Load companion if available
        const companionId =
          profile.companion_id ||
          localStorage.getItem("unfiltr_companion_id") ||
          localStorage.getItem("companionId");

        let companion = null;
        if (companionId && companionId !== "pending") {
          companion = await base44.entities.Companion.get(companionId).catch(() => null);
        }

        if (cancelled) return;

        if (onProfile) onProfile(profile, companion);

        // Surface personality traits so callers can sync local state
        if (companion && onPersonality) {
          onPersonality({
            vibe:      companion.personality_vibe,
            empathy:   companion.personality_empathy,
            humor:     companion.personality_humor,
            curiosity: companion.personality_curiosity,
            style:     companion.personality_style,
          });
          // Cache personality locally
          if (companion.personality_vibe)      localStorage.setItem("unfiltr_personality_vibe",      companion.personality_vibe);
          if (companion.personality_empathy)   localStorage.setItem("unfiltr_personality_empathy",   companion.personality_empathy);
          if (companion.personality_humor)     localStorage.setItem("unfiltr_personality_humor",     companion.personality_humor);
          if (companion.personality_curiosity) localStorage.setItem("unfiltr_personality_curiosity", companion.personality_curiosity);
          if (companion.personality_style)     localStorage.setItem("unfiltr_personality_style",     companion.personality_style);
        }
      } catch (e) {
        if (!cancelled) console.warn("[useProfileRecovery] error:", e.message);
      }
    })();

    return () => { cancelled = true; };
  }, []); // run once on mount
}
