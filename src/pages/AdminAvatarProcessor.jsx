import React, { useState } from "react";
import { base44 } from "@/api/base44Client";

// All 48 new mood images to process
const IMAGES_TO_PROCESS = [
  // LUNA
  { companion: "luna", mood: "fear",        url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "luna", mood: "disgust",     url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "luna", mood: "surprise",    url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "luna", mood: "anger",       url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "luna", mood: "contentment", url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "luna", mood: "fatigue",     url: "https://placeholder.invalid/image-needs-migration" },
  // KAI
  { companion: "kai",  mood: "fear",        url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "kai",  mood: "disgust",     url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "kai",  mood: "surprise",    url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "kai",  mood: "anger",       url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "kai",  mood: "contentment", url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "kai",  mood: "fatigue",     url: "https://placeholder.invalid/image-needs-migration" },
  // NOVA
  { companion: "nova", mood: "fear",        url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "nova", mood: "disgust",     url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "nova", mood: "surprise",    url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "nova", mood: "anger",       url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "nova", mood: "contentment", url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "nova", mood: "fatigue",     url: "https://placeholder.invalid/image-needs-migration" },
  // ASH
  { companion: "ash",  mood: "fear",        url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "ash",  mood: "disgust",     url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "ash",  mood: "surprise",    url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "ash",  mood: "anger",       url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "ash",  mood: "contentment", url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "ash",  mood: "fatigue",     url: "https://placeholder.invalid/image-needs-migration" },
  // SAKURA
  { companion: "sakura", mood: "fear",        url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "sakura", mood: "disgust",     url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "sakura", mood: "surprise",    url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "sakura", mood: "anger",       url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "sakura", mood: "contentment", url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "sakura", mood: "fatigue",     url: "https://placeholder.invalid/image-needs-migration" },
  // RYUU
  { companion: "ryuu", mood: "fear",        url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "ryuu", mood: "disgust",     url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "ryuu", mood: "surprise",    url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "ryuu", mood: "anger",       url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "ryuu", mood: "contentment", url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "ryuu", mood: "fatigue",     url: "https://placeholder.invalid/image-needs-migration" },
  // ZARA
  { companion: "zara", mood: "fear",        url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "zara", mood: "disgust",     url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "zara", mood: "surprise",    url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "zara", mood: "anger",       url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "zara", mood: "contentment", url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "zara", mood: "fatigue",     url: "https://placeholder.invalid/image-needs-migration" },
  // SAGE
  { companion: "sage", mood: "fear",        url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "sage", mood: "disgust",     url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "sage", mood: "surprise",    url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "sage", mood: "anger",       url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "sage", mood: "contentment", url: "https://placeholder.invalid/image-needs-migration" },
  { companion: "sage", mood: "fatigue",     url: "https://placeholder.invalid/image-needs-migration" },
];

// These base poses (happy / neutral / sad) were never uploaded to CDN and need
// to be generated via the base44 superagent, then pasted into companionData.jsx.
const MISSING_BASE_POSES = [
  { companion: "river", mood: "happy",   note: "Generate River happy pose" },
  { companion: "river", mood: "neutral", note: "Generate River neutral pose" },
  { companion: "river", mood: "sad",     note: "Generate River sad pose" },
  { companion: "river", mood: "fear",        note: "Generate River fear pose" },
  { companion: "river", mood: "disgust",     note: "Generate River disgust pose" },
  { companion: "river", mood: "surprise",    note: "Generate River surprise pose" },
  { companion: "river", mood: "anger",       note: "Generate River anger pose" },
  { companion: "river", mood: "contentment", note: "Generate River contentment pose" },
  { companion: "river", mood: "fatigue",     note: "Generate River fatigue pose" },
  { companion: "sage",  mood: "happy",   note: "Generate Sage happy pose" },
  { companion: "sage",  mood: "neutral", note: "Generate Sage neutral pose" },
  { companion: "sage",  mood: "sad",     note: "Generate Sage sad pose" },
  { companion: "zara",  mood: "happy",   note: "Generate Zara happy pose" },
  { companion: "zara",  mood: "neutral", note: "Generate Zara neutral pose" },
  { companion: "zara",  mood: "sad",     note: "Generate Zara sad pose" },
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

        {/* Missing images that need to be generated via the base44 superagent */}
        <div className="mt-10">
          <h2 className="text-lg font-bold mb-1 text-yellow-400">⚠️ Missing Base Poses — Needs Generation</h2>
          <p className="text-gray-400 text-sm mb-4">
            The following {MISSING_BASE_POSES.length} images were never uploaded to CDN and currently show a
            placeholder from another companion. Generate each one via the{" "}
            <a
              href="https://app.base44.com/superagent/69b22f8b58e45d23cafd78d2"
              target="_blank"
              rel="noreferrer"
              className="text-purple-400 underline"
            >
              base44 superagent
            </a>
            , upload it to storage, then update the URL in{" "}
            <code className="text-yellow-300">src/components/companionData.jsx</code>.
          </p>
          <div className="bg-gray-900 border border-yellow-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase">
                  <th className="text-left px-4 py-2">Companion</th>
                  <th className="text-left px-4 py-2">Pose</th>
                  <th className="text-left px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {MISSING_BASE_POSES.map((item, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    <td className="px-4 py-2 font-medium capitalize">{item.companion}</td>
                    <td className="px-4 py-2 text-gray-300 capitalize">{item.mood}</td>
                    <td className="px-4 py-2 text-yellow-500 text-xs">⚠️ using placeholder — needs real image</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}