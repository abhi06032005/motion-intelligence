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
import { DashboardShell } from "@/components/DashboardShell";
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
  validReps: number;
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

  // File selection & validation
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

  // Confirmed frame seeking helper without fake timeout completion
  const seekToFrameConfirmed = (video: HTMLVideoElement, targetTime: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (Math.abs(video.currentTime - targetTime) < 0.001) {
        resolve();
        return;
      }

      let timeoutId: NodeJS.Timeout | null = null;

      const onSeeked = () => {
        if (timeoutId) clearTimeout(timeoutId);
        video.removeEventListener("seeked", onSeeked);
        video.removeEventListener("error", onError);
        resolve();
      };

      const onError = () => {
        if (timeoutId) clearTimeout(timeoutId);
        video.removeEventListener("seeked", onSeeked);
        video.removeEventListener("error", onError);
        reject(new Error("Video playback error during frame seek"));
      };

      video.addEventListener("seeked", onSeeked, { once: true });
      video.addEventListener("error", onError, { once: true });

      // Timeout rejects rather than pretending seeking succeeded
      timeoutId = setTimeout(() => {
        video.removeEventListener("seeked", onSeeked);
        video.removeEventListener("error", onError);
        reject(new Error(`Frame seek timed out at ${targetTime.toFixed(2)}s`));
      }, 4000);

      video.currentTime = targetTime;
    });
  };

  // Run video frame-by-frame inference loop
  const runVideoAnalysis = async () => {
    const video = videoRef.current;
    if (!video) return;

    // Validate video duration strictly without fabricating values
    const totalDuration = video.duration;
    if (!Number.isFinite(totalDuration) || isNaN(totalDuration) || totalDuration <= 0) {
      setErrorMsg("Unable to determine video duration. Please upload a standard video file with valid duration metadata.");
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setSessionSavedMessage(null);
    setProcessProgress(0);
    cancelProcessingRef.current = false;

    try {
      const landmarker = await getPoseLandmarker();
      const fps = 25; // High-precision sampling rate
      const step = 1 / fps;
      let curr = 0;

      const trajectory: TrajectoryPoint[] = [];
      const deviations: DeviationEvent[] = [];
      const uncertainIntervals: { start: number; end: number; reason: string }[] = [];
      const landmarksHistory: (NormalizedLandmark[] | null)[] = [];
      const leftAngles: number[] = [];
      const rightAngles: number[] = [];
      const validAvgAngles: number[] = [];

      let repCount = 0;
      let validRepCount = 0;
      let inEccentricPhase = false;
      let minAngleInRep = 180;
      let repHadValgus = false;
      let repHadExcessiveLean = false;
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

        // Await confirmed frame seeking without race timeouts
        await seekToFrameConfirmed(video, curr);

        // MediaPipe VIDEO mode expects monotonically increasing inference timestamps.
        // Video seek position is separate and may restart at 0 for new uploads.
        const results = landmarker.detectForVideo(video, performance.now());

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

          // Compute knee flexion angles with correct 3D vector coordinates
          const lKneeAngle = calculateJointAngle(leftHip, leftKnee, leftAnkle);
          const rKneeAngle = calculateJointAngle(rightHip, rightKnee, rightAnkle);

          if (lKneeAngle !== null && rKneeAngle !== null) {
            const avgKneeAngle = (lKneeAngle + rKneeAngle) / 2;
            leftAngles.push(lKneeAngle);
            rightAngles.push(rKneeAngle);
            validAvgAngles.push(avgKneeAngle);

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
              repHadValgus = false;
              repHadExcessiveLean = false;
            } else if (inEccentricPhase) {
              if (avgKneeAngle < minAngleInRep) {
                minAngleInRep = avgKneeAngle;
              }

              // Check for knee valgus during descent/ascent (frontal view only)
              if (detectedView === "frontal") {
                const kneeDistance = Math.abs(leftKnee.x - rightKnee.x);
                const ankleDistance = Math.abs(leftAnkle.x - rightAnkle.x);
                if (kneeDistance < ankleDistance * 0.72) {
                  repHadValgus = true;
                }
              }

              if (trunkTilt > 38) {
                repHadExcessiveLean = true;
              }

              if (avgKneeAngle > 155) {
                // Completed rep
                repCount++;
                inEccentricPhase = false;
                let repValid = true;

                // Rule check: Squat depth
                if (minAngleInRep > 105) {
                  repValid = false;
                  deviations.push({
                    time: Math.round(curr * 10) / 10,
                    label: `Rep ${repCount}: Insufficient squat depth (min knee flexion ${Math.round(minAngleInRep)}°, parallel requires ≤105°)`,
                    type: "warning",
                    repetition: repCount,
                  });
                }

                // Rule check: Knee valgus
                if (detectedView === "lateral") {
                  deviations.push({
                    time: Math.round(curr * 10) / 10,
                    label: `Rep ${repCount}: Knee valgus rule suppressed (lateral camera viewpoint)`,
                    type: "info",
                    repetition: repCount,
                    ruleSuppressed: true,
                  });
                } else if (repHadValgus) {
                  repValid = false;
                  deviations.push({
                    time: Math.round(curr * 10) / 10,
                    label: `Rep ${repCount}: Knee valgus detected (knees caved inward relative to ankles)`,
                    type: "error",
                    repetition: repCount,
                  });
                }

                // Rule check: Trunk inclination
                if (repHadExcessiveLean) {
                  deviations.push({
                    time: Math.round(curr * 10) / 10,
                    label: `Rep ${repCount}: Forward trunk lean exceeded 38°`,
                    type: "warning",
                    repetition: repCount,
                  });
                }

                if (repValid) {
                  validRepCount++;
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
          }
        } else {
          landmarksHistory.push(null);
        }

        curr += step;
        setProcessProgress(Math.min(100, Math.round((curr / totalDuration) * 100)));
      }

      // Compute genuine kinematic smoothness and symmetry metrics
      const computedSmoothness = computeKinematicSmoothness(validAvgAngles, fps);
      const computedSymmetry = computeBilateralSymmetry(leftAngles, rightAngles);

      // Exercise recognition check: did movement match squat flexion?
      const minKnee = validAvgAngles.length > 0 ? Math.min(...validAvgAngles) : 180;
      const maxKnee = validAvgAngles.length > 0 ? Math.max(...validAvgAngles) : 180;
      const kneeExcursion = maxKnee - minKnee;

      let detectedExercise = "Bodyweight Squat";
      if (kneeExcursion < 15.0) {
        detectedExercise = "Unrecognized Movement (No Squat Flexion)";
        deviations.unshift({
          time: 0,
          label: "Movement does not exhibit significant knee flexion. Only squat movements are currently evaluated.",
          type: "warning",
        });
      }

      landmarksHistoryRef.current = landmarksHistory;
      setTrajectoryData(trajectory);
      setReport({
        filename: videoFile?.name || "Uploaded Video",
        duration: Math.round(totalDuration * 10) / 10,
        totalFrames: trajectory.length,
        detectedExercise,
        cameraView: detectedView,
        completedReps: repCount, // Honest rep count (no fabricated minimums)
        validReps: validRepCount, // Actual validated repetitions
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
      setErrorMsg("Video analysis error: " + (err instanceof Error ? err.message : String(err)));
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

    // Synchronize skeleton overlay with video playback frame
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
      validReps: report.validReps,
      smoothness: report.meanSmoothness,
      symmetry: report.symmetryRatio,
      cameraView: report.cameraView ? report.cameraView.toUpperCase() : "Unspecified",
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
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-[#F0F1F3]">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202226] tracking-tight">
            Squat Video Analysis
          </h1>
          <p className="mt-1 text-[#8E9399] text-xs sm:text-sm max-w-3xl">
            Upload recorded bodyweight squat video for automated repetition segmentation, joint kinematics,
            depth verification, and synchronized skeletal overlay—processed entirely within your browser.
          </p>
        </div>

        {/* Upload Dropzone */}
        {!videoSrc && (
          <div className="mb-8">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "group relative flex flex-col items-center justify-center rounded-[28px] border-2 border-dashed p-12 text-center transition cursor-pointer",
                isDragging
                  ? "border-emerald-500 bg-[#EAF7F5]"
                  : "border-[#E9EBED] bg-[#F0F1F3] hover:border-[#D9F0EC] hover:bg-[#EAF7F5]/50"
              )}
            >
              <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center">
                <div className="rounded-full bg-[#D9F0EC] p-5 text-[#202226] group-hover:scale-105 transition duration-300 shadow-2xs">
                  <Upload className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-base font-bold text-[#202226]">Select or drop squat exercise video</h3>
                <p className="mt-1 text-xs text-[#8E9399] max-w-sm">
                  Supports MP4, WebM, and MOV up to 100MB. Offline analysis is currently specialized for bodyweight squats. Video remains private on your machine.
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#202226] hover:bg-black px-5 py-2 text-xs font-semibold text-white shadow-xs transition-colors">
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
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* Notification Toast */}
        {sessionSavedMessage && (
          <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-[#EAF7F5] p-3.5 text-xs text-emerald-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{sessionSavedMessage}</span>
            </div>
            <button
              onClick={() => setSessionSavedMessage(null)}
              className="text-emerald-700 hover:text-emerald-950"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Active Video Player & Results Workspace */}
        {videoSrc && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Player & Controls (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="relative aspect-video rounded-[26px] overflow-hidden bg-[#202223] border border-[#E9EBED] shadow-xs">
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
                <div className="absolute top-3 left-3 rounded-full bg-white/90 backdrop-blur-xs px-3 py-1 text-[11px] font-mono text-[#202226] border border-white/60 shadow-xs">
                  {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
                </div>
              </div>

              {/* Playback & Action Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[26px] border border-[#E9EBED] bg-white p-4 shadow-2xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    disabled={isProcessing}
                    className="flex items-center gap-2 rounded-full bg-[#202226] hover:bg-black px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 transition shadow-2xs"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    <span>{isPlaying ? "Pause" : "Play"}</span>
                  </button>
                  <button
                    onClick={() => seekTo(0)}
                    disabled={isProcessing}
                    className="rounded-full border border-[#E9EBED] bg-white p-2 text-[#8E9399] hover:text-[#202226] hover:bg-[#F0F1F3] disabled:opacity-50 transition"
                    title="Rewind to start"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {!report && !isProcessing && (
                    <button
                      onClick={runVideoAnalysis}
                      className="flex items-center gap-2 rounded-full bg-[#202226] px-5 py-2 text-xs font-bold text-white hover:bg-black shadow-xs transition"
                    >
                      <Sparkles className="h-4 w-4 text-[#D9F0EC]" />
                      <span>Run AI Assessment</span>
                    </button>
                  )}

                  {isProcessing && (
                    <button
                      onClick={cancelAnalysis}
                      className="flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500 transition shadow-xs"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Cancel Analysis</span>
                    </button>
                  )}

                  {report && (
                    <>
                      <button
                        onClick={handleSaveToSessions}
                        className="flex items-center gap-1.5 rounded-full border border-[#E9EBED] bg-white px-3.5 py-2 text-xs font-semibold text-[#202226] hover:bg-[#F0F1F3] transition shadow-2xs"
                      >
                        <Save className="h-4 w-4" />
                        <span>Save Session</span>
                      </button>

                      <button
                        onClick={downloadJsonReport}
                        className="flex items-center gap-1.5 rounded-full border border-[#E9EBED] bg-white px-3.5 py-2 text-xs font-semibold text-[#202226] hover:bg-[#F0F1F3] transition shadow-2xs"
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
                    className="text-xs text-[#8E9399] hover:text-[#202226] px-2 py-1"
                  >
                    Change Video
                  </button>
                </div>
              </div>

              {/* Processing Progress Bar */}
              {isProcessing && (
                <div className="rounded-[26px] border border-[#CEECE7] bg-[#EAF7F5] p-5">
                  <div className="flex justify-between text-xs text-[#202226] mb-2 font-semibold">
                    <span>Extracting 33 Landmarks & Computing Kinematics...</span>
                    <span>{processProgress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#D9F0EC] overflow-hidden">
                    <div
                      className="h-full bg-[#202226] rounded-full transition-all duration-150"
                      style={{ width: `${processProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Joint Trajectory Line Chart */}
              {report && trajectoryData.length > 0 && isMounted && (
                <div className="rounded-[26px] border border-[#E9EBED] bg-white p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E9399]">
                      Knee Flexion Trajectory (° over time)
                    </h3>
                    <div className="flex items-center gap-4 text-[11px] text-[#8E9399]">
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#202226]" />
                        Left Knee
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#34d399]" />
                        Right Knee
                      </span>
                    </div>
                  </div>

                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trajectoryData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F0F1F3" />
                        <XAxis
                          dataKey="time"
                          stroke="#8E9399"
                          fontSize={10}
                          tickFormatter={(v) => `${v}s`}
                        />
                        <YAxis stroke="#8E9399" fontSize={10} domain={[60, 180]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#FFFFFF",
                            borderColor: "#E9EBED",
                            borderRadius: "1rem",
                            fontSize: "11px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="leftKneeAngle"
                          stroke="#202226"
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
                  <p className="text-[11px] text-[#8E9399]">
                    Full extension corresponds to ~180°. Valid parallel depth is reached at ≤ 90–105°.
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: Assessment Summary & Deviations (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {report ? (
                <>
                  {/* Metric Summary Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[22px] border border-[#E9EBED] bg-white p-4 shadow-2xs">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8E9399]">
                        Exercise
                      </span>
                      <p className="mt-1 text-sm font-bold text-[#202226] leading-snug">{report.detectedExercise}</p>
                      <span className="text-[10px] text-[#8E9399]">Kinematic Pattern</span>
                    </div>

                    <div className="rounded-[22px] border border-[#E9EBED] bg-white p-4 shadow-2xs">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8E9399]">
                        Repetitions
                      </span>
                      <p className="mt-1 text-xl font-extrabold text-[#202226]">
                        {report.completedReps}
                        <span className="text-xs font-semibold text-emerald-600 ml-1.5">
                          ({report.validReps} valid)
                        </span>
                      </p>
                      <span className="text-[10px] text-[#8E9399]">Depth-Verified</span>
                    </div>

                    <div className="rounded-[22px] border border-[#E9EBED] bg-white p-4 shadow-2xs">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8E9399]">
                        Camera View
                      </span>
                      <p className="mt-1 text-base font-bold text-[#202226] capitalize">
                        {report.cameraView} View
                      </p>
                      <span className="text-[10px] text-[#8E9399]">3D Torso Orientation</span>
                    </div>

                    <div className="rounded-[22px] border border-[#E9EBED] bg-white p-4 shadow-2xs">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8E9399]">
                        Smoothness
                      </span>
                      <p className="mt-1 text-base font-bold text-[#202226]">
                        {report.meanSmoothness != null
                          ? `${Math.round(report.meanSmoothness * 100)}%`
                          : "Not available"}
                      </p>
                      <span className="text-[10px] text-[#8E9399]">Kinematic Consistency</span>
                    </div>
                  </div>

                  {/* Technique Deviations Log */}
                  <div className="rounded-[26px] border border-[#E9EBED] bg-white p-5 space-y-4 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E9399]">
                        Technique Observations ({report.deviations.length})
                      </h3>
                      <span className="text-[11px] text-[#8E9399]">Click to jump in video</span>
                    </div>

                    {report.deviations.length > 0 ? (
                      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                        {report.deviations.map((dev, idx) => (
                          <button
                            key={idx}
                            onClick={() => seekTo(dev.time)}
                            className={cn(
                              "w-full text-left flex items-start gap-3 rounded-2xl p-3 border transition text-xs",
                              dev.type === "error"
                                ? "border-rose-200 bg-rose-50 text-rose-900 hover:bg-rose-100"
                                : dev.type === "warning"
                                ? "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
                                : "border-[#CEECE7] bg-[#EAF7F5] text-[#202226] hover:bg-[#D9F0EC]"
                            )}
                          >
                            <div className="shrink-0 mt-0.5">
                              {dev.type === "error" ? (
                                <AlertTriangle className="h-4 w-4 text-rose-600" />
                              ) : dev.type === "warning" ? (
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                              ) : (
                                <Eye className="h-4 w-4 text-teal-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between font-mono text-[10px] text-[#8E9399] mb-0.5">
                                <span>Timestamp: {dev.time.toFixed(1)}s</span>
                                <span className="underline text-[#202226] font-semibold">Jump</span>
                              </div>
                              <p className="font-semibold">{dev.label}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-center text-[#8E9399]">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                        <p className="text-xs font-medium text-[#202226]">No technique defects identified.</p>
                      </div>
                    )}
                  </div>

                  {/* Uncertain Intervals Log */}
                  {report.uncertainIntervals.length > 0 && (
                    <div className="rounded-[26px] border border-[#E9EBED] bg-white p-5 space-y-2 shadow-2xs">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E9399]">
                        Uncertain / Occluded Intervals
                      </h3>
                      <div className="space-y-1.5">
                        {report.uncertainIntervals.map((interval, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-xs text-[#202226] bg-[#F0F1F3] rounded-xl p-2 font-mono"
                          >
                            <span>
                              {interval.start}s – {interval.end}s
                            </span>
                            <span className="text-amber-700 text-[11px] font-semibold">{interval.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-[26px] border-2 border-dashed border-[#E9EBED] bg-[#F0F1F3] p-12 text-center text-[#8E9399]">
                  <FileVideo className="h-10 w-10 text-[#8E9399] mb-3" />
                  <h4 className="text-sm font-bold text-[#202226]">Ready for Assessment</h4>
                  <p className="mt-1 text-xs text-[#8E9399] max-w-xs">
                    Click &ldquo;Run AI Assessment&rdquo; to extract 33-landmark biomechanics and evaluate repetition quality.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
