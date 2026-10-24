"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  CameraOff,
  Sparkles,
  Timer,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { getPoseLandmarker, NormalizedLandmark } from "@/lib/mediapipe";
import { SkeletonCanvas } from "@/components/SkeletonCanvas";
import { DashboardShell } from "@/components/DashboardShell";
import { cn } from "@/lib/utils";
import { getWebSocketUrl } from "@/lib/config";
import { saveSession } from "@/lib/sessionStorage";

const YOGA_POSES = [
  { id: "mountain", name: "Mountain Pose (Tadasana)", guide: "Stand upright, feet hip-width, arms extended downwards alongside body." },
  { id: "tree", name: "Tree Pose (Vrksasana)", guide: "Balance on one leg, place opposite foot against inner thigh or calf." },
  { id: "warrior_i", name: "Warrior I (Virabhadrasana I)", guide: "Front knee bent at 90°, back leg straight, arms reached overhead." },
  { id: "warrior_ii", name: "Warrior II (Virabhadrasana II)", guide: "Arms parallel to ground, front knee tracking over ankle, gaze forward." },
  { id: "chair", name: "Chair Pose (Utkatasana)", guide: "Hips descended as if sitting in an imaginary chair, arms raised." },
  { id: "triangle", name: "Triangle Pose (Trikonasana)", guide: "Legs wide, torso tilted sideways toward front foot, top arm vertical." },
  { id: "downward_dog", name: "Downward Dog (Adho Mukha Svanasana)", guide: "Hands and feet on ground, hips lifted into an inverted V." },
  { id: "cobra", name: "Cobra Pose (Bhujangasana)", guide: "Prone position on floor, chest lifted gently with arms slightly bent." },
];

