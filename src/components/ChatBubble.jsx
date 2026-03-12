import React from "react";
import { motion } from "framer-motion";

export default function ChatBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-xs px-4 py-2.5 rounded-2xl backdrop-blur text-sm leading-relaxed ${
          isUser
            ? "bg-gradient-to-br from-purple-600 to-purple-500 text-white rounded-br-none"
            : "bg-white/10 border border-white/20 text-white rounded-bl-none"
        }`}
      >
        {message.content}
      </div>
    </motion.div>
  );
}