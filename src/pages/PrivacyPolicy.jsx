import React from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppShell from "@/components/shell/AppShell";

export default function PrivacyPolicy() {
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
        <h1 style={{ color: "white", fontWeight: 700, fontSize: 20, margin: 0 }}>Privacy Policy</h1>
      </div>

      <div className="scroll-area px-4 py-6" style={{ paddingBottom: 60 }}>
        <div className="space-y-6 text-white/80 leading-relaxed">
          <div>
            <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
            <p>
              When you use Unfiltr, we collect:
              <br />• Display name and profile information
              <br />• Companion and background selections
              <br />• Chat messages and conversation history
              <br />• Device information and usage analytics
              <br />• In-app purchase history
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Data</h2>
            <p>
              We use your information to:
              <br />• Provide and improve the Unfiltr service
              <br />• Process your messages through our AI companion system
              <br />• Manage your account and subscriptions
              <br />• Send you service updates and support messages
              <br />• Analyze usage patterns to enhance features
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">3. AI Processing</h2>
            <p>
              Your messages are processed by OpenAI's API to generate companion responses. OpenAI may retain logs for safety and abuse prevention, but do not use your data to train their models. We do not share your personal information with third parties outside of this processing.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">4. Data Storage & Security</h2>
            <p>
              Your data is stored securely on our encrypted servers. We use industry-standard encryption for data transmission and storage. However, no method of transmission is 100% secure.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">5. In-App Purchases</h2>
            <p>
              In-app purchase transactions are processed by Apple. Apple handles payment information directly. We receive only confirmation of your subscription status and do not store payment details.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">6. Account Deletion</h2>
            <p>
              You can delete your account and all associated data at any time through the Settings page. This action is permanent and cannot be undone.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">7. Children's Privacy</h2>
            <p className="text-sm">
              Unfiltr is not intended for children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected data from a child under 13, please contact us at{" "}
              <a href="mailto:support@sportswagerhelper.com" className="text-purple-400 underline">support@sportswagerhelper.com</a>{" "}and we will delete it promptly.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">8. Data Retention</h2>
            <p className="text-sm">
              We retain your data for as long as your account is active. Chat messages are stored to maintain conversation context. When you delete your account, all associated data (profile, messages, companion data) is permanently deleted within 24 hours.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">9. Changes to This Policy</h2>
            <p className="text-sm">
              We may update this privacy policy from time to time. We will notify you of any material changes via the app or email.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-2">10. Contact Us</h2>
            <p className="text-sm">
              If you have questions about this privacy policy, please contact us at{" "}
              <a href="mailto:support@sportswagerhelper.com" className="text-purple-400 underline">support@sportswagerhelper.com</a>
            </p>
          </div>

          <p className="text-white/40 text-xs pt-4">
            Last updated: March 15, 2026
          </p>
        </div>
      </div>
    </AppShell>
  );
}