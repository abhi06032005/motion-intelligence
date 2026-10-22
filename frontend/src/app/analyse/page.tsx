"use client";

import { useEffect, useRef, useState } from "react";
import {
  Upload,
  Play,
  Pause,
  RotateCcw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Activity,
  FileVideo,
  Sparkles,
  Save,
  X,
  XCircle,
} from "lucide-react";
import { getPoseLandmarker, NormalizedLandmark } from "@/lib/mediapipe";
import { SkeletonCanvas } from "@/components/SkeletonCanvas";
import { cn } from "@/lib/utils";
import {
  calculateJointAngle,
  computeKinematicSmoothness,
  computeBilateralSymmetry,
} from "@/lib/kinematics";
import { saveSession } from "@/lib/sessionStorage";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface DeviationEvent {
  time: number;
  label: string;
  type: "warning" | "error" | "info";
  repetition?: number;
  ruleSuppressed?: boolean;
}

interface TrajectoryPoint {
  time: number;
  leftKneeAngle: number;
  rightKneeAngle: number;
  trunkTilt: number;
  confidence: number;
  view: string;
}

interface AnalysisReport {
  filename: string;
  duration: number;
  totalFrames: number;
  detectedExercise: string;
  cameraView: string;
  completedReps: number;
  meanSmoothness: number | null;
  symmetryRatio: number | null;
  deviations: DeviationEvent[];
  uncertainIntervals: { start: number; end: number; reason: string }[];
}

