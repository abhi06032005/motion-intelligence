"use client";

import { useEffect, useRef } from "react";
import { NormalizedLandmark } from "@/lib/mediapipe";
import { cn } from "@/lib/utils";

interface SkeletonCanvasProps {
  landmarks: NormalizedLandmark[] | null;
  width: number;
  height: number;
  jointColors?: Record<string, string>;
  isRepValid?: boolean;
  className?: string;
}

const POSE_CONNECTIONS = [
  // Torso
  [11, 12],
  [11, 23],
  [12, 24],
  [23, 24],
  // Left arm
  [11, 13],
  [13, 15],
  // Right arm
  [12, 14],
  [14, 16],
  // Left leg
  [23, 25],
  [25, 27],
  // Right leg
  [24, 26],
  [26, 28],
  // Feet
  [27, 29],
  [29, 31],
  [28, 30],
  [30, 32],
];

export function SkeletonCanvas({
  landmarks,
  width,
  height,
  jointColors = {},
  isRepValid = true,
  className,
}: SkeletonCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    if (!landmarks || landmarks.length < 33) return;

    // Draw connection lines
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";

    for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];

      const v1 = p1.visibility ?? 1.0;
      const v2 = p2.visibility ?? 1.0;

      if (v1 < 0.35 || v2 < 0.35) continue;

      ctx.beginPath();
      ctx.moveTo(p1.x * width, p1.y * height);
      ctx.lineTo(p2.x * width, p2.y * height);

      // Color based on validity
      if (!isRepValid) {
        ctx.strokeStyle = "rgba(239, 68, 68, 0.75)"; // Red
      } else {
        ctx.strokeStyle = "rgba(16, 185, 129, 0.75)"; // Emerald green
      }
      ctx.stroke();
    }

    // Draw landmark joints
    for (let i = 0; i < landmarks.length; i++) {
      // Skip face points except nose (0) for clean display
      if (i > 0 && i < 11) continue;

      const p = landmarks[i];
      const vis = p.visibility ?? 1.0;
      if (vis < 0.35) continue;

      const cx = p.x * width;
      const cy = p.y * height;

      ctx.beginPath();
      ctx.arc(cx, cy, 5.0, 0, 2 * Math.PI);

      // Highlight joint if listed in jointColors
      const colorOverride = jointColors[String(i)] || (isRepValid ? "#10b981" : "#ef4444");
      ctx.fillStyle = colorOverride;
      ctx.fill();

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
    }
  }, [landmarks, width, height, jointColors, isRepValid]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={cn("pointer-events-none absolute left-0 top-0 h-full w-full", className)}
    />
  );
}