export default function YogaPage() {
  const [selectedPose, setSelectedPose] = useState("mountain");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [holdSeconds, setHoldSeconds] = useState(0);
  const [inPose, setInPose] = useState(false);
  const [violations, setViolations] = useState<string[]>([]);
  const [currentLandmarks, setCurrentLandmarks] = useState<NormalizedLandmark[] | null>(null);
  const [savedNotification, setSavedNotification] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string>(`yoga_${Math.random().toString(36).substring(2, 9)}`);

  // Concurrency & state synchronization refs
  const startAttemptIdRef = useRef<number>(0);
  const isLoopRunningRef = useRef<boolean>(false);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const selectedPoseRef = useRef<string>("mountain");
  const maxHoldRef = useRef<number>(0);
  const violationsRef = useRef<string[]>([]);
  const sessionSavedRef = useRef<boolean>(false);

  // Keep refs synchronized
  useEffect(() => {
    selectedPoseRef.current = selectedPose;
  }, [selectedPose]);

  useEffect(() => {
    violationsRef.current = violations;
  }, [violations]);

  const activePoseObj = YOGA_POSES.find((p) => p.id === selectedPose) || YOGA_POSES[0];

  const initWebSocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;

    const wsUrl = getWebSocketUrl("ws/yoga", clientIdRef.current);
    try {
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.hold_seconds !== undefined) {
            const secs = Math.round(data.hold_seconds);
            setHoldSeconds(secs);
            if (secs > maxHoldRef.current) {
              maxHoldRef.current = secs;
            }
            setInPose(data.is_in_pose ?? false);
            setViolations(data.violations || []);
          }
        } catch (err) {}
      };

      wsRef.current = ws;
    } catch {}
  }, []);

  // Stable hardware cleanup with ZERO dynamic dependencies
  const cleanupHardwareStream = useCallback(() => {
    startAttemptIdRef.current++;

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    isLoopRunningRef.current = false;

    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      activeStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }

    setIsCameraActive(false);
    setCurrentLandmarks(null);
  }, []);

  // Persist session if held for at least 5s
  const persistSessionOnStop = useCallback(() => {
    if (sessionSavedRef.current) return;

    const hold = maxHoldRef.current;
    if (hold >= 5) {
      sessionSavedRef.current = true;
      const currentPoseId = selectedPoseRef.current;
      const poseItem = YOGA_POSES.find((p) => p.id === currentPoseId) || YOGA_POSES[0];
      const poseName = poseItem.name.split(" (")[0];

      saveSession({
        exercise: `Yoga: ${poseName}`,
        reps: 1,
        validReps: 1,
        smoothness: null,
        symmetry: null,
        cameraView: "Frontal",
        violations: violationsRef.current,
        durationSeconds: hold,
        source: "live",
      });

      setSavedNotification(`Yoga session saved: held ${poseName} for ${hold}s.`);
      setTimeout(() => setSavedNotification(null), 4000);
    }
  }, []);

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

  const handleStartCamera = async () => {
    const attemptId = ++startAttemptIdRef.current;
    cleanupHardwareStream();
    startAttemptIdRef.current = attemptId;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });

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
            maxHoldRef.current = 0;
            sessionSavedRef.current = false;
            initWebSocket();
            startLoop(attemptId);
          } catch (playErr) {
            console.error("Video play error:", playErr);
          }
        };
      }
    } catch (err) {
      alert("Please enable camera access in your browser to start guided yoga assessment.");
    }
  };

  const startLoop = async (attemptId: number) => {
    if (isLoopRunningRef.current) return;
    isLoopRunningRef.current = true;

    let landmarker;
    try {
      landmarker = await getPoseLandmarker();
    } catch (err) {
      console.error("Landmarker failed to load:", err);
      isLoopRunningRef.current = false;
      return;
    }

    if (startAttemptIdRef.current !== attemptId) {
      isLoopRunningRef.current = false;
      return;
    }

    let lastTime = -1;

    const loop = () => {
      if (startAttemptIdRef.current !== attemptId) {
        isLoopRunningRef.current = false;
        return;
      }

      if (!videoRef.current || videoRef.current.paused) {
        animationFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const video = videoRef.current;
      if (video.currentTime !== lastTime && video.readyState >= 2) {
        lastTime = video.currentTime;
        try {
          const result = landmarker.detectForVideo(video, performance.now());

          if (result.landmarks && result.landmarks.length > 0) {
            const lms = result.landmarks[0] as NormalizedLandmark[];
            setCurrentLandmarks(lms);

            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(
                JSON.stringify({
                  pose: selectedPoseRef.current,
                  landmarks: lms,
                  timestamp: Date.now() / 1000.0,
                })
              );
            }
          }
        } catch (inferErr) {
          console.warn("Yoga inference error:", inferErr);
        }
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
  };

  // Changing pose does NOT restart or close the camera
  const handleSelectPose = (poseId: string) => {
    setSelectedPose(poseId);
    setHoldSeconds(0);
    setInPose(false);
    setViolations([]);
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-[#F0F1F3]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202226] tracking-tight flex items-center gap-2.5">
              <Sparkles className="h-6 w-6 text-[#202226]" />
              Guided Yoga Assessment
            </h1>
            <p className="text-xs sm:text-sm text-[#8E9399] mt-0.5">
              Real-time held-pose tracking across 8 standardized asanas with monotonic hold duration verification
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {!isCameraActive ? (
              <button
                onClick={handleStartCamera}
                className="flex items-center gap-2 rounded-full bg-[#202226] hover:bg-black px-5 py-2 text-xs font-semibold text-white shadow-xs transition-colors"
              >
                <Camera className="h-4 w-4" /> Start Yoga
              </button>
            ) : (
              <button
                onClick={handleStopCamera}
                className="flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors shadow-2xs"
              >
                <CameraOff className="h-4 w-4" /> Stop
              </button>
            )}
          </div>
        </div>

        {savedNotification && (
          <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-[#EAF7F5] p-3.5 text-xs text-emerald-900 shadow-2xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{savedNotification}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Video & Canvas (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[26px] border border-[#E9EBED] bg-[#202223] shadow-xs">
              <video
                ref={videoRef}
                playsInline
                muted
                className={cn("h-full w-full object-cover", !isCameraActive && "hidden")}
              />

              {isCameraActive && (
                <SkeletonCanvas
                  landmarks={currentLandmarks}
                  width={640}
                  height={480}
                  isRepValid={inPose}
                />
              )}

              {!isCameraActive && (
                <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center bg-[#F0F1F3]">
                  <div className="rounded-full bg-white p-5 mb-4 border border-[#E9EBED] shadow-xs">
                    <Sparkles className="h-8 w-8 text-[#202226]" />
                  </div>
                  <h3 className="text-base font-bold text-[#202226]">Select a Pose and Launch Camera</h3>
                  <p className="mt-1.5 max-w-sm text-xs text-[#8E9399] leading-relaxed">
                    Select your desired posture from the right panel. The timer activates automatically once your joint alignment satisfies posture criteria.
                  </p>
                  <button
                    onClick={handleStartCamera}
                    className="mt-5 rounded-full bg-[#202226] hover:bg-black px-6 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors"
                  >
                    Enable Camera
                  </button>
                </div>
              )}

              {/* In-Pose Status Banner */}
              {isCameraActive && (
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                  <span
                    className={cn(
                      "rounded-full px-3.5 py-1 text-xs font-bold backdrop-blur-xs border shadow-xs",
                      inPose
                        ? "bg-[#D9F0EC]/95 text-[#202226] border-[#CEECE7]"
                        : "bg-amber-100/95 text-amber-900 border-amber-200"
                    )}
                  >
                    {inPose ? "Holding Target Posture" : "Adjusting Alignment..."}
                  </span>

                  <span className="flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-xs px-3.5 py-1 text-xs font-bold text-[#202226] border border-white/60 shadow-xs">
                    <Timer className="h-3.5 w-3.5 text-[#202226]" />
                    Hold: {holdSeconds}s
                  </span>
                </div>
              )}
            </div>

            {/* Positioning Guide */}
            <div className="rounded-[24px] border border-[#E9EBED] bg-white p-4 shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#8E9399] mb-1">
                Alignment Guidance: {activePoseObj.name}
              </h4>
              <p className="text-xs text-[#202226]">{activePoseObj.guide}</p>
            </div>
          </div>

          {/* Right: Pose Selector & Deviations (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="rounded-[26px] border border-[#E9EBED] bg-white p-5 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E9399] mb-3">
                Select Yoga Asana
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {YOGA_POSES.map((pose) => (
                  <button
                    key={pose.id}
                    onClick={() => handleSelectPose(pose.id)}
                    className={cn(
                      "flex items-center justify-between rounded-xl p-2.5 text-xs text-left transition-all border",
                      selectedPose === pose.id
                        ? "border-[#E9EBED] bg-[#EDE2F2] font-bold text-[#202226] shadow-2xs"
                        : "border-transparent bg-white text-[#8E9399] hover:bg-[#F0F1F3] hover:text-[#202226]"
                    )}
                  >
                    <span>{pose.name}</span>
                    {selectedPose === pose.id && <Sparkles className="h-3.5 w-3.5 text-[#202226]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Observed Deviations */}
            <div className="rounded-[26px] border border-[#E9EBED] bg-white p-5 shadow-2xs flex-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E9399] mb-3">
                Observed Pose Feedback
              </h3>
              {violations.length > 0 ? (
                <ul className="space-y-2">
                  {violations.map((v, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900"
                    >
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-[#8E9399] text-center py-6">
                  {inPose
                    ? "Postural alignment satisfied. Maintain steady posture and breathing."
                    : "Step into view to align your posture with the guideline."}
                </p>
              )}
            </div>

            {/* Safety Notice */}
            <div className="rounded-[22px] border border-[#E9EBED] bg-[#F0F1F3] p-3.5 flex items-start gap-2.5 text-xs text-[#8E9399]">
              <ShieldAlert className="h-4 w-4 text-[#8E9399] shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Camera pose estimation provides qualitative geometry feedback. Avoid forcing ranges of motion that cause discomfort or pain.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
