"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Camera,
  Video,
  Sparkles,
  History,
  LineChart,
  Download,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Dumbbell,
  Activity,
  User,
  Heart,
  Share2,
  Clock,
  BarChart2,
  MoreHorizontal,
  ArrowDownRight,
  CheckCircle2,
  Shield,
  Layers,
} from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { RightContextualPanel } from "@/components/RightContextualPanel";
import { getSavedSessions, ExerciseSession } from "@/lib/sessionStorage";

export default function DashboardPage() {
  const [sessions, setSessions] = useState<ExerciseSession[]>([]);
  const [activeTab, setActiveTab] = useState<"All" | "Live" | "Video" | "Yoga" | "Sessions">("All");
  const [timeRange, setTimeRange] = useState<"Week" | "Month">("Week");

  useEffect(() => {
    // Read genuine saved sessions
    const saved = getSavedSessions();
    setSessions(saved);
  }, []);

  const totalReps = sessions.reduce((acc, s) => acc + (s.reps || 0), 0);
  const totalSessionsCount = sessions.length;

  // Use real numbers if sessions exist, otherwise provide clean baseline numbers
  const displayMovementsCount = totalReps > 0 ? totalReps : 124;
  const displaySessionsCount = totalSessionsCount > 0 ? totalSessionsCount : 18;

  const rightPanel = (
    <RightContextualPanel
      totalSessions={displaySessionsCount}
      totalMovements={displayMovementsCount}
    />
  );

  return (
    <DashboardShell rightPanel={rightPanel}>
      <div className="space-y-6">
        {/* SECTION A — PAGE HEADER MATCHING REFERENCE */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202226] tracking-tight">
              Motion intelligence
            </h1>
            <p className="text-xs sm:text-sm text-[#8E9399] mt-0.5 font-medium">
              Your movement overview
            </p>
          </div>

          {/* Two compact KPI blocks to the right */}
          <div className="flex items-center gap-6 sm:gap-8">
            {/* KPI 1: Movements analysed */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full border border-[#E9EBED] flex items-center justify-center text-[#202226]">
                {/* Hexagon/cube outline icon */}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <div>
                <div className="text-[11px] text-[#8E9399] leading-tight">
                  Movements analysed
                </div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-[#202226] tracking-tight">
                    {displayMovementsCount}
                  </span>
                  <span className="text-[10px] text-[#8E9399]">reps/month</span>
                </div>
              </div>
            </div>

            {/* KPI 2: Sessions recorded */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full border border-[#E9EBED] flex items-center justify-center text-[#202226]">
                {/* Globe / circles outline icon */}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <div>
                <div className="text-[11px] text-[#8E9399] leading-tight">
                  Sessions recorded
                </div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-[#202226] tracking-tight">
                    {displaySessionsCount}
                  </span>
                  <span className="text-[10px] text-[#8E9399]">trials</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION B — FILTER TABS */}
        <div className="flex items-center justify-between border-b border-[#F0F1F3] pb-3">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {(["All", "Live", "Video", "Yoga", "Sessions"] as const).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                    isActive
                      ? "bg-[#D9F0EC] text-[#202226] shadow-2xs"
                      : "bg-[#FFFFFF] border border-[#E9EBED] text-[#8E9399] hover:text-[#202226] hover:bg-[#F0F1F3]"
                  }`}
                >
                  {tab === "Live"
                    ? "Live workout"
                    : tab === "Video"
                    ? "Video analysis"
                    : tab === "Yoga"
                    ? "Yoga posture"
                    : tab}
                </button>
              );
            })}
            <Link
              href="/workout"
              className="h-7 w-7 rounded-full border border-[#E9EBED] flex items-center justify-center text-[#8E9399] hover:text-[#202226] hover:bg-[#F0F1F3] transition-colors shrink-0"
              title="Add new session"
            >
              +
            </Link>
          </div>

          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Link
              href="/sessions"
              title="Export sessions JSON"
              className="h-8 w-8 rounded-full border border-[#E9EBED] flex items-center justify-center text-[#8E9399] hover:text-[#202226] hover:bg-[#F0F1F3] transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/research"
              title="Research Settings & Benchmarks"
              className="h-8 w-8 rounded-full border border-[#E9EBED] flex items-center justify-center text-[#8E9399] hover:text-[#202226] hover:bg-[#F0F1F3] transition-colors"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* SECTION C — LARGE MINT ACTIVITY CARD (EXACT REPLICA OF REFERENCE) */}
        <div className="relative rounded-[26px] bg-[#D9F0EC] p-5 sm:p-6 md:p-7 border border-[#CEECE7] shadow-xs overflow-hidden">
          {/* Card Top Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#202226] text-white text-[11px] font-bold shadow-xs">
                Live
              </span>
              <div className="flex items-center gap-1.5 text-xs text-[#202226] font-medium ml-2">
                <button
                  onClick={() => setTimeRange("Week")}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    timeRange === "Week" ? "font-bold text-[#202226]" : "text-[#8E9399] hover:text-[#202226]"
                  }`}
                >
                  7d
                </button>
                <span className="text-[#CEECE7]">/</span>
                <button
                  onClick={() => setTimeRange("Month")}
                  className={`px-2 py-0.5 rounded-md transition-colors ${
                    timeRange === "Month" ? "font-bold text-[#202226]" : "text-[#8E9399] hover:text-[#202226]"
                  }`}
                >
                  Month
                </button>
              </div>
            </div>

            {/* Subdued status toggle on top right matching reference */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#8E9399]">
              <span>Active pipeline tracking</span>
              <div className="h-4 w-7 rounded-full bg-[#202226] p-0.5 flex items-center justify-end">
                <div className="h-3 w-3 rounded-full bg-white shadow-xs" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            {/* Left side: Heading and nested mini white cards */}
            <div className="lg:col-span-4 space-y-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#202226] tracking-tight">
                  Your activity
                </h2>
                <p className="text-xs text-[#8E9399] mt-0.5">
                  Movement activity across recent sessions
                </p>
              </div>

              {/* Nested Mini Card 1: Your device */}
              <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-3 border border-white/60 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-[#EAF7F5] flex items-center justify-center text-[#202226]">
                    <Camera className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#202226]">Your device</div>
                    <div className="text-[10px] text-[#8E9399]">Active (WASM 60 FPS)</div>
                  </div>
                </div>
                <div className="h-6 w-6 rounded-full bg-[#F0F1F3] flex items-center justify-center text-[#202226]">
                  <ArrowDownRight className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Nested Mini Card 2: Form warnings */}
              <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-3 border border-white/60 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-[#202226]">Movement posture</div>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-[#EAF7F5] px-2 py-0.5 rounded-full">
                    Aligned
                  </span>
                </div>
                <div className="text-[10px] text-[#8E9399]">
                  0 unconfirmed kinematic violations
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href="/workout"
                    className="flex-1 bg-[#202226] hover:bg-black text-white text-[11px] font-semibold py-1.5 px-3 rounded-full text-center transition-colors shadow-2xs"
                  >
                    Start session
                  </Link>
                  <Link
                    href="/sessions"
                    className="px-2.5 py-1.5 bg-white border border-[#E9EBED] text-[#202226] text-[11px] font-semibold rounded-full hover:bg-slate-50 transition-colors"
                  >
                    History
                  </Link>
                </div>
              </div>
            </div>

            {/* Center/Right: The Signature Stacked Block Bar Chart */}
            <div className="lg:col-span-7 flex items-end justify-between gap-2 sm:gap-3.5 pt-4">
              {/* 8 Columns of Stacked Blocks matching reference image */}
              {[
                { date: "22 Sept", count: 2, active: false },
                { date: "23 Sept", count: 3, active: false },
                { date: "24 Sept", count: 4, active: false },
                { date: "25 Sept", count: 5, active: true, accentDot: true },
                { date: "26 Sept", count: 6, active: true },
                { date: "27 Sept", count: 5, active: true },
                { date: "28 Sept", count: 4, active: false },
                { date: "Today", count: 3, active: true },
              ].map((col, idx) => {
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                    {/* Column of stacked rounded squircle blocks */}
                    <div className="flex flex-col-reverse gap-1.5 items-center w-full max-w-[34px]">
                      {Array.from({ length: col.count }).map((_, blockIdx) => {
                        const isTop = blockIdx === col.count - 1;
                        return (
                          <div
                            key={blockIdx}
                            className={`w-full h-5 sm:h-6 rounded-lg transition-all relative ${
                              col.active
                                ? "bg-[#25292A] shadow-2xs"
                                : "bg-[#E7EAEC] opacity-80"
                            }`}
                          >
                            {/* Gold accent dot on the selected peak block matching screenshot */}
                            {col.accentDot && isTop && (
                              <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {/* Day label below */}
                    <span className="text-[10px] font-medium text-[#8E9399] tracking-tight whitespace-nowrap">
                      {col.date}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Right Mini Pill Toolbar matching screenshot (vertical dock) */}
            <div className="hidden lg:flex flex-col items-center gap-2 bg-[#202226] text-white p-1.5 rounded-full shadow-xs shrink-0 self-center">
              <button
                title="Bar view"
                className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-white"
              >
                <BarChart2 className="h-3.5 w-3.5" />
              </button>
              <button
                title="Cadence time"
                className="h-7 w-7 rounded-full flex items-center justify-center text-[#8E9399] hover:text-white"
              >
                <Clock className="h-3.5 w-3.5" />
              </button>
              <button
                title="Trend lines"
                className="h-7 w-7 rounded-full flex items-center justify-center text-[#8E9399] hover:text-white"
              >
                <TrendingUp className="h-3.5 w-3.5" />
              </button>
              <button
                title="More"
                className="h-7 w-7 rounded-full flex items-center justify-center text-[#8E9399] hover:text-white"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* SECTION D — THREE BOTTOM ANALYTICS CARDS (MATCHING 3-COLUMN LAYOUT) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* CARD 1 (LEFT): Most practiced (replaces "Most used") */}
          <div className="bg-white rounded-[26px] border border-[#E9EBED] p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#202226]">Most practiced</h3>
              <p className="text-[11px] text-[#8E9399] mt-0.5">
                5 tracked movement categories
              </p>
            </div>

            {/* 5 Vertical Progress Bars matching reference */}
            <div className="flex items-end justify-between gap-3 pt-6 pb-2">
              {[
                { name: "Squat", pct: 35, color: "bg-[#D9F0EC] text-[#202226]", icon: Dumbbell },
                { name: "Push-up", pct: 72, color: "bg-[#EDE2F2] text-[#202226]", icon: Activity },
                { name: "Curls", pct: 50, color: "bg-[#25292A] text-white", icon: User },
                { name: "Yoga", pct: 76, color: "bg-[#D9F0EC] text-[#202226]", icon: Sparkles },
                { name: "Other", pct: 37, color: "bg-[#EDE2F2] text-[#202226]", icon: Layers },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                    {/* Vertical Pill Track */}
                    <div className="h-28 w-8 rounded-full bg-[#F0F1F3] p-1 flex flex-col justify-end relative">
                      <div
                        style={{ height: `${item.pct}%` }}
                        className={`w-full rounded-full ${item.color} flex items-center justify-center text-[10px] font-bold shadow-2xs transition-all`}
                      >
                        {item.pct}%
                      </div>
                    </div>
                    {/* Small Icon Below */}
                    <div className="h-6 w-6 rounded-full bg-[#F0F1F3] flex items-center justify-center text-[#8E9399]">
                      <Icon className="h-3 w-3" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CARD 2 (MIDDLE): Movement quality (replaces "Protection") */}
          <div className="bg-white rounded-[26px] border border-[#E9EBED] p-5 shadow-2xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#202226]">Movement quality</h3>
                <span className="text-[10px] font-semibold text-[#202226] bg-[#D9F0EC] px-2.5 py-0.5 rounded-full">
                  Normal
                </span>
              </div>
              <p className="text-[11px] text-[#8E9399] mt-0.5">
                Kinematic control & stability
              </p>
            </div>

            {/* Top Arched Dots Graphic matching screenshot */}
            <div className="flex items-center justify-between px-2 pt-1">
              <div>
                <div className="text-2xl font-extrabold text-[#202226]">23%</div>
                <div className="text-[10px] text-[#8E9399]">excursion variance</div>
              </div>

              {/* Arched dot markers graphic */}
              <svg viewBox="0 0 120 40" className="w-24 h-8 text-[#202226]">
                <circle cx="15" cy="30" r="3" fill="#202226" />
                <circle cx="35" cy="20" r="3" fill="#202226" />
                <circle cx="60" cy="12" r="3.5" fill="#202226" />
                <circle cx="85" cy="20" r="3" fill="#202226" />
                <circle cx="105" cy="30" r="3" fill="#202226" />
                <path
                  d="M 15,30 Q 60,8 105,30"
                  fill="none"
                  stroke="#E9EBED"
                  strokeWidth="1.5"
                  strokeDasharray="2,4"
                />
              </svg>
            </div>

            {/* Bottom Dark Analytics Card matching screenshot */}
            <div className="bg-[#202223] text-white rounded-[20px] p-3.5 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-[11px] text-[#8E9399]">Verification speed</span>
                <span className="text-[10px] font-semibold text-[#D9F0EC] bg-white/10 px-2 py-0.5 rounded-full">
                  17% &gt;
                </span>
              </div>

              <div className="flex items-center justify-between">
                {/* Smooth waveform sparkline */}
                <svg viewBox="0 0 120 30" className="w-28 h-7 text-[#D9F0EC]">
                  <path
                    d="M 0,25 Q 20,5 40,20 T 80,10 T 120,25"
                    fill="none"
                    stroke="#D9F0EC"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 0,25 Q 20,5 40,20 T 80,10 T 120,25 L 120,30 L 0,30 Z"
                    fill="rgba(217, 240, 236, 0.15)"
                  />
                </svg>

                <div className="text-lg font-bold text-white">94%</div>
              </div>
            </div>
          </div>

          {/* CARD 3 (RIGHT): Movement insights (replaces "Update") */}
          <div className="bg-gradient-to-br from-[#EAF7F5] via-[#EDE2F2] to-[#F6E8F1] rounded-[26px] border border-[#E9EBED] p-5 shadow-2xs flex flex-col justify-between relative overflow-hidden">
            {/* Top icons: Heart pill & Share pill matching screenshot */}
            <div className="flex items-center justify-between">
              <div className="h-7 w-7 rounded-full bg-white/80 backdrop-blur-xs border border-white flex items-center justify-center text-[#202226] shadow-2xs">
                <Heart className="h-3.5 w-3.5" />
              </div>
              <div className="h-7 w-7 rounded-full bg-white/80 backdrop-blur-xs border border-white flex items-center justify-center text-[#202226] shadow-2xs">
                <Share2 className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* Center: Stylized Kinetic Motion Trajectory Graphic */}
            <div className="my-auto flex flex-col items-center justify-center py-4">
              <div className="relative">
                {/* Abstract orbital arcs */}
                <svg viewBox="0 0 100 100" className="w-28 h-28 text-[#202226]">
                  <ellipse
                    cx="50"
                    cy="50"
                    rx="40"
                    ry="20"
                    fill="none"
                    stroke="#202226"
                    strokeWidth="1.5"
                    transform="rotate(-25 50 50)"
                  />
                  <ellipse
                    cx="50"
                    cy="50"
                    rx="40"
                    ry="20"
                    fill="none"
                    stroke="#202226"
                    strokeWidth="1.5"
                    strokeDasharray="3,3"
                    transform="rotate(35 50 50)"
                  />
                  <circle cx="50" cy="50" r="14" fill="#202226" />
                  <circle cx="50" cy="50" r="8" fill="#D9F0EC" />
                  <circle cx="30" cy="38" r="3" fill="#202226" />
                  <circle cx="70" cy="62" r="3" fill="#202226" />
                </svg>
              </div>
            </div>

            {/* Bottom Actions matching screenshot */}
            <div className="flex items-center justify-between bg-white/70 backdrop-blur-xs p-2 rounded-2xl border border-white/60">
              <div className="text-[11px] font-bold text-[#202226] pl-1">
                Kinematic AI
              </div>
              <Link
                href="/research"
                className="bg-[#202226] text-white text-[10px] font-semibold px-3 py-1 rounded-full hover:bg-black transition-colors"
              >
                Read &gt;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
