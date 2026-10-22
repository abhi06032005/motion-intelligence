import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

// Setup browser globals before importing module
const mockStore = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string): string | null => mockStore.get(key) ?? null,
  setItem: (key: string, val: string): void => {
    mockStore.set(key, String(val));
  },
  removeItem: (key: string): void => {
    mockStore.delete(key);
  },
  clear: (): void => {
    mockStore.clear();
  },
};

(globalThis as any).window = globalThis;
(globalThis as any).localStorage = mockLocalStorage;

import {
  getSavedSessions,
  saveSession,
  clearAllSavedSessions,
  migrateLegacySessions,
  SAMPLE_DEMO_SESSIONS,
  ExerciseSession,
} from "../src/lib/sessionStorage";

beforeEach(() => {
  mockStore.clear();
});

test("getSavedSessions returns an honest empty array initially", () => {
  mockStore.clear();
  const sessions = getSavedSessions();
  assert.deepEqual(sessions, []);
  assert.equal(localStorage.getItem("motioniq_user_sessions"), null);
});

test("migrateLegacySessions removes legacy auto-injected mock IDs", () => {
  const mixed: ExerciseSession[] = [
    {
      id: "sess-001", // Legacy mock ID
      date: "2026-10-18 09:30",
      exercise: "Squat",
      reps: 10,
      validReps: 8,
      smoothness: 0.88,
      symmetry: 0.9,
      cameraView: "Frontal",
      violations: [],
      source: "live",
    },
    {
      id: "sess-002", // Legacy mock ID
      date: "2026-10-19 18:15",
      exercise: "Push-up",
      reps: 12,
      validReps: 11,
      smoothness: 0.86,
      symmetry: 0.92,
      cameraView: "Lateral",
      violations: [],
      source: "live",
    },
    {
      id: "user_real_session_1", // Genuine user session
      date: "2026-10-22 14:00",
      exercise: "Squat",
      reps: 15,
      validReps: 14,
      smoothness: 0.85,
      symmetry: 0.91,
      cameraView: "Frontal",
      violations: [],
      source: "live",
    },
  ];

  const { cleaned, migratedCount } = migrateLegacySessions(mixed);
  assert.equal(migratedCount, 2);
  assert.equal(cleaned.length, 1);
  assert.equal(cleaned[0].id, "user_real_session_1");
});

test("saveSession persists real sessions and ignores accidental duplicate saves", () => {
  mockStore.clear();

  const saved1 = saveSession({
    exercise: "Squat",
    reps: 10,
    validReps: 9,
    smoothness: 0.85,
    symmetry: 0.92,
    cameraView: "Frontal",
    violations: ["Knee valgus on rep 3"],
    durationSeconds: 40,
    source: "live",
  });

  assert.ok(saved1.id.startsWith("sess_"));
  assert.equal(saved1.exercise, "Squat");
  assert.equal(saved1.reps, 10);
  assert.equal(saved1.validReps, 9);

  let current = getSavedSessions();
  assert.equal(current.length, 1);
  assert.equal(current[0].id, saved1.id);

  // Attempt duplicate save with identical properties
  saveSession({
    id: saved1.id,
    date: saved1.date,
    exercise: "Squat",
    reps: 10,
    validReps: 9,
    smoothness: 0.85,
    symmetry: 0.92,
    cameraView: "Frontal",
    violations: ["Knee valgus on rep 3"],
    durationSeconds: 40,
    source: "live",
  });

  current = getSavedSessions();
  assert.equal(current.length, 1, "Duplicate session must not be appended");
});

test("clearAllSavedSessions purges records completely", () => {
  saveSession({
    exercise: "Push-up",
    reps: 12,
    validReps: 12,
    smoothness: 0.88,
    symmetry: 0.95,
    cameraView: "Lateral",
    violations: [],
    source: "live",
  });
  assert.equal(getSavedSessions().length, 1);

  clearAllSavedSessions();
  assert.equal(getSavedSessions().length, 0);
  assert.equal(localStorage.getItem("motioniq_user_sessions"), null);
});

test("SAMPLE_DEMO_SESSIONS is isolated and does not contaminate user storage", () => {
  mockStore.clear();
  assert.ok(SAMPLE_DEMO_SESSIONS.length >= 4);
  for (const demo of SAMPLE_DEMO_SESSIONS) {
    assert.ok(demo.id.startsWith("demo-sess-"));
  }
  // User storage must still remain empty
  assert.deepEqual(getSavedSessions(), []);
});
