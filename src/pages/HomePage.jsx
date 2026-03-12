import React, { useState } from "react";
import { Send } from "lucide-react";

const BG_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/9f432ab5c_generated_image.png";
const LUNA_URL = "https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/c2cd0df0f_generated_image.png";

export default function HomePage() {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;
    setMessage("");
  };

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{
        backgroundImage: `url(${BG_URL})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay to deepen the atmosphere */}
      <div className="absolute inset-0 bg-[#0d0520]/50" />

      {/* Content */}
      <div className="relative flex flex-col h-full">
        {/* Luna standing in the room — anchored to the floor */}
        <div className="flex-1 flex flex-col items-center justify-end pb-4">
          {/* Name above character */}
          <h1 className="text-white text-2xl font-bold tracking-wide mb-3 drop-shadow-[0_0_12px_rgba(200,150,255,0.8)]">
            Luna
          </h1>

          {/* Full-body Luna with glow */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-purple-500/30 blur-2xl animate-pulse" />
            <img
              src={LUNA_URL}
              alt="Luna"
              className="relative"
              style={{
                height: "200px",
                width: "auto",
                objectFit: "contain",
                filter: "drop-shadow(0 0 18px rgba(180, 100, 255, 0.7))",
                mixBlendMode: "screen",
              }}
            />
          </div>
        </div>

        {/* Input bar */}
        <div className="w-full max-w-2xl mx-auto px-4 pb-6">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-4 py-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              className="flex-1 bg-transparent text-white placeholder-white/40 text-sm outline-none"
            />
            <button
              onClick={handleSend}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-purple-600 hover:bg-purple-500 transition-colors shrink-0"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}