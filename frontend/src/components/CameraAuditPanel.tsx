"use client";

import { useState } from "react";
import { downloadCameraAudit, startCameraAudit } from "@/lib/cameraAudit";
import { Play, Square, Download, CheckCircle2, AlertCircle } from "lucide-react";

export function CameraAuditPanel({
  cameraActive,
  connected,
  reset,
}: {
  cameraActive: boolean;
  connected: boolean;
  reset: () => Promise<void>;
}) {
  const [trial, setTrial] = useState("P01_front_normal_clear_01");
  const [notes, setNotes] = useState("");
  const [count, setCount] = useState("");
  const [recording, setRecording] = useState(false);
  const [message, setMessage] = useState("");

  const handleStart = async () => {
    await reset();
    startCameraAudit({
      trial_id: trial,
      participant_id: trial.split("_")[0],
      exercise: "squat",
    });
    setRecording(true);
    setMessage("Recording telemetry — maximum 5,400 pose frames buffer.");
  };

  const handleStopAndSave = () => {
    const n = downloadCameraAudit(notes, count === "" ? null : Number(count));
    setRecording(false);
    setMessage(`Telemetry captured: saved ${n} frames to JSON evidence.`);
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-3.5 text-slate-300 space-y-1">
        <p className="font-semibold text-white">Researcher Telemetry Capture</p>
        <p className="text-slate-400 leading-relaxed">
          Collects in-memory pose coordinate frames, network round-trip timing, and state transitions
          for scientific latency analysis. No camera video is ever recorded or uploaded.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-400 font-medium mb-1">Trial Identifier</label>
          <input
            aria-label="Trial ID"
            value={trial}
            disabled={recording}
            onChange={(e) => setTrial(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            placeholder="e.g. P01_front_normal_01"
          />
        </div>

        <div>
          <label className="block text-slate-400 font-medium mb-1">Observed Physical Repetitions</label>
          <input
            aria-label="Actual repetitions"
            type="number"
            min="0"
            value={count}
            disabled={recording}
            onChange={(e) => setCount(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            placeholder="e.g. 5"
          />
        </div>
      </div>

      <div>
        <label className="block text-slate-400 font-medium mb-1">
          Observer Observations / Environmental Conditions
        </label>
        <textarea
          aria-label="Observed failures or conditions"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          placeholder="Lighting conditions, camera angle, occlusion notes, or observed tracking anomalies..."
        />
      </div>

      <div className="flex flex-wrap items-center gap-2.5 pt-1">
        <button
          disabled={!cameraActive || !connected || recording || !trial.trim()}
          onClick={handleStart}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 transition"
        >
          <Play className="h-3.5 w-3.5" />
          <span>Start Audit Trial</span>
        </button>

        <button
          disabled={!recording}
          onClick={handleStopAndSave}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-40 transition"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Stop & Save Evidence JSON</span>
        </button>
      </div>

      {message && (
        <div className="flex items-center gap-2 text-indigo-300 font-medium">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
