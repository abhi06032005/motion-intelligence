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
import { DashboardShell } from "@/components/DashboardShell";
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
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#F0F1F3]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#202226] tracking-tight">
              Movement Sessions & Quality
            </h1>
            <p className="mt-1 text-[#8E9399] text-xs sm:text-sm">
              Review movement kinematics, repetition volume, and technique consistency over time
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Demo Mode Toggle */}
            <button
              onClick={() => setIsDemoMode(!isDemoMode)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all shadow-2xs",
                isDemoMode
                  ? "border-amber-300 bg-amber-50 text-amber-900"
                  : "border-[#E9EBED] bg-white text-[#8E9399] hover:text-[#202226]"
              )}
              title="Toggle between your genuine recorded sessions and sample research data"
            >
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span>{isDemoMode ? "Exit Demo Mode" : "Preview Demo Data"}</span>
            </button>

            <button
              onClick={exportData}
              disabled={activeSessions.length === 0}
              className="flex items-center gap-1.5 rounded-full border border-[#E9EBED] bg-white px-4 py-1.5 text-xs font-semibold text-[#202226] hover:bg-[#F0F1F3] disabled:opacity-40 transition shadow-2xs"
            >
              <Download className="h-4 w-4 text-[#202226]" />
              <span>Export JSON</span>
            </button>

            {!isDemoMode && (
              <button
                onClick={clearData}
                disabled={userSessions.length === 0}
                className="flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-40 transition shadow-2xs"
              >
                <Trash2 className="h-4 w-4 text-rose-600" />
                <span>Clear History</span>
              </button>
            )}
          </div>
        </div>

        {/* Demo Mode Active Banner */}
        {isDemoMode && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3">
              <Info className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-amber-950">Demo Mode Active</p>
                <p className="text-xs text-amber-800">
                  Viewing sample biomechanical session records. Your real recorded session history is preserved and unaffected.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsDemoMode(false)}
              className="rounded-full bg-amber-200 border border-amber-300 px-3.5 py-1 text-xs font-bold text-amber-950 hover:bg-amber-300 transition"
            >
              Return to My Sessions
            </button>
          </div>
        )}

        {/* Aggregate KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-[26px] border border-[#E9EBED] bg-white p-5 shadow-2xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8E9399]">
              Recorded Sessions
            </span>
            <p className="mt-1 text-3xl font-extrabold text-[#202226]">{activeSessions.length}</p>
            <span className="text-[11px] text-[#8E9399]">
              {isDemoMode ? "Sample records" : "User sessions"}
            </span>
          </div>

          <div className="rounded-[26px] border border-[#E9EBED] bg-white p-5 shadow-2xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8E9399]">
              Total Repetitions
            </span>
            <p className="mt-1 text-3xl font-extrabold text-emerald-600">{totalReps}</p>
            <span className="text-[11px] text-[#8E9399]">Completed reps</span>
          </div>

          <div className="rounded-[26px] border border-[#E9EBED] bg-white p-5 shadow-2xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8E9399]">
              Mean Smoothness
            </span>
            <p className="mt-1 text-3xl font-extrabold text-[#202226]">
              {avgSmoothness != null ? `${avgSmoothness}%` : "—"}
            </p>
            <span className="text-[11px] text-[#8E9399]">Kinematic consistency</span>
          </div>

          <div className="rounded-[26px] border border-[#E9EBED] bg-white p-5 shadow-2xs">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8E9399]">
              Mean Symmetry
            </span>
            <p className="mt-1 text-3xl font-extrabold text-[#202226]">
              {avgSymmetry != null ? `${avgSymmetry}%` : "—"}
            </p>
            <span className="text-[11px] text-[#8E9399]">Bilateral limb balance</span>
          </div>
        </div>

        {/* Trend Graph */}
        {activeSessions.length > 0 && isMounted && (
          <div className="rounded-[26px] border border-[#E9EBED] bg-white p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E9399]">
                Movement Quality Progression
              </h3>
              <div className="flex items-center gap-4 text-xs text-[#8E9399]">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#202226]" />
                  Smoothness (%)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#34d399]" />
                  Symmetry (%)
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="smoothnessGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#202226" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#202226" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="symmetryGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F1F3" />
                  <XAxis dataKey="date" stroke="#8E9399" fontSize={11} />
                  <YAxis stroke="#8E9399" fontSize={11} domain={[60, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#FFFFFF",
                      borderColor: "#E9EBED",
                      borderRadius: "1rem",
                      fontSize: "12px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="smoothness"
                    stroke="#202226"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#smoothnessGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="symmetry"
                    stroke="#34d399"
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
        <div className="rounded-[26px] border border-[#E9EBED] bg-white overflow-hidden shadow-2xs">
          <div className="p-5 border-b border-[#F0F1F3] flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#8E9399]">
              Recorded Movement Sessions
            </h3>
            <span className="text-xs text-[#8E9399]">
              {activeSessions.length} {activeSessions.length === 1 ? "session" : "sessions"}
            </span>
          </div>

          {activeSessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#202226]">
                <thead className="bg-[#F0F1F3] uppercase font-bold text-[11px] text-[#8E9399] border-b border-[#E9EBED]">
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
                <tbody className="divide-y divide-[#F0F1F3]">
                  {activeSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F0F1F3]/40 transition">
                      <td className="px-5 py-4 font-mono text-[#8E9399] whitespace-nowrap">{s.date}</td>
                      <td className="px-5 py-4 font-bold text-[#202226]">{s.exercise}</td>
                      <td className="px-5 py-4 font-mono">
                        <span className="text-emerald-700 font-bold">{s.validReps}</span>
                        <span className="text-[#8E9399]"> / {s.reps}</span>
                      </td>
                      <td className="px-5 py-4 capitalize text-[#8E9399]">{s.cameraView}</td>
                      <td className="px-5 py-4 text-emerald-700 font-bold">
                        {s.smoothness != null ? `${Math.round(s.smoothness * 100)}%` : "N/A"}
                      </td>
                      <td className="px-5 py-4 text-[#202226] font-bold">
                        {s.symmetry != null ? `${Math.round(s.symmetry * 100)}%` : "N/A"}
                      </td>
                      <td className="px-5 py-4 max-w-xs">
                        {s.violations.length > 0 ? (
                          <div className="space-y-1">
                            {s.violations.map((v, i) => (
                              <div key={i} className="text-amber-900 text-[11px] flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                                <span>{v}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-emerald-700 flex items-center gap-1 font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
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
            <div className="p-12 text-center text-[#8E9399] space-y-4">
              <div className="rounded-full bg-[#F0F1F3] p-4 w-14 h-14 mx-auto flex items-center justify-center border border-[#E9EBED]">
                <Dumbbell className="h-7 w-7 text-[#202226]" />
              </div>
              <div>
                <p className="text-sm text-[#202226] font-bold">No workout sessions recorded yet</p>
                <p className="text-xs text-[#8E9399] max-w-sm mx-auto mt-1">
                  Your exercise history will be automatically stored locally as you complete live workouts or video assessments.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <Link
                  href="/workout"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#202226] hover:bg-black px-5 py-2 text-xs font-semibold text-white transition shadow-xs"
                >
                  <Dumbbell className="h-3.5 w-3.5" />
                  <span>Start Live Workout</span>
                </Link>
                <Link
                  href="/analyse"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E9EBED] bg-white px-4 py-2 text-xs font-semibold text-[#202226] hover:bg-[#F0F1F3] transition shadow-2xs"
                >
                  <Video className="h-3.5 w-3.5" />
                  <span>Analyse Video</span>
                </Link>
                <button
                  onClick={() => setIsDemoMode(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#CEECE7] bg-[#D9F0EC] px-4 py-2 text-xs font-bold text-[#202226] hover:bg-[#CEECE7] transition shadow-2xs"
                >
                  <Sparkles className="h-3.5 w-3.5 text-[#202226]" />
                  <span>Preview Demo Data</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
