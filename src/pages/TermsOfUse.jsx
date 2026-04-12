import React from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/shell/AppShell";

export default function TermsOfUse() {
  const navigate = useNavigate();

  return (
    <AppShell tabs={false} bg="linear-gradient(180deg, #0a0a0f 0%, #1a0a2e 100%)"  >
      <div style={{
        flexShrink: 0, display: "flex", alignItems: "center", gap: 12,
        padding: "0 16px 14px",
        paddingTop: "max(1.5rem, env(safe-area-inset-top, 1.5rem))",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <button onClick={() => navigate(-1)}
          style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <ChevronLeft size={20} color="white" />
        </button>
        <h1 style={{ color: "white", fontWeight: 700, fontSize: 20, margin: 0 }}>Terms of Use</h1>
      </div>

      <div className="scroll-area px-4 py-6" style={{ paddingBottom: 60 }}>
        <div className="space-y-6 text-white/80 leading-relaxed">

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">1. Acceptance of Terms</h2>
            <p className="text-sm">By downloading, accessing, or using Unfiltr ("the App"), you agree to be bound by these Terms of Use. If you do not agree, do not use the App.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">2. Description of Service</h2>
            <p className="text-sm">Unfiltr is an AI companion app that provides conversational interactions through artificial intelligence. The AI companions are not real people and do not provide professional advice of any kind, including medical, psychological, legal, or financial advice.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">3. Eligibility</h2>
            <p className="text-sm">You must be at least 13 years of age to use the App. If you are under 18, you must have parental or guardian consent. By using the App, you represent that you meet these requirements.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">4. Subscriptions & Payments</h2>
            <p className="text-sm">
              Unfiltr offers auto-renewable subscriptions managed through Apple's App Store. Payment will be charged to your Apple ID account at confirmation of purchase. Subscriptions automatically renew unless cancelled at least 24 hours before the end of the current period. You can manage and cancel subscriptions in your Apple ID account settings.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">5. User Conduct</h2>
            <p className="text-sm">You agree not to use the App to: generate harmful, illegal, or abusive content; attempt to extract personal information; use the service for commercial purposes without authorization; or violate any applicable laws.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">6. AI Disclaimer</h2>
            <p className="text-sm">AI-generated responses may be inaccurate, inappropriate, or incomplete. The App is for entertainment and companionship purposes only. In case of a mental health emergency, please contact a crisis helpline or emergency services immediately.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">7. Intellectual Property</h2>
            <p className="text-sm">All content, characters, artwork, and technology within the App are owned by Unfiltr and protected by intellectual property laws. You may not copy, modify, or distribute any part of the App.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">8. Limitation of Liability</h2>
            <p className="text-sm">The App is provided "as is" without warranties. Unfiltr is not liable for any damages arising from your use of the App, including emotional distress, data loss, or interruptions in service.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">9. Account Termination</h2>
            <p className="text-sm">We reserve the right to suspend or terminate your account for violations of these terms. You may delete your account at any time through the Settings page.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">10. Changes to Terms</h2>
            <p className="text-sm">We may update these terms from time to time. Continued use of the App after changes constitutes acceptance of the revised terms.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">11. Contact</h2>
            <p className="text-sm">Questions about these terms? Contact us at{" "}
              <a href="mailto:support@sportswagerhelper.com" className="text-purple-400 underline">support@sportswagerhelper.com</a>
            </p>
          </div>

          <p className="text-white/40 text-xs pt-4">Last updated: March 15, 2026</p>
        </div>
      </div>
    </AppShell>
  );
}