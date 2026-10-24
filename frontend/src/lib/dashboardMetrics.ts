import type { ExerciseSession } from "./sessionStorage";

export type DashboardTab = "All" | "Live" | "Video" | "Yoga" | "Sessions";
export type DashboardRange = "Week" | "Month";
export type ActivityColumn = { label: string; sessions: number; blocks: number };
export type MovementMix = { name: string; reps: number; pct: number };

export function getDashboardSessions(sessions: ExerciseSession[], tab: DashboardTab): ExerciseSession[] {
  switch (tab) {
    case "Live":
      return sessions.filter((s) => s.source === "live" && !s.exercise.toLowerCase().startsWith("yoga:"));
    case "Video":
      return sessions.filter((s) => s.source === "video_analysis");
    case "Yoga":
      return sessions.filter((s) => s.exercise.toLowerCase().startsWith("yoga:"));
    default:
      return sessions;
  }
}

function sessionDate(session: ExerciseSession): Date | null {
  const date = new Date(session.date.replace(" ", "T"));
  return Number.isFinite(date.getTime()) ? date : null;
}

export function getActivityColumns(
  sessions: ExerciseSession[],
  range: DashboardRange,
  now: Date = new Date()
): ActivityColumn[] {
  const daysPerColumn = range === "Week" ? 1 : 4;
  const columns = Array.from({ length: 8 }, (_, index) => {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (7 - index) * daysPerColumn);
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + daysPerColumn);
    const count = sessions.filter((session) => {
      const date = sessionDate(session);
      return date !== null && date >= start && date < end && date <= now;
    }).length;
    return {
      label: range === "Week" && index === 7 ? "Today" : start.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      sessions: count,
      blocks: 0,
    };
  });
  const max = Math.max(...columns.map((column) => column.sessions), 1);
  return columns.map((column) => ({
    ...column,
    blocks: column.sessions === 0 ? 0 : Math.max(1, Math.ceil((column.sessions / max) * 6)),
  }));
}

const categoryNames = ["Squat", "Push-up", "Curls", "Yoga", "Other"];

function categoryFor(exercise: string): string {
  const name = exercise.toLowerCase();
  if (name.startsWith("yoga:")) return "Yoga";
  if (name.includes("squat")) return "Squat";
  if (name.includes("push")) return "Push-up";
  if (name.includes("curl")) return "Curls";
  return "Other";
}

export function getMovementMix(sessions: ExerciseSession[]): MovementMix[] {
  const totals = new Map(categoryNames.map((name) => [name, 0]));
  for (const session of sessions) {
    const category = categoryFor(session.exercise);
    totals.set(category, (totals.get(category) ?? 0) + Math.max(0, session.reps || 0));
  }
  const total = [...totals.values()].reduce((sum, reps) => sum + reps, 0);
  return categoryNames.map((name) => {
    const reps = totals.get(name) ?? 0;
    return { name, reps, pct: total > 0 ? Math.round((reps / total) * 100) : 0 };
  });
}

export function getAverageSmoothness(sessions: ExerciseSession[]): number | null {
  const valid = sessions.map((s) => s.smoothness).filter((v): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1);
  return valid.length ? Math.round((valid.reduce((sum, v) => sum + v, 0) / valid.length) * 100) : null;
}

export function getRepValidityPercent(sessions: ExerciseSession[]): number | null {
  const measured = sessions.filter((s) => s.validReps !== null && Number.isFinite(s.validReps) && s.reps > 0);
  const total = measured.reduce((sum, s) => sum + s.reps, 0);
  const valid = measured.reduce((sum, s) => sum + Math.min(s.reps, Math.max(0, s.validReps ?? 0)), 0);
  return total > 0 ? Math.round((valid / total) * 100) : null;
}
