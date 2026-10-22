"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  CameraOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";
import { getPoseLandmarker, NormalizedLandmark } from "@/lib/mediapipe";
import { usePoseWebSocket } from "@/hooks/usePoseWebSocket";
import { SkeletonCanvas } from "@/components/SkeletonCanvas";
import { cn } from "@/lib/utils";
import { CameraAuditPanel } from "@/components/CameraAuditPanel";
import { recordCommit, recordPose } from "@/lib/cameraAudit";

const EXERCISE_OPTIONS = [
  { id: "auto", label: "Auto-Detect Exercise" },
  { id: "squat", label: "Squat" },
  { id: "pushup", label: "Push-up" },
  { id: "bicep_curl", label: "Bicep Curl (Bilateral)" },
  { id: "alternate_bicep_curl", label: "Alternate Bicep Curl" },
];

export default function WorkoutPage() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState("auto");
  const [fps, setFps] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastLandmarksRef = useRef<NormalizedLandmark[] | null>(null);
  const [currentLandmarks, setCurrentLandmarks] = useState<NormalizedLandmark[] | null>(null);

  const {
    wsState,
    connect,
    disconnect,
    sendLandmarks,
    lastMessage,
    enableVoice,
    setEnableVoice,
    resetSession,
  } = usePoseWebSocket("exercise");

  // Camera initialization
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsCameraActive(true);
          connect();
          startPoseInferenceLoop();
        };
      }
    } catch (err) {
      console.error("Camera access denied or unavailable:", err);
      alert("Please allow camera access in your browser to start real-time exercise coaching.");
    }
  };

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    disconnect();
    setCurrentLandmarks(null);
  }, [disconnect]);

  // MediaPipe real-time inference loop
  const startPoseInferenceLoop = async () => {
    const landmarker = await getPoseLandmarker();
    let lastVideoTime = -1;
    let frameCounter = 0;
    let lastFpsTime = performance.now();

    const loop = () => {
      if (!videoRef.current || videoRef.current.paused || isPaused) {
        animationFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const video = videoRef.current;
      if (video.currentTime !== lastVideoTime && video.readyState >= 2) {
        lastVideoTime = video.currentTime;
        const startTimeMs = performance.now();
        const result = landmarker.detectForVideo(video, startTimeMs);
        const poseEndMs = performance.now();
        const auditFrameId = recordPose(startTimeMs, poseEndMs, video.currentTime, result.landmarks?.[0] || []);

        if (result.landmarks && result.landmarks.length > 0) {
          const lms = result.landmarks[0] as NormalizedLandmark[];
          lastLandmarksRef.current = lms;
          setCurrentLandmarks(lms);

          // Stream landmarks to backend over WebSocket
          sendLandmarks(lms, "auto", auditFrameId);
        } else {
          setCurrentLandmarks(null);
        }

        // FPS calculation
        frameCounter++;
        const now = performance.now();
        if (now - lastFpsTime >= 1000) {
          setFps(frameCounter);
          frameCounter = 0;
          lastFpsTime = now;
        }
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Reliability styling
  useEffect(() => { recordCommit(lastMessage?.frame_id); }, [lastMessage]);

  const isUncertain = lastMessage?.assessment_status === "uncertain";
  const isUnassessable = lastMessage?.assessment_status === "unassessable";

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Top Header & Session Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Activity className="h-6 w-6 text-emerald-400" />
            Live Exercise Coaching Studio
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Live MediaPipe tracking with the baseline pipeline. Research Model D is not connected to this stream.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Exercise Selector */}
          <select
            disabled
            title="Live classification is automatic; manual exercise selection is not implemented."
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 outline-none focus:border-emerald-500"
          >
            {EXERCISE_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Voice Coach Toggle */}
          <button
            onClick={() => setEnableVoice(!enableVoice)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              enableVoice
                ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300"
                : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
            )}
            title="Toggle Voice Feedback"
          >
            {enableVoice ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4" />}
            <span className="hidden sm:inline">Voice Coach</span>
          </button>

          {/* Camera Start/Stop */}
          {!isCameraActive ? (
            <button
              onClick={startCamera}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-slate-950 shadow-sm hover:bg-emerald-400 transition-colors"
            >
              <Camera className="h-4 w-4" />
              Start Camera
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
              >
                {isPaused ? <Play className="h-4 w-4 text-emerald-400" /> : <Pause className="h-4 w-4" />}
                {isPaused ? "Resume" : "Pause"}
              </button>

              <button
                onClick={resetSession}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                title="Reset Reps"
              >
                <RotateCcw className="h-4 w-4 text-slate-400" />
                Reset
              </button>

              <button
                onClick={stopCamera}
                className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition-colors"
              >
                <CameraOff className="h-4 w-4" />
                Stop
              </button>
            </>
          )}
        </div>
      </div>

      <CameraAuditPanel cameraActive={isCameraActive} connected={wsState === "connected"} reset={resetSession} />
      {/* Main Grid: Video Stream + Telemetry Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Camera Feed & Skeleton (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
            {/* Native Video Element */}
            <video
              ref={videoRef}
              playsInline
              muted
              className={cn("h-full w-full object-cover", !isCameraActive && "hidden")}
            />

            {/* Skeleton Overlay */}
            {isCameraActive && (
              <SkeletonCanvas
                landmarks={currentLandmarks}
                width={640}
                height={480}
                jointColors={lastMessage?.joint_colors}
                isRepValid={lastMessage?.is_rep_valid}
              />
            )}

            {/* Inactive State Prompt */}
            {!isCameraActive && (
              <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
                <div className="rounded-full bg-slate-800/80 p-5 mb-4 border border-slate-700">
                  <Camera className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">Camera Offline</h3>
                <p className="mt-2 max-w-sm text-xs text-slate-400 leading-relaxed">
                  Click &ldquo;Start Camera&rdquo; above. All video processing is performed 100% locally on your device via WebGL.
                </p>
                <button
                  onClick={startCamera}
                  className="mt-6 rounded-lg bg-emerald-500 px-5 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition-colors"
                >
                  Enable Camera
                </button>
              </div>
            )}

            {/* Overlay Badges */}
            {isCameraActive && (
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-slate-950/80 backdrop-blur px-3 py-1 text-xs font-medium text-white border border-slate-800">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    {fps} FPS
                  </span>

                  <span className="rounded-full bg-slate-950/80 backdrop-blur px-3 py-1 text-xs font-medium text-slate-300 border border-slate-800">
                    {wsState === "connected" ? (
                      <span className="text-emerald-400">WebSocket Connected</span>
                    ) : (
                      <span className="text-amber-400">Connecting Backend...</span>
                    )}
                  </span>
                </div>

                {/* View Suitability Badge */}
                {lastMessage?.camera_view && (
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold backdrop-blur border",
                      lastMessage.view_suitability === "optimal"
                        ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                        : lastMessage.view_suitability === "suboptimal"
                        ? "bg-rose-950/80 text-rose-300 border-rose-500/40"
                        : "bg-slate-950/80 text-slate-300 border-slate-800"
                    )}
                  >
                    View: {lastMessage.camera_view.toUpperCase()}
                  </span>
                )}
              </div>
            )}

            {/* Bottom Live Feedback Bar */}
            {isCameraActive && (
              <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
                {isUnassessable ? (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-950/90 backdrop-blur p-3.5 shadow-lg flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-rose-200">Assessment Paused (Low Reliability)</p>
                      <p className="text-xs text-rose-300">
                        {lastMessage?.recommendation || "Body partially out of frame. Please adjust distance or lighting."}
                      </p>
                    </div>
                  </div>
                ) : lastMessage?.correction_message ? (
                  <div
                    className={cn(
                      "rounded-xl backdrop-blur p-3.5 shadow-lg flex items-center gap-3 border",
                      lastMessage.is_rep_valid
                        ? "border-emerald-500/40 bg-emerald-950/90"
                        : "border-amber-500/40 bg-amber-950/90"
                    )}
                  >
                    {lastMessage.is_rep_valid ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                    )}
                    <div>
                      <p
                        className={cn(
                          "text-xs font-bold",
                          lastMessage.is_rep_valid ? "text-emerald-200" : "text-amber-200"
                        )}
                      >
                        {lastMessage.is_rep_valid ? "Technique On Target" : "Technique Correction"}
                      </p>
                      <p className="text-xs text-slate-200">{lastMessage.correction_message}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Telemetry & Rep Counters (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Repetition Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Repetition Counter</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-6xl font-extrabold tracking-tight text-white">
                {lastMessage?.rep_count ?? 0}
              </span>
              <div className="flex flex-col items-end">
                <span className="text-xs font-medium text-slate-400">Exercise State</span>
                <span className="text-sm font-semibold text-emerald-400">
                  {lastMessage?.exercise_display || "Scanning..."}
                </span>
              </div>
            </div>

            {/* Movement Phase Indicator */}
            <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950 p-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Phase</span>
                <span className="font-semibold text-slate-200 uppercase tracking-wide">
                  {lastMessage?.phase_display || lastMessage?.rep_phase || "Ready"}
                </span>
              </div>
            </div>
          </div>

          {/* Biomechanical Telemetry Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
              Motion Quality & View Awareness
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Heuristic form score (uncalibrated)</span>
                  <span className="font-semibold">{Math.round((lastMessage?.form_confidence ?? 0) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((lastMessage?.form_confidence ?? 0) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Movement Smoothness (not SPARC)</span>
                  <span className="font-semibold">
                    {lastMessage?.smoothness_score === undefined ? "Not provided" : `${Math.round(lastMessage.smoothness_score * 100)}%`}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((lastMessage?.smoothness_score ?? 0) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Bilateral Symmetry Ratio</span>
                  <span className="font-semibold">
                    {lastMessage?.symmetry_ratio === undefined ? "Not provided" : `${Math.round(lastMessage.symmetry_ratio * 100)}%`}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((lastMessage?.symmetry_ratio ?? 0) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Active Observations List */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Observed Form Deviations
            </h3>

            {lastMessage?.violations && lastMessage.violations.length > 0 ? (
              <ul className="space-y-2">
                {lastMessage.violations.map((v, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-950/20 p-2.5 text-xs text-amber-300"
                  >
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500">
                <CheckCircle2 className="h-8 w-8 text-emerald-500/40 mb-2" />
                <p className="text-xs">No technique defects observed in current repetition.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