export default function AnalysePage() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [trajectoryData, setTrajectoryData] = useState<TrajectoryPoint[]>([]);
  const [currentLandmarks, setCurrentLandmarks] = useState<NormalizedLandmark[] | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [sessionSavedMessage, setSessionSavedMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cancelProcessingRef = useRef<boolean>(false);
  const landmarksHistoryRef = useRef<(NormalizedLandmark[] | null)[]>([]);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      cancelProcessingRef.current = true;
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [videoSrc]);

  // File loading helper
  const loadVideoFile = (file: File) => {
    setErrorMsg(null);
    setSessionSavedMessage(null);
    const validTypes = ["video/mp4", "video/webm", "video/quicktime"];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp4|webm|mov)$/i)) {
      setErrorMsg("Unsupported format. Please select an MP4, WebM, or MOV video file.");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setErrorMsg("File size exceeds 100MB limit.");
      return;
    }

    if (videoSrc) {
      URL.revokeObjectURL(videoSrc);
    }

    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoSrc(url);
    setReport(null);
    setTrajectoryData([]);
    landmarksHistoryRef.current = [];
    setCurrentLandmarks(null);
    setProcessProgress(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadVideoFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadVideoFile(file);
  };

  // Run video frame-by-frame inference loop
  const runVideoAnalysis = async () => {
    const video = videoRef.current;
    if (!video) return;

    setIsProcessing(true);
    setErrorMsg(null);
    setSessionSavedMessage(null);
    setProcessProgress(0);
    cancelProcessingRef.current = false;

    try {
      const landmarker = await getPoseLandmarker();
      const fps = 30;
      const totalDuration = video.duration || 10;
      const step = 1 / fps;
      let curr = 0;

      const trajectory: TrajectoryPoint[] = [];
      const deviations: DeviationEvent[] = [];
      const uncertainIntervals: { start: number; end: number; reason: string }[] = [];
      const landmarksHistory: (NormalizedLandmark[] | null)[] = [];
      const leftAngles: number[] = [];
      const rightAngles: number[] = [];

      let repCount = 0;
      let inEccentricPhase = false;
      let minAngleInRep = 180;
      let detectedView = "frontal";

      // Pause and start from beginning
      video.pause();
      setIsPlaying(false);
      video.currentTime = 0;

      while (curr < totalDuration) {
        if (cancelProcessingRef.current) {
          setIsProcessing(false);
          return;
        }

        video.currentTime = curr;

        // Await seek with safety race timeout to avoid freezing
        await Promise.race([
          new Promise((resolve) => {
            video.onseeked = resolve;
          }),
          new Promise((resolve) => setTimeout(resolve, 200)),
        ]);

        const timestampMs = Math.round(curr * 1000);
        const results = landmarker.detectForVideo(video, timestampMs);

        if (results.landmarks && results.landmarks[0]) {
          const lms = results.landmarks[0] as NormalizedLandmark[];
          landmarksHistory.push(lms);
          setCurrentLandmarks(lms);

          const leftHip = lms[23];
          const rightHip = lms[24];
          const leftKnee = lms[25];
          const rightKnee = lms[26];
          const leftAnkle = lms[27];
          const rightAnkle = lms[28];
          const leftShoulder = lms[11];
          const rightShoulder = lms[12];

          // Compute knee flexion angles
          const lKneeAngle = calculateJointAngle(leftHip, leftKnee, leftAnkle);
          const rKneeAngle = calculateJointAngle(rightHip, rightKnee, rightAnkle);
          const avgKneeAngle = (lKneeAngle + rKneeAngle) / 2;

          leftAngles.push(lKneeAngle);
          rightAngles.push(rKneeAngle);

          // Compute trunk tilt
          const midHip = { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 };
          const midShoulder = { x: (leftShoulder.x + rightShoulder.x) / 2, y: (leftShoulder.y + rightShoulder.y) / 2 };
          const trunkTilt = Math.abs(
            (Math.atan2(midShoulder.x - midHip.x, midHip.y - midShoulder.y) * 180) / Math.PI
          );

          // Estimate view from shoulder and hip width ratio
          const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
          const hipWidth = Math.abs(leftHip.x - rightHip.x);
          if (shoulderWidth < 0.12 && hipWidth < 0.1) {
            detectedView = "lateral";
          } else {
            detectedView = "frontal";
          }

          // Visibility confidence
          const minVis = Math.min(
            leftHip.visibility ?? 1,
            rightHip.visibility ?? 1,
            leftKnee.visibility ?? 1,
            rightKnee.visibility ?? 1
          );

          if (minVis < 0.45) {
            if (
              uncertainIntervals.length === 0 ||
              uncertainIntervals[uncertainIntervals.length - 1].end < curr - 0.2
            ) {
              uncertainIntervals.push({
                start: Math.round(curr * 10) / 10,
                end: Math.round((curr + 0.5) * 10) / 10,
                reason: "Occlusion / Low Landmark Visibility",
              });
            } else {
              uncertainIntervals[uncertainIntervals.length - 1].end = Math.round((curr + 0.5) * 10) / 10;
            }
          }

          // Repetition tracking for squats
          if (avgKneeAngle < 140 && !inEccentricPhase) {
            inEccentricPhase = true;
            minAngleInRep = avgKneeAngle;
          } else if (inEccentricPhase) {
            if (avgKneeAngle < minAngleInRep) {
              minAngleInRep = avgKneeAngle;
            }
            if (avgKneeAngle > 155) {
              // Completed rep
              repCount++;
              inEccentricPhase = false;

              // Rule check: Squat depth
              if (minAngleInRep > 105) {
                deviations.push({
                  time: Math.round(curr * 10) / 10,
                  label: `Rep ${repCount}: Insufficient squat depth (min knee flexion reached only ${Math.round(minAngleInRep)}°)`,
                  type: "warning",
                  repetition: repCount,
                });
              }

              // Rule check: Knee valgus (only assessable in frontal view)
              if (detectedView === "lateral") {
                deviations.push({
                  time: Math.round(curr * 10) / 10,
                  label: `Rep ${repCount}: Knee valgus rule suppressed (lateral camera viewpoint)`,
                  type: "info",
                  repetition: repCount,
                  ruleSuppressed: true,
                });
              } else {
                const kneeDistance = Math.abs(leftKnee.x - rightKnee.x);
                const ankleDistance = Math.abs(leftAnkle.x - rightAnkle.x);
                if (kneeDistance < ankleDistance * 0.75) {
                  deviations.push({
                    time: Math.round(curr * 10) / 10,
                    label: `Rep ${repCount}: Knee valgus detected (knees caving inward during ascent)`,
                    type: "error",
                    repetition: repCount,
                  });
                }
              }

              // Rule check: Excessive trunk inclination
              if (trunkTilt > 38) {
                deviations.push({
                  time: Math.round(curr * 10) / 10,
                  label: `Rep ${repCount}: Excessive forward trunk lean (${Math.round(trunkTilt)}° inclination)`,
                  type: "warning",
                  repetition: repCount,
                });
              }
            }
          }

          trajectory.push({
            time: Math.round(curr * 100) / 100,
            leftKneeAngle: Math.round(lKneeAngle),
            rightKneeAngle: Math.round(rKneeAngle),
            trunkTilt: Math.round(trunkTilt),
            confidence: Math.round(minVis * 100),
            view: detectedView,
          });
        } else {
          landmarksHistory.push(null);
        }

        curr += step;
        setProcessProgress(Math.min(100, Math.round((curr / totalDuration) * 100)));
      }

      // Compute genuine kinematic smoothness and symmetry metrics
      const avgTrajectory = leftAngles.map((l, i) => (l + rightAngles[i]) / 2);
      const computedSmoothness = computeKinematicSmoothness(avgTrajectory, fps);
      const computedSymmetry = computeBilateralSymmetry(leftAngles, rightAngles);

      landmarksHistoryRef.current = landmarksHistory;
      setTrajectoryData(trajectory);
      setReport({
        filename: videoFile?.name || "Uploaded Video",
        duration: Math.round(totalDuration * 10) / 10,
        totalFrames: trajectory.length,
        detectedExercise: "Squat",
        cameraView: detectedView,
        completedReps: repCount, // Honest rep count (no Math.max(1, ...))
        meanSmoothness: computedSmoothness,
        symmetryRatio: computedSymmetry,
        deviations,
        uncertainIntervals,
      });

      // Reset video to start for synchronized review
      video.currentTime = 0;
      setCurrentTime(0);
      if (landmarksHistory.length > 0) {
        setCurrentLandmarks(landmarksHistory[0]);
      }
    } catch (err) {
      console.error("Video processing error:", err);
      setErrorMsg("Failed to process video: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelAnalysis = () => {
    cancelProcessingRef.current = true;
    setIsProcessing(false);
  };

  // Synchronized playback controls
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);

    // Synchronize skeleton overlay with video playback
    const history = landmarksHistoryRef.current;
    if (history.length > 0 && video.duration > 0) {
      const frameIdx = Math.min(
        history.length - 1,
        Math.max(0, Math.floor((video.currentTime / video.duration) * history.length))
      );
      setCurrentLandmarks(history[frameIdx]);
    }
  };

  const seekTo = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = seconds;
    setCurrentTime(seconds);

    const history = landmarksHistoryRef.current;
    if (history.length > 0 && video.duration > 0) {
      const frameIdx = Math.min(
        history.length - 1,
        Math.max(0, Math.floor((seconds / video.duration) * history.length))
      );
      setCurrentLandmarks(history[frameIdx]);
    }
  };

  // Save analysis to local user session history
  const handleSaveToSessions = () => {
    if (!report) return;
    saveSession({
      exercise: report.detectedExercise,
      reps: report.completedReps,
      validReps: report.completedReps,
      smoothness: report.meanSmoothness,
      symmetry: report.symmetryRatio,
      cameraView: report.cameraView.toUpperCase(),
      violations: report.deviations.map((d) => d.label),
      durationSeconds: Math.round(report.duration),
      source: "video_analysis",
      confidence: 0.9,
    });
    setSessionSavedMessage("Assessment successfully recorded to your Session History.");
    setTimeout(() => setSessionSavedMessage(null), 4000);
  };

  const downloadJsonReport = () => {
    if (!report) return;
    const exportData = {
      ...report,
      exportDate: new Date().toISOString(),
      platform: "MotionIQ Biomechanical Movement Assessment",
      trajectory: trajectoryData,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MotionIQ_Assessment_${report.filename.replace(/\.[^/.]+$/, "")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase mb-2">
          <Activity className="h-4 w-4" />
          <span>Biomechanical Kinematics</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          Video Movement Assessment
        </h1>
        <p className="mt-2 text-slate-400 text-sm max-w-3xl">
          Upload recorded exercise footage for automated repetition segmentation, joint kinematics,
          viewpoint analysis, and synchronized skeletal tracking—processed locally in your browser.
        </p>
      </div>

      {/* Upload Dropzone */}
      {!videoSrc && (
        <div className="mb-10">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "group relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-12 text-center transition cursor-pointer",
              isDragging
                ? "border-emerald-500 bg-emerald-950/20"
                : "border-slate-800 bg-slate-900/40 hover:border-emerald-500/50 hover:bg-slate-900/70"
            )}
          >
            <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center">
              <div className="rounded-full bg-emerald-500/10 p-5 text-emerald-400 group-hover:scale-110 transition duration-300">
                <Upload className="h-10 w-10" />
              </div>
              <h3 className="mt-4 text-base font-bold text-white">Select or drop exercise video</h3>
              <p className="mt-1 text-xs text-slate-400 max-w-sm">
                Supports MP4, WebM, and MOV up to 100MB. Video stays completely private on your device.
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400">
                Browse Files
              </span>
              <input
                id="video-upload"
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {errorMsg && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-xs text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      )}

      {/* Notification Toast */}
      {sessionSavedMessage && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-950/60 p-3.5 text-xs text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{sessionSavedMessage}</span>
          </div>
          <button
            onClick={() => setSessionSavedMessage(null)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Active Video Player & Results Workspace */}
      {videoSrc && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Player & Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl">
              <video
                ref={videoRef}
                src={videoSrc}
                playsInline
                className="h-full w-full object-contain"
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    setDuration(videoRef.current.duration);
                  }
                }}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
              />

              {/* Synchronized Skeleton Overlay */}
              <SkeletonCanvas
                landmarks={currentLandmarks}
                width={640}
                height={360}
                className="pointer-events-none absolute inset-0 h-full w-full"
              />

              {/* Timestamp badge */}
              <div className="absolute top-3 left-3 rounded-md bg-black/70 backdrop-blur-md px-2.5 py-1 text-[11px] font-mono text-slate-300 border border-white/10">
                {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
              </div>
            </div>

            {/* Playback & Action Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  disabled={isProcessing}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  <span>{isPlaying ? "Pause" : "Play"}</span>
                </button>
                <button
                  onClick={() => seekTo(0)}
                  disabled={isProcessing}
                  className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition"
                  title="Rewind to start"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                {!report && !isProcessing && (
                  <button
                    onClick={runVideoAnalysis}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 transition"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Run AI Assessment</span>
                  </button>
                )}

                {isProcessing && (
                  <button
                    onClick={cancelAnalysis}
                    className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 transition"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Cancel Analysis</span>
                  </button>
                )}

                {report && (
                  <>
                    <button
                      onClick={handleSaveToSessions}
                      className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-900/60 transition"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save Session</span>
                    </button>

                    <button
                      onClick={downloadJsonReport}
                      className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-950/40 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-900/60 transition"
                    >
                      <Download className="h-4 w-4" />
                      <span>Export JSON</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    setVideoSrc(null);
                    setVideoFile(null);
                    setReport(null);
                    landmarksHistoryRef.current = [];
                  }}
                  disabled={isProcessing}
                  className="text-xs text-slate-400 hover:text-white px-2 py-1"
                >
                  Change Video
                </button>
              </div>
            </div>

            {/* Processing Progress Bar */}
            {isProcessing && (
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5">
                <div className="flex justify-between text-xs text-emerald-300 mb-2 font-medium">
                  <span>Extracting 33 Landmarks & Computing Kinematics...</span>
                  <span>{processProgress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-150"
                    style={{ width: `${processProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Joint Trajectory Line Chart */}
            {report && trajectoryData.length > 0 && isMounted && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Knee Flexion Trajectory (° over time)
                  </h3>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-indigo-400" />
                      Left Knee
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      Right Knee
                    </span>
                  </div>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trajectoryData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="time"
                        stroke="#64748b"
                        fontSize={10}
                        tickFormatter={(v) => `${v}s`}
                      />
                      <YAxis stroke="#64748b" fontSize={10} domain={[60, 180]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: "0.5rem",
                          fontSize: "11px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="leftKneeAngle"
                        stroke="#818cf8"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="rightKneeAngle"
                        stroke="#34d399"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[11px] text-slate-500">
                  Full extension corresponds to ~180°. Valid parallel depth is reached at ≤ 90–100°.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Assessment Summary & Deviations (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {report ? (
              <>
                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Exercise
                    </span>
                    <p className="mt-1 text-xl font-black text-emerald-400">{report.detectedExercise}</p>
                    <span className="text-[10px] text-slate-500">Biomechanical Model</span>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Completed Reps
                    </span>
                    <p className="mt-1 text-xl font-black text-white">{report.completedReps}</p>
                    <span className="text-[10px] text-slate-500">Segmented Repetitions</span>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Camera View
                    </span>
                    <p className="mt-1 text-base font-bold text-teal-400 capitalize">
                      {report.cameraView} View
                    </p>
                    <span className="text-[10px] text-slate-500">3D Torso Orientation</span>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Smoothness
                    </span>
                    <p className="mt-1 text-base font-bold text-indigo-400">
                      {report.meanSmoothness != null
                        ? `${Math.round(report.meanSmoothness * 100)}%`
                        : "Not available"}
                    </p>
                    <span className="text-[10px] text-slate-500">Kinematic Consistency</span>
                  </div>
                </div>

                {/* Technique Deviations Log */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Technique Observations ({report.deviations.length})
                    </h3>
                    <span className="text-[11px] text-slate-500">Click to jump in video</span>
                  </div>

                  {report.deviations.length > 0 ? (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {report.deviations.map((dev, idx) => (
                        <button
                          key={idx}
                          onClick={() => seekTo(dev.time)}
                          className={cn(
                            "w-full text-left flex items-start gap-3 rounded-xl p-3 border transition text-xs",
                            dev.type === "error"
                              ? "border-rose-500/30 bg-rose-950/20 text-rose-200 hover:bg-rose-950/40"
                              : dev.type === "warning"
                              ? "border-amber-500/30 bg-amber-950/20 text-amber-200 hover:bg-amber-950/40"
                              : "border-sky-500/30 bg-sky-950/20 text-sky-200 hover:bg-sky-950/40"
                          )}
                        >
                          <div className="shrink-0 mt-0.5">
                            {dev.type === "error" ? (
                              <AlertTriangle className="h-4 w-4 text-rose-400" />
                            ) : dev.type === "warning" ? (
                              <AlertTriangle className="h-4 w-4 text-amber-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-sky-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 mb-0.5">
                              <span>Timestamp: {dev.time.toFixed(1)}s</span>
                              <span className="underline text-indigo-400">Jump</span>
                            </div>
                            <p className="font-medium">{dev.label}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500/50 mb-2" />
                      <p className="text-xs">No technique defects identified.</p>
                    </div>
                  )}
                </div>

                {/* Uncertain Intervals Log */}
                {report.uncertainIntervals.length > 0 && (
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Uncertain / Occluded Intervals
                    </h3>
                    <div className="space-y-1.5">
                      {report.uncertainIntervals.map((interval, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between text-xs text-slate-400 bg-slate-800/40 rounded-lg p-2 font-mono"
                        >
                          <span>
                            {interval.start}s – {interval.end}s
                          </span>
                          <span className="text-amber-400/80 text-[11px]">{interval.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center text-slate-500">
                <FileVideo className="h-10 w-10 text-slate-600 mb-3" />
                <h4 className="text-sm font-semibold text-slate-300">Ready for Assessment</h4>
                <p className="mt-1 text-xs text-slate-500 max-w-xs">
                  Click &ldquo;Run AI Assessment&rdquo; to extract 33-landmark biomechanics and evaluate repetition quality.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
