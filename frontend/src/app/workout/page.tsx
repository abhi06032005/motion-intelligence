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
  Activity,
  X,
} from "lucide-react";
import { getPoseLandmarker, NormalizedLandmark } from "@/lib/mediapipe";
import { usePoseWebSocket } from "@/hooks/usePoseWebSocket";
import { SkeletonCanvas } from "@/components/SkeletonCanvas";
import { DashboardShell } from "@/components/DashboardShell";
import { cn } from "@/lib/utils";
import { recordCommit, recordPose } from "@/lib/cameraAudit";
import { saveSession } from "@/lib/sessionStorage";

export default function WorkoutPage() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [fps, setFps] = useState(0);
  const [sessionSavedNotification, setSessionSavedNotification] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [currentLandmarks, setCurrentLandmarks] = useState<NormalizedLandmark[] | null>(null);

  // Stale-closure and concurrency guards
  const isPausedRef = useRef<boolean>(false);
  const isLoopRunningRef = useRef<boolean>(false);
  const startAttemptIdRef = useRef<number>(0);
  const activeStreamRef = useRef<MediaStream | null>(null);

  // Session data tracking refs
  const sessionStartTimeRef = useRef<number | null>(null);
  const lastObservedRepCountRef = useRef<number>(0);
  const completedRepsRef = useRef<number>(0);
  const validRepsCountRef = useRef<number>(0);
  const observedViolationsRef = useRef<Set<string>>(new Set());
  const sessionSavedRef = useRef<boolean>(false);
  const lastMessageRef = useRef<any>(null);

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

  // Keep message ref updated
  useEffect(() => {
    lastMessageRef.current = lastMessage;
  }, [lastMessage]);

  // Keep isPaused ref synchronized
  useEffect(() => {
    isPausedRef.current = isPaused;
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else if (isCameraActive) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isPaused, isCameraActive]);

  // Track per-repetition validity honestly without fabricating historical accuracy
  useEffect(() => {
    if (!lastMessage) return;

    const currentRepCount = lastMessage.rep_count ?? 0;
    const previousRepCount = lastObservedRepCountRef.current;

    // Detect new repetition completion
    if (currentRepCount > previousRepCount) {
      const increment = currentRepCount - previousRepCount;
      completedRepsRef.current = currentRepCount;

      // Check if this newly finished rep satisfied form criteria
      const isRepValid = lastMessage.is_rep_valid !== false && (!lastMessage.violations || lastMessage.violations.length === 0);
      if (isRepValid) {
        validRepsCountRef.current += increment;
      }

      lastObservedRepCountRef.current = currentRepCount;
    }

    if (lastMessage.violations && lastMessage.violations.length > 0) {
      lastMessage.violations.forEach((v: string) => observedViolationsRef.current.add(v));
    }
  }, [lastMessage]);

  // Stable hardware cleanup function with ZERO dynamic dependencies
  const cleanupHardwareStream = useCallback(() => {
    // 1. Invalidate ongoing startup attempts
    startAttemptIdRef.current++;

    // 2. Cancel animation frame
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    isLoopRunningRef.current = false;

    // 3. Stop all media stream tracks
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      activeStreamRef.current = null;
    }

    // 4. Reset video element
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    // 5. Disconnect WebSocket and reset state
    disconnect();
    setCurrentLandmarks(null);
    setIsCameraActive(false);
    setIsPaused(false);
    isPausedRef.current = false;
  }, [disconnect]);

  // Save session when user explicitly stops the workout
  const persistSessionOnStop = useCallback(() => {
    if (sessionSavedRef.current) return;

    const totalReps = completedRepsRef.current;
    if (totalReps > 0 && sessionStartTimeRef.current) {
      sessionSavedRef.current = true;
      const duration = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
      const msg = lastMessageRef.current;
      const exercise = msg?.exercise_display || "Exercise";
      const cameraView = msg?.camera_view && msg.camera_view !== "unknown"
        ? msg.camera_view.toUpperCase()
        : "Unspecified";

      saveSession({
        exercise,
        reps: totalReps,
        validReps: validRepsCountRef.current,
        smoothness: msg?.smoothness_score ?? null,
        symmetry: msg?.symmetry_ratio ?? null,
        cameraView,
        violations: Array.from(observedViolationsRef.current),
        durationSeconds: duration,
        source: "live",
        confidence: msg?.form_confidence ?? null,
      });

      setSessionSavedNotification(
        `Session saved: ${totalReps} ${exercise} reps (${validRepsCountRef.current} valid) recorded to History.`
      );
      setTimeout(() => setSessionSavedNotification(null), 5000);
    }
  }, []);

  // User-facing Stop handler
  const handleStopCamera = useCallback(() => {
    persistSessionOnStop();
    cleanupHardwareStream();
  }, [persistSessionOnStop, cleanupHardwareStream]);

  // Guaranteed unmount cleanup with empty dependencies
  useEffect(() => {
    return () => {
      cleanupHardwareStream();
    };
  }, [cleanupHardwareStream]);

  // User-facing Start handler
  const handleStartCamera = async () => {
    // Generate new attempt ID to guard against rapid start/stop race conditions
    const attemptId = ++startAttemptIdRef.current;
    cleanupHardwareStream();
    startAttemptIdRef.current = attemptId;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });

      // If user aborted or clicked stop while awaiting camera prompt, stop track immediately
      if (startAttemptIdRef.current !== attemptId) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      activeStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          if (startAttemptIdRef.current !== attemptId) return;

          try {
            await videoRef.current?.play();
            setIsCameraActive(true);
            sessionStartTimeRef.current = Date.now();
            sessionSavedRef.current = false;
            completedRepsRef.current = 0;
            validRepsCountRef.current = 0;
            lastObservedRepCountRef.current = 0;
            observedViolationsRef.current.clear();

            connect();
            startPoseInferenceLoop(attemptId);
          } catch (playErr) {
            console.error("Video play error:", playErr);
          }
        };
      }
    } catch (err) {
      console.error("Camera access denied or unavailable:", err);
      alert("Please allow camera access in your browser to start real-time exercise coaching.");
    }
  };

  // Inference loop with cancellation and pause guards
  const startPoseInferenceLoop = async (attemptId: number) => {
    if (isLoopRunningRef.current) return;
    isLoopRunningRef.current = true;

    let landmarker;
    try {
      landmarker = await getPoseLandmarker();
    } catch (err) {
      console.error("PoseLandmarker failed to load:", err);
      isLoopRunningRef.current = false;
      return;
    }

    // Check if start was cancelled while landmarker was downloading
    if (startAttemptIdRef.current !== attemptId) {
      isLoopRunningRef.current = false;
      return;
    }

    let lastVideoTime = -1;
    let frameCounter = 0;
    let lastFpsTime = performance.now();

    const loop = () => {
      if (startAttemptIdRef.current !== attemptId) {
        isLoopRunningRef.current = false;
        return;
      }

      // If paused or video not ready, keep loop alive without inference
      if (!videoRef.current || videoRef.current.paused || isPausedRef.current) {
        animationFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const video = videoRef.current;
      if (video.currentTime !== lastVideoTime && video.readyState >= 2) {
        lastVideoTime = video.currentTime;
        const startTimeMs = performance.now();

        try {
          const result = landmarker.detectForVideo(video, startTimeMs);
          const poseEndMs = performance.now();
          const auditFrameId = recordPose(startTimeMs, poseEndMs, video.currentTime, result.landmarks?.[0] || []);

          if (result.landmarks && result.landmarks.length > 0) {
            const lms = result.landmarks[0] as NormalizedLandmark[];
            setCurrentLandmarks(lms);
            sendLandmarks(lms, "auto", auditFrameId);
          } else {
            setCurrentLandmarks(null);
          }
        } catch (inferenceErr) {
          console.warn("Frame inference error:", inferenceErr);
        }

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
    recordCommit(lastMessage?.frame_id);
  }, [lastMessage]);

  const isUnassessable = lastMessage?.assessment_status === "unassessable";

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Top Header & Session Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#F0F1F3]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202226] tracking-tight flex items-center gap-2.5">
              <Camera className="h-6 w-6 text-[#202226]" />
              Live Analysis Studio
            </h1>
            <p className="text-xs sm:text-sm text-[#8E9399] mt-0.5">
              Real-time MediaPipe 33-point tracking with view-aware biomechanical assessment
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Voice Coach Toggle */}
            <button
              onClick={() => setEnableVoice(!enableVoice)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all shadow-2xs border",
                enableVoice
                  ? "border-[#CEECE7] bg-[#D9F0EC] text-[#202226]"
                  : "border-[#E9EBED] bg-white text-[#8E9399] hover:text-[#202226]"
              )}
              title="Toggle Spoken Feedback"
            >
              {enableVoice ? <Volume2 className="h-4 w-4 text-[#202226]" /> : <VolumeX className="h-4 w-4" />}
              <span>Voice Coach</span>
            </button>

            {/* Camera Start/Stop / Pause */}
            {!isCameraActive ? (
              <button
                onClick={handleStartCamera}
                className="flex items-center gap-2 rounded-full bg-[#202226] hover:bg-black px-5 py-2 text-xs font-semibold text-white shadow-xs transition-all"
              >
                <Camera className="h-4 w-4" />
                Start Camera
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className="flex items-center gap-1.5 rounded-full border border-[#E9EBED] bg-white px-4 py-2 text-xs font-semibold text-[#202226] hover:bg-[#F0F1F3] transition-colors shadow-2xs"
                >
                  {isPaused ? <Play className="h-4 w-4 text-emerald-600" /> : <Pause className="h-4 w-4" />}
                  {isPaused ? "Resume" : "Pause"}
                </button>

                <button
                  onClick={resetSession}
                  className="flex items-center gap-1.5 rounded-full border border-[#E9EBED] bg-white px-4 py-2 text-xs font-semibold text-[#8E9399] hover:text-[#202226] hover:bg-[#F0F1F3] transition-colors shadow-2xs"
                  title="Reset Rep Counter"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>

                <button
                  onClick={handleStopCamera}
                  className="flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors shadow-2xs"
                >
                  <CameraOff className="h-4 w-4" />
                  Stop
                </button>
              </>
            )}
          </div>
        </div>

        {/* Session Saved Notification Toast */}
        {sessionSavedNotification && (
          <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-[#EAF7F5] p-3.5 text-xs text-emerald-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{sessionSavedNotification}</span>
            </div>
            <button
              onClick={() => setSessionSavedNotification(null)}
              className="text-emerald-700 hover:text-emerald-950"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Main Grid: Video Stream + Telemetry Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Camera Feed & Skeleton (8 Cols) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[26px] border border-[#E9EBED] bg-[#202223] shadow-xs">
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
                <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-[#F0F1F3]">
                  <div className="rounded-full bg-white p-5 mb-4 border border-[#E9EBED] shadow-xs">
                    <Camera className="h-8 w-8 text-[#202226]" />
                  </div>
                  <h3 className="text-base font-bold text-[#202226]">Camera Inactive</h3>
                  <p className="mt-1.5 max-w-sm text-xs text-[#8E9399] leading-relaxed">
                    Click &ldquo;Start Camera&rdquo; to begin real-time posture tracking. Raw camera video remains strictly inside your browser.
                  </p>
                  <button
                    onClick={handleStartCamera}
                    className="mt-5 rounded-full bg-[#202226] hover:bg-black px-6 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors"
                  >
                    Start Camera
                  </button>
                </div>
              )}

              {/* Overlay Badges */}
              {isCameraActive && (
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-xs px-3 py-1 text-xs font-semibold text-[#202226] border border-white/60 shadow-xs">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      {fps} FPS
                    </span>

                    <span className="rounded-full bg-white/90 backdrop-blur-xs px-3 py-1 text-xs font-semibold text-[#202226] border border-white/60 shadow-xs">
                      {wsState === "connected" ? (
                        <span className="text-emerald-700">Connected</span>
                      ) : (
                        <span className="text-amber-700">Connecting Backend...</span>
                      )}
                    </span>
                  </div>

                  {/* Viewpoint Suitability Badge */}
                  {lastMessage?.camera_view && lastMessage.camera_view !== "unknown" && (
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-xs border shadow-xs",
                        lastMessage.view_suitability === "optimal"
                          ? "bg-[#D9F0EC]/90 text-[#202226] border-[#CEECE7]"
                          : lastMessage.view_suitability === "suboptimal"
                          ? "bg-rose-100/90 text-rose-800 border-rose-200"
                          : "bg-white/90 text-[#202226] border-white/60"
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
                    <div className="rounded-2xl border border-rose-300 bg-white/95 backdrop-blur-xs p-3.5 shadow-sm flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-rose-900">Assessment Paused (Low Visibility)</p>
                        <p className="text-xs text-rose-700">
                          {lastMessage?.recommendation || "Full body not in view. Please step back into frame."}
                        </p>
                      </div>
                    </div>
                  ) : lastMessage?.correction_message ? (
                    <div
                      className={cn(
                        "rounded-2xl backdrop-blur-xs p-3.5 shadow-sm flex items-center gap-3 border",
                        lastMessage.is_rep_valid
                          ? "border-[#CEECE7] bg-[#EAF7F5]/95 text-[#202226]"
                          : "border-amber-300 bg-white/95 text-amber-900"
                      )}
                    >
                      {lastMessage.is_rep_valid ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                      )}
                      <div>
                        <p className="text-xs font-bold">
                          {lastMessage.is_rep_valid ? "Technique On Target" : "Technique Correction"}
                        </p>
                        <p className="text-xs">{lastMessage.correction_message}</p>
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
            <div className="rounded-[26px] border border-[#E9EBED] bg-white p-5 shadow-2xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#8E9399]">Repetitions</span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-5xl font-extrabold tracking-tight text-[#202226]">
                  {lastMessage?.rep_count ?? 0}
                </span>
                <div className="flex flex-col items-end">
                  <span className="text-[11px] font-medium text-[#8E9399]">Exercise</span>
                  <span className="text-xs font-bold text-[#202226] bg-[#D9F0EC] px-2.5 py-0.5 rounded-full mt-0.5">
                    {lastMessage?.exercise_display || "Scanning..."}
                  </span>
                </div>
              </div>

              {/* Movement Phase Indicator */}
              <div className="mt-4 rounded-2xl border border-[#E9EBED] bg-[#F0F1F3] p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8E9399]">Current Phase</span>
                  <span className="font-bold text-[#202226] uppercase tracking-wide">
                    {lastMessage?.phase_display || lastMessage?.rep_phase || "Ready"}
                  </span>
                </div>
              </div>
            </div>

            {/* Biomechanical Telemetry Card */}
            <div className="rounded-[26px] border border-[#E9EBED] bg-white p-5 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E9399] mb-3.5">
                Movement Quality Metrics
              </h3>

              <div className="space-y-3.5 text-xs">
                <div>
                  <div className="flex justify-between text-[#202226] mb-1 font-medium">
                    <span>Form Score</span>
                    <span className="font-bold">
                      {lastMessage?.form_confidence ? `${Math.round(lastMessage.form_confidence * 100)}%` : "Ready"}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#F0F1F3] overflow-hidden">
                    <div
                      className="h-full bg-[#202226] rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((lastMessage?.form_confidence ?? 0) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[#202226] mb-1 font-medium">
                    <span>Kinematic Smoothness</span>
                    <span className="font-bold">
                      {lastMessage?.smoothness_score != null ? `${Math.round(lastMessage.smoothness_score * 100)}%` : "Calculating..."}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#F0F1F3] overflow-hidden">
                    <div
                      className="h-full bg-[#D9F0EC] rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((lastMessage?.smoothness_score ?? 0) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[#202226] mb-1 font-medium">
                    <span>Bilateral Symmetry</span>
                    <span className="font-bold">
                      {lastMessage?.symmetry_ratio != null ? `${Math.round(lastMessage.symmetry_ratio * 100)}%` : "Calculating..."}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#F0F1F3] overflow-hidden">
                    <div
                      className="h-full bg-[#EDE2F2] rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((lastMessage?.symmetry_ratio ?? 0) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Deviations Card */}
            <div className="rounded-[26px] border border-[#E9EBED] bg-white p-5 shadow-2xs flex-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E9399] mb-3">
                Observed Feedback
              </h3>

              {lastMessage?.violations && lastMessage.violations.length > 0 ? (
                <ul className="space-y-2">
                  {lastMessage.violations.map((v: string, i: number) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900"
                    >
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center text-[#8E9399]">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                  <p className="text-xs font-medium text-[#202226]">Technique is within target biomechanical ranges.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
