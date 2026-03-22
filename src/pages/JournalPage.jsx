import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Save, CheckCircle, Image, Smile, X } from "lucide-react";

const STICKERS = [
  "🌸", "🌙", "⭐", "✨", "🦋", "🌿", "🍃", "🌺", "💜", "🖤",
  "🌊", "🔥", "💫", "🌈", "🍀", "🌻", "🕊️", "🌷", "🍵",
  "☁️", "💭", "📚", "🎵", "🎨", "💎", "🕯️",
  "✍️", "📖", "💌", "🫧", "🧸", "🪴", "🫶", "💝",
];

export default function JournalPage() {
  const navigate = useNavigate();
  const [entry, setEntry] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [today, setToday] = useState("");
  const [showStickers, setShowStickers] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [cursorPos, setCursorPos] = useState(0);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const now = new Date();
    setToday(
      now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  const handleSave = () => {
    if (!entry.trim() || saving) return;
    setSaving(true);
    const newEntry = {
      id: Date.now().toString(),
      title: entry.trim().slice(0, 50),
      content: entry.trim(),
      mood: "reflective",
      images: uploadedImages,
      created_date: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem("unfiltr_journal_entries") || "[]");
    localStorage.setItem("unfiltr_journal_entries", JSON.stringify([newEntry, ...existing]));
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      navigate("/journal-list");
    }, 1200);
  };

  const insertSticker = (sticker) => {
    const before = entry.slice(0, cursorPos);
    const after = entry.slice(cursorPos);
    const newEntry = before + sticker + " " + after;
    setEntry(newEntry);
    setShowStickers(false);
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = cursorPos + sticker.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
        setCursorPos(newPos);
      }
    }, 50);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setUploadedImages((prev) => [...prev, ev.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const wordCount = entry.trim() ? entry.trim().split(/\s+/).length : 0;

  return (
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{
        background: "linear-gradient(160deg, #0d0520 0%, #1a0a35 60%, #0a1020 100%)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 pb-3 shrink-0"
        style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top, 1.5rem))" }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
        >
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <p className="text-white/50 text-sm font-medium tracking-wide">My Journal</p>
        <button
          onClick={handleSave}
          disabled={!entry.trim() || saving}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
            entry.trim()
              ? "bg-purple-600/80 text-white active:scale-95"
              : "bg-white/10 text-white/30 cursor-not-allowed"
          }`}
        >
          {saved ? (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-300" />
              <span className="text-emerald-300">Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save"}
            </>
          )}
        </button>
      </div>

      {/* Journal Book */}
      <div className="flex-1 px-4 pb-2 overflow-hidden flex flex-col min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 rounded-2xl overflow-hidden flex flex-col min-h-0"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 0 60px rgba(120,80,200,0.12)",
          }}
        >
          {/* Date strip */}
          <div className="px-5 pt-4 pb-3 border-b border-white/10 shrink-0">
            <p className="text-purple-400/80 text-xs uppercase tracking-widest font-medium">
              {today}
            </p>
          </div>

          {/* Uploaded images */}
          {uploadedImages.length > 0 && (
            <div className="px-4 pt-3 flex flex-wrap gap-2 shrink-0">
              {uploadedImages.map((src, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/20">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Lined writing area */}
          <div className="flex-1 relative overflow-hidden min-h-0">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(transparent, transparent 31px, rgba(255,255,255,0.04) 31px, rgba(255,255,255,0.04) 32px)",
                backgroundPositionY: "48px",
              }}
            />
            <textarea
              ref={textareaRef}
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              onBlur={(e) => setCursorPos(e.target.selectionStart)}
              onSelect={(e) => setCursorPos(e.target.selectionStart)}
              placeholder="What's on your mind today..."
              className="w-full h-full resize-none bg-transparent text-white/90 placeholder-white/20 text-base px-5 pt-4 pb-5 focus:outline-none overflow-y-auto"
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                lineHeight: "32px",
              }}
              autoFocus
            />
          </div>

          {/* Word count */}
          <div className="px-5 py-2 border-t border-white/10 shrink-0 flex justify-end">
            <p className="text-white/20 text-xs">
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Sticker tray */}
      <AnimatePresence>
        {showStickers && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            className="mx-4 mb-2 rounded-2xl p-4 shrink-0"
            style={{
              background: "rgba(30,10,60,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-white/60 text-xs uppercase tracking-widest">Stickers</p>
              <button onClick={() => setShowStickers(false)}>
                <X className="w-4 h-4 text-white/40" />
              </button>
            </div>
            <div className="grid grid-cols-10 gap-2">
              {STICKERS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => insertSticker(s)}
                  className="text-2xl hover:scale-125 active:scale-90 transition-transform"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom toolbar */}
      <div
        className="px-4 pt-2 flex items-center gap-3 shrink-0"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom, 1.5rem))" }}
      >
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 text-white/60 text-sm font-medium active:scale-95 transition-all"
        >
          <Image className="w-4 h-4" />
          Photo
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageUpload}
        />

        <button
          onClick={() => setShowStickers((v) => !v)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium active:scale-95 transition-all ${
            showStickers
              ? "bg-purple-600/60 text-white"
              : "bg-white/10 text-white/60"
          }`}
        >
          <Smile className="w-4 h-4" />
          Stickers
        </button>

        <div className="flex-1" />
        <p className="text-white/20 text-xs">Write freely 🌙</p>
      </div>
    </div>
  );
}