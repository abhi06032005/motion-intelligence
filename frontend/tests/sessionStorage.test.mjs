import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

// Mock localStorage in Node environment
const mockStorage = new Map();
globalThis.localStorage = {
  getItem: (key) => mockStorage.get(key) ?? null,
  setItem: (key, val) => mockStorage.set(key, String(val)),
  removeItem: (key) => mockStorage.delete(key),
  clear: () => mockStorage.clear(),
};

const STORAGE_KEY = "motioniq_user_sessions";

function getSavedSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveSession(session) {
  const newSession = {
    ...session,
    id: session.id || `sess_${Date.now()}_test`,
    date: session.date || "2026-10-22 12:00",
  };
  const existing = getSavedSessions();
  const updated = [newSession, ...existing];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newSession;
}

function clearAllSavedSessions() {
  localStorage.removeItem(STORAGE_KEY);
}

test("getSavedSessions returns empty array initially without injecting fake demo data", () => {
  mockStorage.clear();
  const sessions = getSavedSessions();
  assert.deepEqual(sessions, [], "Saved sessions should be empty initially");
  assert.equal(localStorage.getItem(STORAGE_KEY), null, "localStorage must remain empty");
});

test("saveSession persists real completed workout session", () => {
  mockStorage.clear();
  const saved = saveSession({
    exercise: "Squat",
    reps: 12,
    validReps: 10,
    smoothness: 0.88,
    symmetry: 0.92,
    cameraView: "FRONTAL",
    violations: ["Knee valgus on rep 5"],
    durationSeconds: 45,
    source: "live",
  });

  assert.equal(saved.exercise, "Squat");
  assert.equal(saved.reps, 12);

  const stored = getSavedSessions();
  assert.equal(stored.length, 1);
  assert.equal(stored[0].exercise, "Squat");
  assert.equal(stored[0].reps, 12);
});

test("clearAllSavedSessions purges records completely", () => {
  saveSession({ exercise: "Push-up", reps: 15, validReps: 15 });
  assert.equal(getSavedSessions().length >= 1, true);

  clearAllSavedSessions();
  assert.equal(getSavedSessions().length, 0);
  assert.equal(localStorage.getItem(STORAGE_KEY), null);
});
