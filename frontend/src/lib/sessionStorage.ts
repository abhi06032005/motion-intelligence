/**
 * MotionIQ Session Storage Manager
 *
 * Provides persistent local storage for user workout sessions and video analyses.
 * Preserves research integrity by maintaining an honest empty state until actual
 * sessions are recorded, with sample records kept strictly in an isolated Demo Mode.
 */

export interface ExerciseSession {
  id: string;
  date: string;
  exercise: string;
  reps: number;
  validReps: number;
  smoothness: number | null; // null if not available or insufficient movement
  symmetry: number | null;
  cameraView: string;
  violations: string[];
  durationSeconds?: number;
  source: "live" | "video_analysis";
  confidence?: number;
}

const STORAGE_KEY = "motioniq_user_sessions";

export const SAMPLE_DEMO_SESSIONS: ExerciseSession[] = [
  {
    id: "demo-sess-001",
    date: "2026-10-18 09:30",
    exercise: "Squat",
    reps: 10,
    validReps: 8,
    smoothness: 0.82,
    symmetry: 0.88,
    cameraView: "Frontal",
    violations: ["Knee valgus on rep 4", "Insufficient depth on rep 7"],
    durationSeconds: 42,
    source: "live",
    confidence: 0.91,
  },
  {
    id: "demo-sess-002",
    date: "2026-10-19 18:15",
    exercise: "Push-up",
    reps: 12,
    validReps: 11,
    smoothness: 0.86,
    symmetry: 0.92,
    cameraView: "Lateral",
    violations: ["Hip sag on rep 10"],
    durationSeconds: 50,
    source: "live",
    confidence: 0.88,
  },
  {
    id: "demo-sess-003",
    date: "2026-10-20 08:45",
    exercise: "Bicep Curl",
    reps: 14,
    validReps: 14,
    smoothness: 0.91,
    symmetry: 0.95,
    cameraView: "Frontal",
    violations: [],
    durationSeconds: 38,
    source: "live",
    confidence: 0.96,
  },
  {
    id: "demo-sess-004",
    date: "2026-10-21 17:20",
    exercise: "Squat",
    reps: 12,
    validReps: 12,
    smoothness: 0.89,
    symmetry: 0.94,
    cameraView: "Frontal",
    violations: [],
    durationSeconds: 48,
    source: "video_analysis",
    confidence: 0.93,
  },
];

/**
 * Retrieve saved user sessions from localStorage.
 * Does NOT auto-populate demo data; returns an empty array if no sessions exist.
 */
export function getSavedSessions(): ExerciseSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Failed to load saved sessions from localStorage:", err);
    return [];
  }
}

/**
 * Persist a newly completed genuine exercise session.
 */
export function saveSession(session: Omit<ExerciseSession, "id" | "date"> & { id?: string; date?: string }): ExerciseSession {
  const newSession: ExerciseSession = {
    ...session,
    id: session.id || `sess_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    date: session.date || new Date().toISOString().replace("T", " ").substring(0, 16),
  };

  if (typeof window !== "undefined") {
    try {
      const existing = getSavedSessions();
      const updated = [newSession, ...existing];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to save session to localStorage:", err);
    }
  }

  return newSession;
}

/**
 * Clear all genuine saved sessions.
 */
export function clearAllSavedSessions(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
