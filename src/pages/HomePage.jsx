import React, { useState } from "react";
import { Send } from "lucide-react";

export default function HomePage() {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;
    setMessage("");
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-between bg-[#1a0a2e] min-h-screen">
      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-5">
        {/* Avatar with glow */}
        <div className="relative">
          <div className="absolute -inset-2 rounded-full bg-purple-500/40 blur-xl animate-pulse" />
          <div className="relative w-32 h-32 rounded-full p-[3px] bg-gradient-to-br from-purple-400 via-violet-500 to-purple-600 shadow-[0_0_40px_rgba(147,51,234,0.5)]">
            <img
              src="https://media.base44.com/images/public/69b22f8b58e45d23cafd78d2/c2cd0df0f_generated_image.png"
              alt="Luna"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
        </div>

        {/* Name */}
        <h1 className="text-white text-2xl font-bold tracking-wide">Luna</h1>
      </div>

      {/* Input bar */}
      <div className="w-full max-w-2xl px-4 pb-6">
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2">
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
  );
}