// Opt-in, in-memory evidence collection. No camera video is recorded or uploaded.
import type { NormalizedLandmark } from "./mediapipe";

type Frame = {
  id: number; inference_start_ms: number; pose_ms: number; video_time_sec: number;
  landmarks: NormalizedLandmark[]; sent_ms?: number; received_ms?: number;
  backend_processing_ms?: number; response?: unknown; committed_ms?: number;
  after_animation_frames_ms?: number;
};
let active = false;
let nextId = 1;
let frames: Frame[] = [];
let byId = new Map<number, Frame>();
let metadata: Record<string, unknown> = {};
let omitted = 0;

export function startCameraAudit(details: Record<string, unknown>) {
  frames = []; byId = new Map(); omitted = 0;
  metadata = { ...details, started_utc: new Date().toISOString(), user_agent: navigator.userAgent };
  active = true;
}
export function recordPose(start: number, end: number, videoTime: number, landmarks: NormalizedLandmark[]) {
  const id = nextId++;
  if (!active) return id;
  if (frames.length >= 5400) { omitted++; return id; }
  const frame: Frame = { id, inference_start_ms: start, pose_ms: end - start, video_time_sec: videoTime,
    landmarks: landmarks.map(l => ({ ...l })) };
  frames.push(frame); byId.set(id, frame);
  return id;
}
export function recordSend(id: number) { const f = byId.get(id); if (active && f) f.sent_ms = performance.now(); }
export function recordResponse(id: number | undefined, response: unknown, backendMs?: number) {
  const f = id === undefined ? undefined : byId.get(id);
  if (active && f) { f.received_ms = performance.now(); f.backend_processing_ms = backendMs; f.response = response; }
}
export function recordCommit(id: number | undefined) {
  const f = id === undefined ? undefined : byId.get(id);
  if (!active || !f || f.committed_ms !== undefined) return;
  f.committed_ms = performance.now();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (active) f.after_animation_frames_ms = performance.now();
  }));
}
export function downloadCameraAudit(notes: string, observedReps: number | null) {
  active = false;
  const payload = {
    schema: "motioniq.camera-audit.v1", evidence_type: "user_operated_camera_capture",
    model: "live_FormManager_baseline_not_Model_D", metadata, stopped_utc: new Date().toISOString(),
    observer_notes: notes, observer_count: observedReps, omitted_frames_at_capacity: omitted,
    physical_sensor_to_display_ms: null, pure_network_delay_ms: null,
    timing_definitions: {
      pose_ms: "Synchronous detectForVideo duration; excludes camera capture and model initialization",
      backend_processing_ms: "Server after receive_json through response construction; excludes socket send",
      transport_residual_ms: "received_ms - sent_ms - backend_processing_ms; includes serialization, queuing, parsing and both network directions; not pure network latency",
      app_feedback_proxy_ms: "after_animation_frames_ms - inference_start_ms; double requestAnimationFrame after React commit; not physical display or sensor latency",
      no_landmarks: "Empty landmarks are retained as detection failures; not sent to backend",
      missing_response: "Sent frames without received_ms may have been rate-limited, lost, pending at stop or disconnected",
    }, frames,
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload)], { type: "application/json" }));
  const link = document.createElement("a"); link.href = url;
  link.download = `MotionIQ_camera_${String(metadata.trial_id || "trial")}_${Date.now()}.json`;
  link.click(); URL.revokeObjectURL(url);
  return frames.length;
}
