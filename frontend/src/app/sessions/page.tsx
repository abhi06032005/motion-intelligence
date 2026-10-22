"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Dumbbell,
  Video,
  Sparkles,
  ArrowRight,
  Eye,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ExerciseSession,
  getSavedSessions,
  clearAllSavedSessions,
  SAMPLE_DEMO_SESSIONS,
} from "@/lib/sessionStorage";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function SessionsPage() {
  const [userSessions, setUserSessions] = useState<ExerciseSession[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setUserSessions(getSavedSessions());
  }, []);

  const activeSessions = isDemoMode ? SAMPLE_DEMO_SESSIONS : userSessions;

  // Compute aggregate statistics honestly from real data
  const totalReps = activeSessions.reduce((acc, s) => acc + s.reps, 0);

  const sessionsWithSmoothness = activeSessions.filter((s) => s.smoothness != null);
  const avgSmoothness =
    sessionsWithSmoothness.length > 0
      ? Math.round(
          (sessionsWithSmoothness.reduce((acc, s) => acc + (s.smoothness ?? 0), 0) /
            sessionsWithSmoothness.length) *
            100
        )
      : null;

  const sessionsWithSymmetry = activeSessions.filter((s) => s.symmetry != null);
  const avgSymmetry =
    sessionsWithSymmetry.length > 0
      ? Math.round(
          (sessionsWithSymmetry.reduce((acc, s) => acc + (s.symmetry ?? 0), 0) /
            sessionsWithSymmetry.length) *
            100
        )
      : null;

  const exportData = () => {
    const payload = {
      exportType: isDemoMode ? "demo_mode_sample_sessions" : "user_genuine_sessions",
      exportTimestamp: new Date().toISOString(),
      platform: "MotionIQ Movement Intelligence",
      totalSessions: activeSessions.length,
      sessions: activeSessions,
    };
    const dataStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MotionIQ_Sessions_${isDemoMode ? "Demo" : "UserData"}_${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearData = () => {
    if (
      confirm(
        "Are you sure you want to permanently clear your recorded workout and video analysis sessions?"
      )
    ) {
      clearAllSavedSessions();
      setUserSessions([]);
    }
  };

  const chartData = activeSessions.map((s, idx) => ({
    name: `Sess ${idx + 1}`,
    date: s.date.split(" ")[0],
    reps: s.reps,
    smoothness: s.smoothness != null ? Math.round(s.smoothness * 100) : null,
    symmetry: s.symmetry != null ? Math.round(s.symmetry * 100) : null,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <Activity className="h-4 w-4" />
            <span>Biomechanical History</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Movement Sessions & Quality
          </h1>
          <p className="mt-1 text-slate-400 text-sm">
            Review movement kinematics, repetition volume, and technique consistency over time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Demo Mode Toggle */}
          <button
            onClick={() => setIsDemoMode(!isDemoMode)}
            className={cn(
              "flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition",
              isDemoMode
                ? "border-amber-500/50 bg-amber-950/40 text-amber-300 ring-1 ring-amber-500/30"
                : "border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200"
            )}
            title="Toggle between your genuine recorded sessions and sample research data"
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span>{isDemoMode ? "Exit Demo Mode" : "Preview Demo Data"}</span>
          </button>

          <button
            onClick={exportData}
            disabled={activeSessions.length === 0}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-40 transition"
          >
            <Download className="h-4 w-4 text-emerald-400" />
            <span>Export JSON</span>
          </button>

          {!isDemoMode && (
            <button
              onClick={clearData}
              disabled={userSessions.length === 0}
              className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-950/20 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-950/40 disabled:opacity-40 transition"
            >
              <Trash2 className="h-4 w-4 text-rose-400" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Demo Mode Active Banner */}
      {isDemoMode && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Info className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-amber-200">Demo Mode Active</p>
              <p className="text-xs text-amber-300/80">
                Viewing sample biomechanical session records. Your real recorded session history is preserved and unaffected.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDemoMode(false)}
            className="rounded-lg bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/30 transition"
          >
            Return to My Sessions
          </button>
        </div>
      )}

      {/* Aggregate KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Recorded Sessions
          </span>
          <p className="mt-2 text-3xl font-black text-white">{activeSessions.length}</p>
          <span className="text-[11px] text-slate-500">
            {isDemoMode ? "Sample records" : "User sessions"}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Repetitions
          </span>
          <p className="mt-2 text-3xl font-black text-emerald-400">{totalReps}</p>
          <span className="text-[11px] text-slate-500">Completed reps</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Mean Smoothness
          </span>
          <p className="mt-2 text-3xl font-black text-indigo-400">
            {avgSmoothness != null ? `${avgSmoothness}%` : "—"}
          </p>
          <span className="text-[11px] text-slate-500">Kinematic consistency</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Mean Symmetry
          </span>
          <p className="mt-2 text-3xl font-black text-teal-400">
            {avgSymmetry != null ? `${avgSymmetry}%` : "—"}
          </p>
          <span className="text-[11px] text-slate-500">Bilateral limb balance</span>
        </div>
      </div>

      {/* Trend Graph */}
      {activeSessions.length > 0 && isMounted && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Movement Quality Progression
            </h3>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                Smoothness (%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-500" />
                Symmetry (%)
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="smoothnessGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="symmetryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} domain={[60, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    borderColor: "#334155",
                    borderRadius: "0.5rem",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="smoothness"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#smoothnessGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="symmetry"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#symmetryGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Session History Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            Recorded Movement Sessions
          </h3>
          <span className="text-xs text-slate-400">
            {activeSessions.length} {activeSessions.length === 1 ? "session" : "sessions"}
          </span>
        </div>

        {activeSessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 uppercase font-semibold text-[11px] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Date / Time</th>
                  <th className="px-5 py-3.5">Exercise</th>
                  <th className="px-5 py-3.5">Reps</th>
                  <th className="px-5 py-3.5">Camera View</th>
                  <th className="px-5 py-3.5">Smoothness</th>
                  <th className="px-5 py-3.5">Symmetry</th>
                  <th className="px-5 py-3.5">Technique Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-5 py-4 font-mono text-slate-400 whitespace-nowrap">{s.date}</td>
                    <td className="px-5 py-4 font-semibold text-white">{s.exercise}</td>
                    <td className="px-5 py-4 font-mono">
                      <span className="text-emerald-400 font-bold">{s.validReps}</span>
                      <span className="text-slate-500"> / {s.reps}</span>
                    </td>
                    <td className="px-5 py-4 capitalize text-slate-400">{s.cameraView}</td>
                    <td className="px-5 py-4 text-emerald-400 font-semibold">
                      {s.smoothness != null ? `${Math.round(s.smoothness * 100)}%` : "N/A"}
                    </td>
                    <td className="px-5 py-4 text-teal-400 font-semibold">
                      {s.symmetry != null ? `${Math.round(s.symmetry * 100)}%` : "N/A"}
                    </td>
                    <td className="px-5 py-4 max-w-xs">
                      {s.violations.length > 0 ? (
                        <div className="space-y-1">
                          {s.violations.map((v, i) => (
                            <div key={i} className="text-amber-300/90 text-[11px] flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                              <span>{v}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-emerald-400/80 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Optimal form maintained</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 space-y-4">
            <div className="rounded-full bg-slate-800/60 p-4 w-14 h-14 mx-auto flex items-center justify-center border border-slate-700/60">
              <Dumbbell className="h-7 w-7 text-slate-400" />
            </div>
            <div>
              <p className="text-sm text-slate-300 font-semibold">No workout sessions recorded yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Your exercise history will be automatically stored locally as you complete live workouts or video assessments.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/workout"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 transition"
              >
                <Dumbbell className="h-3.5 w-3.5" />
                <span>Start Live Workout</span>
              </Link>
              <Link
                href="/analyse"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
              >
                <Video className="h-3.5 w-3.5 text-emerald-400" />
                <span>Analyse Video</span>
              </Link>
              <button
                onClick={() => setIsDemoMode(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-950/30 px-4 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-900/50 transition"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Preview Demo Data</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
