"use client";
import { useState } from "react";
import { downloadCameraAudit, startCameraAudit } from "@/lib/cameraAudit";

export function CameraAuditPanel({ cameraActive, connected, reset }: {
  cameraActive: boolean; connected: boolean; reset: () => Promise<void>;
}) {
  const [trial, setTrial] = useState("P01_front_normal_clear_01");
  const [notes, setNotes] = useState("");
  const [count, setCount] = useState("");
  const [recording, setRecording] = useState(false);
  const [message, setMessage] = useState("");
  return <section className="mb-6 rounded-xl border border-amber-700 p-4 space-y-3 text-sm">
    <h2 className="font-semibold text-amber-200">Camera audit — baseline pipeline</h2>
    <p className="text-slate-300">Use anonymous trial IDs: participant, view, lighting, occlusion, repeat.
      Start the camera first. Start a trial, stand still for 3 seconds, do five comfortable squats,
      then stand still for 3 seconds. Record failures and your actual count. This records landmarks,
      responses and timing in memory; saving downloads a local JSON file. It does not record video.</p>
    <label className="block">Trial ID <input aria-label="Trial ID" value={trial} disabled={recording}
      onChange={e => setTrial(e.target.value)} className="ml-2 bg-slate-800 p-2 rounded" /></label>
    <label className="block">Actual repetitions <input aria-label="Actual repetitions" type="number" min="0"
      value={count} onChange={e => setCount(e.target.value)} className="ml-2 bg-slate-800 p-2 rounded" /></label>
    <label className="block">Observed failures / conditions <textarea aria-label="Observed failures / conditions"
      value={notes} onChange={e => setNotes(e.target.value)} className="block w-full bg-slate-800 p-2 rounded"
      placeholder="Wrong exercise, missed reps, false warning, no pose, delayed feedback; light, camera distance, occluded joints. Include timestamps if possible." /></label>
    <button className="rounded bg-amber-700 px-3 py-2 disabled:opacity-40" disabled={!cameraActive || !connected || recording || !trial.trim()}
      onClick={async () => {
        await reset();
        startCameraAudit({ trial_id: trial, participant_id: trial.split("_")[0], exercise: "squat" });
        setRecording(true); setMessage("Recording — maximum 5,400 pose frames. Save before closing this page.");
      }}>Start audit trial</button>{" "}
    <button className="rounded bg-slate-700 px-3 py-2 disabled:opacity-40" disabled={!recording}
      onClick={() => {
        const n = downloadCameraAudit(notes, count === "" ? null : Number(count));
        setRecording(false); setMessage(`Saved ${n} frames. Keep the JSON, including failed trials.`);
      }}>Stop and save evidence</button>
    <p role="status">{message}</p>
    <p className="text-xs text-slate-400">Timing includes browser pose, backend processing and transport residual.
      Physical sensor-to-display latency and pure network delay remain unmeasured. Model D is not running here.</p>
  </section>;
}
