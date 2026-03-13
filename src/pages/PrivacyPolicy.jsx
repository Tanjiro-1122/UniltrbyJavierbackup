import React from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#1a0a2e] text-white">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
        </div>

        {/* Content */}
        <div className="space-y-6 text-white/80 leading-relaxed pb-12">
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
            <h2 className="text-xl font-semibold text-white mb-3">7. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any material changes via the app or email.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-3">8. Contact Us</h2>
            <p>
              If you have questions about this privacy policy, please contact us at support@unfiltr.app
            </p>
          </div>

          <p className="text-white/50 text-sm pt-4">
            Last updated: March 13, 2026
          </p>
        </div>
      </div>
    </div>
  );
}