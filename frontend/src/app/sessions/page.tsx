"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Activity,
  TrendingUp,
  Download,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Dumbbell,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface StoredSession {
  id: string;
  date: string;
  exercise: string;
  reps: number;
  validReps: number;
  smoothness: number;
  symmetry: number;
  cameraView: string;
  violations: string[];
}

const DEFAULT_DEMO_SESSIONS: StoredSession[] = [
  {
    id: "sess-001",
    date: "2026-10-18 09:30",
    exercise: "Squat",
    reps: 10,
    validReps: 8,
    smoothness: 0.82,
    symmetry: 0.88,
    cameraView: "Frontal",
    violations: ["Knee valgus on rep 4", "Insufficient depth on rep 7"],
  },
  {
    id: "sess-002",
    date: "2026-10-19 18:15",
    exercise: "Push-up",
    reps: 12,
    validReps: 11,
    smoothness: 0.86,
    symmetry: 0.92,
    cameraView: "Lateral",
    violations: ["Hip sag on rep 10"],
  },
  {
    id: "sess-003",
    date: "2026-10-20 08:45",
    exercise: "Bicep Curl",
    reps: 14,
    validReps: 14,
    smoothness: 0.91,
    symmetry: 0.95,
    cameraView: "Frontal",
    violations: [],
  },
  {
    id: "sess-004",
    date: "2026-10-21 17:20",
    exercise: "Squat",
    reps: 12,
    validReps: 12,
    smoothness: 0.89,
    symmetry: 0.94,
    cameraView: "Frontal",
    violations: [],
  },
];

export default function SessionsPage() {
  const [sessions, setSessions] = useState<StoredSession[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem("motioniq_user_sessions");
    if (saved) {
      try {
        setSessions(JSON.parse(saved));
      } catch {
        setSessions(DEFAULT_DEMO_SESSIONS);
      }
    } else {
      setSessions(DEFAULT_DEMO_SESSIONS);
      localStorage.setItem("motioniq_user_sessions", JSON.stringify(DEFAULT_DEMO_SESSIONS));
    }
  }, []);

  const totalReps = sessions.reduce((acc, s) => acc + s.reps, 0);
  const avgSmoothness =
    sessions.length > 0
      ? Math.round(
          (sessions.reduce((acc, s) => acc + s.smoothness, 0) / sessions.length) * 100
        )
      : 0;
  const avgSymmetry =
    sessions.length > 0
      ? Math.round(
          (sessions.reduce((acc, s) => acc + s.symmetry, 0) / sessions.length) * 100
        )
      : 0;

  const exportData = () => {
    const dataStr = JSON.stringify(sessions, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MotionIQ_Sessions_Export_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearData = () => {
    if (confirm("Are you sure you want to permanently clear all recorded workout session history?")) {
      localStorage.removeItem("motioniq_user_sessions");
      setSessions([]);
    }
  };

  const restoreDemo = () => {
    localStorage.setItem("motioniq_user_sessions", JSON.stringify(DEFAULT_DEMO_SESSIONS));
    setSessions(DEFAULT_DEMO_SESSIONS);
  };

  const chartData = sessions.map((s, idx) => ({
    name: `Sess ${idx + 1}`,
    date: s.date.split(" ")[0],
    reps: s.reps,
    smoothness: Math.round(s.smoothness * 100),
    symmetry: Math.round(s.symmetry * 100),
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs tracking-wider uppercase mb-1">
            <Activity className="h-4 w-4" />
            <span>Longitudinal Kinematics Tracking</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
            Movement Consistency & History
          </h1>
          <p className="mt-1 text-slate-400 text-sm">
            Evaluate movement smoothness, repetition volume, and technique consistency over time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportData}
            disabled={sessions.length === 0}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 disabled:opacity-50 transition"
          >
            <Download className="h-4 w-4 text-indigo-400" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={clearData}
            disabled={sessions.length === 0}
            className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-950/20 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-950/40 disabled:opacity-50 transition"
          >
            <Trash2 className="h-4 w-4 text-rose-400" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Non-medical banner */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-950/10 p-4 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-300/90 leading-relaxed">
          <strong className="font-semibold text-amber-300">Privacy & Scientific Notice:</strong> MotionIQ
          does not assign a universal &quot;health score&quot; or provide clinical diagnoses. Trajectories and
          form deviations reflect geometric kinematic observations against validated biomechanical
          heuristics. All session records are stored client-side in your local browser sandbox.
        </p>
      </div>

      {/* Aggregate KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Recorded Sessions
          </span>
          <p className="mt-2 text-3xl font-black text-white">{sessions.length}</p>
          <span className="text-[11px] text-slate-500">Total sessions</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Repetitions
          </span>
          <p className="mt-2 text-3xl font-black text-indigo-400">{totalReps}</p>
          <span className="text-[11px] text-slate-500">Segmented reps</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Mean Smoothness (SPARC)
          </span>
          <p className="mt-2 text-3xl font-black text-emerald-400">{avgSmoothness}%</p>
          <span className="text-[11px] text-slate-500">Spectral arc length</span>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Mean Bilateral Symmetry
          </span>
          <p className="mt-2 text-3xl font-black text-teal-400">{avgSymmetry}%</p>
          <span className="text-[11px] text-slate-500">Left vs right balance</span>
        </div>
      </div>

      {/* Trend Graph */}
      {sessions.length > 0 && isMounted && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Movement Quality & Volume Progression
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
          {sessions.length === 0 && (
            <button
              onClick={restoreDemo}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Load Sample Sessions</span>
            </button>
          )}
        </div>

        {sessions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 uppercase font-semibold text-[11px] text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Date / Time</th>
                  <th className="px-5 py-3.5">Exercise</th>
                  <th className="px-5 py-3.5">Reps (Valid / Total)</th>
                  <th className="px-5 py-3.5">View</th>
                  <th className="px-5 py-3.5">Smoothness</th>
                  <th className="px-5 py-3.5">Symmetry</th>
                  <th className="px-5 py-3.5">Technique Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition">
                    <td className="px-5 py-4 font-mono text-slate-400 whitespace-nowrap">{s.date}</td>
                    <td className="px-5 py-4 font-semibold text-white">{s.exercise}</td>
                    <td className="px-5 py-4 font-mono">
                      <span className="text-emerald-400 font-bold">{s.validReps}</span>
                      <span className="text-slate-500"> / {s.reps}</span>
                    </td>
                    <td className="px-5 py-4 capitalize text-slate-400">{s.cameraView}</td>
                    <td className="px-5 py-4 text-emerald-400 font-semibold">
                      {Math.round(s.smoothness * 100)}%
                    </td>
                    <td className="px-5 py-4 text-teal-400 font-semibold">
                      {Math.round(s.symmetry * 100)}%
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
                          <span>Optimal technique maintained</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Dumbbell className="h-10 w-10 text-slate-600 mx-auto" />
            <p className="text-sm text-slate-400 font-medium">No sessions currently stored.</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Start a live workout or upload an exercise video to automatically record and track
              movement biomechanics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
