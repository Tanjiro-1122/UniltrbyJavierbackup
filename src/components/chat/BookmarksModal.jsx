import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Bookmark, Trash2 } from "lucide-react";

const STORAGE_KEY = "unfiltr_bookmarks";

export function getBookmarks() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

export function addBookmark(message, companionName) {
  const bookmarks = getBookmarks();
  const entry = {
    id: Date.now().toString(),
    content: message,
    companionName,
    date: new Date().toISOString(),
  };
  bookmarks.unshift(entry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks.slice(0, 50)));
  return entry;
}

export function removeBookmark(id) {
  const bookmarks = getBookmarks().filter(b => b.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

export default function BookmarksModal({ visible, onClose }) {
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    if (visible) setBookmarks(getBookmarks());
  }, [visible]);

  const handleDelete = (id) => {
    removeBookmark(id);
    setBookmarks(b => b.filter(x => x.id !== id));
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: "100%", background: "linear-gradient(180deg, #1a0a35 0%, #0d0520 100%)",
            borderRadius: "24px 24px 0 0", padding: "20px 16px",
            paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))",
            maxHeight: "75dvh", overflowY: "auto", WebkitOverflowScrolling: "touch",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Bookmark size={18} color="#a855f7" />
              <h3 style={{ color: "white", fontWeight: 700, fontSize: 18, margin: 0 }}>Saved Moments</h3>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <X size={16} color="white" />
            </button>
          </div>

          {bookmarks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px" }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>📌</p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>No saved moments yet</p>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 4 }}>Long-press any message to bookmark it</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {bookmarks.map(b => (
                <div key={b.id} style={{
                  background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)",
                  borderRadius: 14, padding: "12px 14px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <span style={{ color: "rgba(196,180,252,0.7)", fontSize: 10, fontWeight: 600 }}>
                      {b.companionName} · {new Date(b.date).toLocaleDateString()}
                    </span>
                    <button onClick={() => handleDelete(b.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                      <Trash2 size={12} color="rgba(255,255,255,0.25)" />
                    </button>
                  </div>
                  <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 1.5, margin: 0 }}>{b.content}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}