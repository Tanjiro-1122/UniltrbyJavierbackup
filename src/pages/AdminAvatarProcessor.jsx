import React, { useState } from "react";
import { base44 } from "@/api/base44Client";

// All 48 new mood images to process
const IMAGES_TO_PROCESS = [
  // LUNA
  { companion: "luna", mood: "fear",        url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/8de39f868_generated_image.png" },
  { companion: "luna", mood: "disgust",     url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/951343e7d_generated_image.png" },
  { companion: "luna", mood: "surprise",    url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/abb9b9359_generated_image.png" },
  { companion: "luna", mood: "anger",       url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/ef46eb96d_generated_image.png" },
  { companion: "luna", mood: "contentment", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/0cedbdb21_generated_image.png" },
  { companion: "luna", mood: "fatigue",     url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/8e6500bb3_generated_image.png" },
  // KAI
  { companion: "kai",  mood: "fear",        url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/6302dd1eb_generated_image.png" },
  { companion: "kai",  mood: "disgust",     url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/612da2ea9_generated_image.png" },
  { companion: "kai",  mood: "surprise",    url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/43365c706_generated_image.png" },
  { companion: "kai",  mood: "anger",       url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/6c51fd160_generated_image.png" },
  { companion: "kai",  mood: "contentment", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/b041d41ac_generated_image.png" },
  { companion: "kai",  mood: "fatigue",     url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/c6f9b7a40_generated_image.png" },
  // NOVA
  { companion: "nova", mood: "fear",        url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/caf3c93a2_generated_image.png" },
  { companion: "nova", mood: "disgust",     url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/0e767a233_generated_image.png" },
  { companion: "nova", mood: "surprise",    url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/e89ff573a_generated_image.png" },
  { companion: "nova", mood: "anger",       url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/e4ce5439e_generated_image.png" },
  { companion: "nova", mood: "contentment", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/58df57a17_generated_image.png" },
  { companion: "nova", mood: "fatigue",     url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/3d343a1a2_generated_image.png" },
  // ASH
  { companion: "ash",  mood: "fear",        url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/00fbb847f_generated_image.png" },
  { companion: "ash",  mood: "disgust",     url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/739864b27_generated_image.png" },
  { companion: "ash",  mood: "surprise",    url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/75b1ff996_generated_image.png" },
  { companion: "ash",  mood: "anger",       url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/1930860a1_generated_image.png" },
  { companion: "ash",  mood: "contentment", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/6934967d7_generated_image.png" },
  { companion: "ash",  mood: "fatigue",     url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/68293d777_generated_image.png" },
  // SAKURA
  { companion: "sakura", mood: "fear",        url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/217e43fcf_generated_image.png" },
  { companion: "sakura", mood: "disgust",     url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/aadab5518_generated_image.png" },
  { companion: "sakura", mood: "surprise",    url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/965caa151_generated_image.png" },
  { companion: "sakura", mood: "anger",       url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/d89d8edb4_generated_image.png" },
  { companion: "sakura", mood: "contentment", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/36c4ef1d2_generated_image.png" },
  { companion: "sakura", mood: "fatigue",     url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/f80400d96_generated_image.png" },
  // RYUU
  { companion: "ryuu", mood: "fear",        url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/088294e92_generated_image.png" },
  { companion: "ryuu", mood: "disgust",     url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/43f811e21_generated_image.png" },
  { companion: "ryuu", mood: "surprise",    url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/8edbcbc72_generated_image.png" },
  { companion: "ryuu", mood: "anger",       url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/4c57ade16_generated_image.png" },
  { companion: "ryuu", mood: "contentment", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/9432f0889_generated_image.png" },
  { companion: "ryuu", mood: "fatigue",     url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/581676066_generated_image.png" },
  // ZARA
  { companion: "zara", mood: "fear",        url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/cd52d2231_generated_image.png" },
  { companion: "zara", mood: "disgust",     url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/df77be0af_generated_image.png" },
  { companion: "zara", mood: "surprise",    url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/7dc5742bb_generated_image.png" },
  { companion: "zara", mood: "anger",       url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/ed383d925_generated_image.png" },
  { companion: "zara", mood: "contentment", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/814d5bfb7_generated_image.png" },
  { companion: "zara", mood: "fatigue",     url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/9cb4cb27c_generated_image.png" },
  // SAGE
  { companion: "sage", mood: "fear",        url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/e8abb80db_generated_image.png" },
  { companion: "sage", mood: "disgust",     url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/0db7c9d81_generated_image.png" },
  { companion: "sage", mood: "surprise",    url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/72256b7bb_generated_image.png" },
  { companion: "sage", mood: "anger",       url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/0a4f54e5c_generated_image.png" },
  { companion: "sage", mood: "contentment", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/d4d2bda8b_generated_image.png" },
  { companion: "sage", mood: "fatigue",     url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69b332a392004d139d4ba495/45659d515_generated_image.png" },
];

export default function AdminAvatarProcessor() {
  const [results, setResults] = useState({});
  const [processing, setProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [log, setLog] = useState([]);

  const addLog = (msg) => setLog(prev => [...prev, msg]);

  const processAll = async () => {
    setProcessing(true);
    setResults({});
    setLog([]);
    const newResults = {};

    for (let i = 0; i < IMAGES_TO_PROCESS.length; i++) {
      const item = IMAGES_TO_PROCESS[i];
      setCurrentIndex(i);
      addLog(`[${i + 1}/${IMAGES_TO_PROCESS.length}] Processing ${item.companion} - ${item.mood}...`);

      try {
        // Step 1: Remove background
        const removeBgRes = await base44.functions.invoke('removeBg', { image_url: item.url });
        const dataUrl = removeBgRes.data.file_url;

        // Step 2: Convert data URL to blob and upload
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const uploadRes = await base44.integrations.Core.UploadFile({ file: blob });
        const finalUrl = uploadRes.file_url;

        const key = `${item.companion}_${item.mood}`;
        newResults[key] = finalUrl;
        setResults(prev => ({ ...prev, [key]: finalUrl }));
        addLog(`  ✅ Done: ${finalUrl}`);
      } catch (err) {
        addLog(`  ❌ Error: ${err.message}`);
      }
    }

    setCurrentIndex(-1);
    setProcessing(false);

    // Print final JSON for copy-paste into companionData
    const output = JSON.stringify(newResults, null, 2);
    addLog("\n\n=== FINAL RESULTS (copy into companionData) ===\n" + output);
  };

  const total = IMAGES_TO_PROCESS.length;
  const done = Object.keys(results).length;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">Avatar Processor — Admin</h1>
        <p className="text-gray-400 mb-6 text-sm">
          Removes backgrounds from all 48 generated mood images and uploads them to storage.
          This will use {total} Remove.bg API credits.
        </p>

        {!processing && done === 0 && (
          <button
            onClick={processAll}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-xl text-lg"
          >
            Start Processing All {total} Images
          </button>
        )}

        {(processing || done > 0) && (
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm text-gray-300">{done}/{total} processed</span>
              {processing && currentIndex >= 0 && (
                <span className="text-xs text-purple-400 animate-pulse">
                  Processing: {IMAGES_TO_PROCESS[currentIndex]?.companion} - {IMAGES_TO_PROCESS[currentIndex]?.mood}
                </span>
              )}
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(done / total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {log.length > 0 && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 font-mono text-xs text-green-400 max-h-96 overflow-y-auto whitespace-pre-wrap">
            {log.join('\n')}
          </div>
        )}
      </div>
    </div>
  );
}