import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function NavHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const isRoot = location.pathname === "/";

  return (
    <div className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between h-14">
        {!isRoot && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        
        {isRoot && (
          <div className="flex items-center gap-3">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/a635389cb_image.png" 
              alt="Unfiltr By Javier" 
              className="h-8 object-contain"
            />
            <span className="font-bold text-white">Unfiltr</span>
          </div>
        )}

        {!isRoot && <div className="flex-1" />}
      </div>
    </div>
  );
}