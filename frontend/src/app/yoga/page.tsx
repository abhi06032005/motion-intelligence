"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Camera,
  CameraOff,
  Sparkles,
  Timer,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { getPoseLandmarker, NormalizedLandmark } from "@/lib/mediapipe";
import { SkeletonCanvas } from "@/components/SkeletonCanvas";
import { cn } from "@/lib/utils";
import { getWebSocketUrl } from "@/lib/config";

const YOGA_POSES = [
  { id: "mountain", name: "Mountain Pose (Tadasana)", guide: "Stand upright, feet hip-width, arms extended downwards." },
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

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string>(`yoga_${Math.random().toString(36).substring(2, 9)}`);

  const activePoseObj = YOGA_POSES.find((p) => p.id === selectedPose) || YOGA_POSES[0];

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
          initWebSocket();
          startLoop();
        };
      }
    } catch (err) {
      alert("Please enable camera access to start guided yoga assessment.");
    }
  };

  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsCameraActive(false);
    setCurrentLandmarks(null);
  }, []);

  const initWebSocket = () => {
    const wsUrl = getWebSocketUrl("ws/yoga", clientIdRef.current);
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.hold_duration !== undefined) {
          setHoldSeconds(Math.round(data.hold_duration));
          setInPose(data.is_in_pose ?? false);
          setViolations(data.deviations || []);
        }
      } catch (err) {}
    };

    wsRef.current = ws;
  };

  const startLoop = async () => {
    const landmarker = await getPoseLandmarker();
    let lastTime = -1;

    const loop = () => {
      if (!videoRef.current || videoRef.current.paused) {
        animationFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const video = videoRef.current;
      if (video.currentTime !== lastTime && video.readyState >= 2) {
        lastTime = video.currentTime;
        const result = landmarker.detectForVideo(video, performance.now());

        if (result.landmarks && result.landmarks.length > 0) {
          const lms = result.landmarks[0] as NormalizedLandmark[];
          setCurrentLandmarks(lms);

          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                pose_id: selectedPose,
                landmarks: lms,
                timestamp: Date.now() / 1000.0,
              })
            );
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Sparkles className="h-6 w-6 text-indigo-400" />
            Guided Yoga Posture Assessment
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time static held-pose tracking across 8 standardized asanas with monotonic hold timer.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!isCameraActive ? (
            <button
              onClick={startCamera}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-400 transition-colors"
            >
              <Camera className="h-4 w-4" /> Start Yoga
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
            >
              <CameraOff className="h-4 w-4" /> Stop
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Video & Canvas (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
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
              <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center">
                <Sparkles className="h-10 w-10 text-indigo-400/60 mb-4" />
                <h3 className="text-base font-semibold text-white">Select a Pose and Launch Camera</h3>
                <p className="mt-2 max-w-sm text-xs text-slate-400">
                  Select your desired pose from the right panel. The timer starts automatically once posture criteria are met.
                </p>
                <button
                  onClick={startCamera}
                  className="mt-6 rounded-lg bg-indigo-500 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-400"
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
                    "rounded-full px-3 py-1 text-xs font-bold backdrop-blur border",
                    inPose
                      ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                      : "bg-amber-950/80 text-amber-300 border-amber-500/40"
                  )}
                >
                  {inPose ? "Holding Target Posture" : "Adjusting Alignment..."}
                </span>

                <span className="flex items-center gap-1.5 rounded-full bg-slate-950/80 backdrop-blur px-3 py-1 text-xs font-bold text-white border border-slate-800">
                  <Timer className="h-3.5 w-3.5 text-indigo-400" />
                  Hold: {holdSeconds}s
                </span>
              </div>
            )}
          </div>

          {/* Positioning Guide */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Alignment Guidance: {activePoseObj.name}
            </h4>
            <p className="text-xs text-slate-300">{activePoseObj.guide}</p>
          </div>
        </div>

        {/* Right: Pose Selector & Deviations (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Select Yoga Asana
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {YOGA_POSES.map((pose) => (
                <button
                  key={pose.id}
                  onClick={() => setSelectedPose(pose.id)}
                  className={cn(
                    "flex items-center justify-between rounded-lg p-2.5 text-xs text-left transition-colors border",
                    selectedPose === pose.id
                      ? "border-indigo-500/40 bg-indigo-950/40 font-semibold text-indigo-300"
                      : "border-slate-800 bg-slate-950/40 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  )}
                >
                  <span>{pose.name}</span>
                  {selectedPose === pose.id && <Sparkles className="h-3.5 w-3.5 text-indigo-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Observed Deviations */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Observed Pose Deviations
            </h3>
            {violations.length > 0 ? (
              <ul className="space-y-2">
                {violations.map((v, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-950/20 p-2 text-xs text-amber-300"
                  >
                    <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">
                No major joint deviations detected. Maintain steady breathing.
              </p>
            )}
          </div>

          {/* Safety Alert */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 flex items-start gap-2.5 text-xs text-slate-400">
            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Maintaining an approximate pose on camera does not equate to clinical anatomical alignment. Avoid forcing ranges of motion that cause discomfort.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
