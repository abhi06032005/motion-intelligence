"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Camera, ChevronRight, User, Plus, ArrowUpRight, Zap, Check } from "lucide-react";

interface RightContextualPanelProps {
  totalSessions?: number;
  totalMovements?: number;
}

export function RightContextualPanel({
  totalSessions = 0,
  totalMovements = 0,
}: RightContextualPanelProps) {
  const [exercisesState, setExercisesState] = useState({
    squat: true,
    pushup: true,
    curl: true,
    yoga: true,
  });

  const toggleExercise = (key: keyof typeof exercisesState) => {
    setExercisesState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {/* 1. TOP CARD: Live Pose Preview with Viewfinder Brackets */}
      <div className="bg-white rounded-[26px] border border-[#E9EBED] p-4 shadow-2xs relative flex flex-col items-center text-center">
        {/* Viewfinder brackets in four corners */}
        <div className="w-full flex justify-between items-start mb-2">
          <div className="w-3.5 h-3.5 border-t-2 border-l-2 border-[#202226] rounded-tl-sm" />
          <button
            title="Open camera"
            className="p-1 rounded-full bg-[#F0F1F3] text-[#202226] hover:bg-[#D9F0EC] transition-colors"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
          <div className="w-3.5 h-3.5 border-t-2 border-r-2 border-[#202226] rounded-tr-sm" />
        </div>

        {/* Center: Stylized Human Silhouette in Mint Glow */}
        <div className="relative my-2">
          <div className="h-28 w-28 rounded-full bg-[#EAF7F5] border border-[#D9F0EC] flex items-center justify-center relative overflow-hidden">
            {/* Subtle biomechanical concentric halo */}
            <div className="absolute inset-2 rounded-full border border-dashed border-[#8E9399]/30" />
            
            {/* Minimal Human Head & Shoulder Wireframe Graphic */}
            <svg
              viewBox="0 0 100 100"
              className="h-20 w-20 text-[#202226] drop-shadow-xs"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              {/* Head Circle */}
              <circle cx="50" cy="35" r="14" stroke="#202226" fill="#FFFFFF" />
              {/* Eye / Gaze Line */}
              <line x1="43" y1="35" x2="57" y2="35" stroke="#202226" strokeWidth="2" />
              {/* Neck & Trapezius */}
              <path d="M50 49 L50 56" stroke="#202226" />
              <path d="M26 80 C32 62, 40 56, 50 56 C60 56, 68 62, 74 80" stroke="#202226" />
              {/* Joint markers */}
              <circle cx="32" cy="72" r="3" fill="#D9F0EC" stroke="#202226" strokeWidth="1.5" />
              <circle cx="68" cy="72" r="3" fill="#D9F0EC" stroke="#202226" strokeWidth="1.5" />
              <circle cx="50" cy="56" r="2.5" fill="#202226" />
            </svg>
          </div>
        </div>

        <div className="w-full flex justify-between items-end mt-1">
          <div className="w-3.5 h-3.5 border-b-2 border-l-2 border-[#202226] rounded-bl-sm" />
          <div className="flex flex-col items-center">
            <Link
              href="/workout"
              className="text-xs font-bold text-[#202226] hover:underline"
            >
              Start analysis
            </Link>
            <span className="text-[10px] text-[#8E9399]">
              MediaPipe 33-point tracking
            </span>
          </div>
          <div className="w-3.5 h-3.5 border-b-2 border-r-2 border-[#202226] rounded-br-sm" />
        </div>
      </div>

      {/* 2. MIDDLE CARD: Recent Movements & Sessions */}
      <div className="bg-white rounded-[26px] border border-[#E9EBED] p-3.5 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          {/* Avatar bubbles matching screenshot */}
          <div className="flex -space-x-1.5 overflow-hidden">
            <div className="h-7 w-7 rounded-full bg-[#EDE2F2] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#202226]">
              SQ
            </div>
            <div className="h-7 w-7 rounded-full bg-[#D9F0EC] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#202226]">
              PU
            </div>
            <div className="h-7 w-7 rounded-full bg-[#F6E8F1] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#202226]">
              BC
            </div>
          </div>

          <div className="h-5 w-9 rounded-full bg-[#F0F1F3] flex items-center justify-center text-[10px] font-semibold text-[#8E9399]">
            •••
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-[#8E9399]">
            {totalSessions > 0 ? `${totalSessions} sessions recorded` : "Your recent movements"}
          </span>
          <Link
            href="/sessions"
            className="text-[11px] font-semibold text-[#202226] hover:underline flex items-center"
          >
            view all <ChevronRight className="h-3 w-3 ml-0.5" />
          </Link>
        </div>
      </div>

      {/* 3. BOTTOM CARD: Exercise suite toggles */}
      <div className="bg-white rounded-[26px] border border-[#E9EBED] p-3.5 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-[#202226]">
          <span>Movements</span>
          <span className="text-[10px] font-medium text-[#8E9399]">4 active</span>
        </div>

        {/* Row 1: Squat */}
        <div className="flex items-center justify-between py-1 text-xs">
          <span className="text-xs font-semibold text-[#202226]">Squat</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#8E9399]">v.a</span>
            <button
              onClick={() => toggleExercise("squat")}
              className={`h-5 w-9 rounded-full p-0.5 transition-colors ${
                exercisesState.squat ? "bg-[#25292A]" : "bg-[#E7EAEC]"
              }`}
            >
              <div
                className={`h-4 w-4 rounded-full bg-white shadow-xs transition-transform ${
                  exercisesState.squat ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Row 2: Push-up */}
        <div className="flex items-center justify-between py-1 text-xs">
          <span className="text-xs font-semibold text-[#202226]">Push-up</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#8E9399]">v.a</span>
            <button
              onClick={() => toggleExercise("pushup")}
              className={`h-5 w-9 rounded-full p-0.5 transition-colors ${
                exercisesState.pushup ? "bg-[#D9F0EC]" : "bg-[#E7EAEC]"
              }`}
            >
              <div
                className={`h-4 w-4 rounded-full bg-[#202226] shadow-xs transition-transform ${
                  exercisesState.pushup ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Row 3: Bicep Curl */}
        <div className="flex items-center justify-between py-1 text-xs">
          <span className="text-xs font-semibold text-[#202226]">Bicep Curl</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#8E9399]">v.a</span>
            <button
              onClick={() => toggleExercise("curl")}
              className={`h-5 w-9 rounded-full p-0.5 transition-colors ${
                exercisesState.curl ? "bg-[#D9F0EC]" : "bg-[#E7EAEC]"
              }`}
            >
              <div
                className={`h-4 w-4 rounded-full bg-[#202226] shadow-xs transition-transform ${
                  exercisesState.curl ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Row 4: Yoga */}
        <div className="flex items-center justify-between py-1 text-xs">
          <span className="text-xs font-semibold text-[#202226]">Yoga</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#8E9399]">v.a</span>
            <button
              onClick={() => toggleExercise("yoga")}
              className={`h-5 w-9 rounded-full p-0.5 transition-colors ${
                exercisesState.yoga ? "bg-[#EDE2F2]" : "bg-[#E7EAEC]"
              }`}
            >
              <div
                className={`h-4 w-4 rounded-full bg-[#202226] shadow-xs transition-transform ${
                  exercisesState.yoga ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-[#E9EBED] text-[10px]">
          <Link href="/workout" className="text-[#8E9399] hover:text-[#202226]">
            view all
          </Link>
          <span className="text-[#202226] font-semibold cursor-pointer">+ add</span>
        </div>
      </div>

      {/* 4. LOWER RIGHT DARK ACCENT CARD: 17/60 FPS Speed Gauge */}
      <div className="bg-[#202223] text-white rounded-[26px] p-4 shadow-sm relative overflow-hidden">
        {/* Top Arc Gauge */}
        <div className="flex items-center justify-between mb-2">
          <div className="relative flex items-center justify-center w-full">
            {/* Dotted semicircle path */}
            <svg viewBox="0 0 120 45" className="w-28 h-10">
              <path
                d="M 15,40 A 45,45 0 0,1 105,40"
                fill="none"
                stroke="#374151"
                strokeWidth="3"
                strokeDasharray="2,5"
                strokeLinecap="round"
              />
              <path
                d="M 15,40 A 45,45 0 0,1 75,10"
                fill="none"
                stroke="#D9F0EC"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute top-2 text-center">
              <div className="text-base font-bold text-white tracking-tight">17<span className="text-xs text-[#8E9399]">/60 FPS</span></div>
            </div>
          </div>
        </div>

        <div className="text-xs font-bold text-white mb-1">
          Client-Side Vision
        </div>
        <p className="text-[11px] text-[#8E9399] leading-relaxed">
          Zero raw video transmitted to cloud. 100% private biomechanical estimation.
        </p>

        <div className="mt-2.5 flex items-center justify-between">
          <Link
            href="/research"
            className="text-[10px] font-semibold text-[#D9F0EC] hover:underline"
          >
            More info &gt;
          </Link>
          <div className="h-5 w-5 rounded-full bg-[#374151] flex items-center justify-center">
            <Zap className="h-3 w-3 text-[#D9F0EC]" />
          </div>
        </div>
      </div>
    </div>
  );
}
