import { test } from "node:test";
import assert from "node:assert/strict";
import type { ExerciseSession } from "../src/lib/sessionStorage";
import { getActivityColumns, getAverageSmoothness, getDashboardSessions, getMovementMix, getRepValidityPercent } from "../src/lib/dashboardMetrics";

const example: ExerciseSession[] = [
  { id: "a", date: "2026-10-23 15:00", exercise: "Squat", source: "live", reps: 10, validReps: 8, smoothness: 0.8, symmetry: null, cameraView: "side", violations: [] },
  { id: "b", date: "2026-10-24 09:00", exercise: "Yoga: Tree", source: "live", reps: 1, validReps: 1, smoothness: null, symmetry: null, cameraView: "front", violations: [] },
  { id: "c", date: "2026-10-24 10:00", exercise: "Push-up", source: "video_analysis", reps: 5, validReps: null, smoothness: null, symmetry: null, cameraView: "side", violations: [] },
];

test("empty sessions always produce truthful zeroed categories and empty activity", () => {
  assert.ok(getMovementMix([]).every((item) => item.pct === 0 && item.reps === 0));
  assert.ok(getActivityColumns([], "Week", new Date(2026, 9, 24, 12)).every((item) => item.sessions === 0 && item.blocks === 0));
  assert.equal(getAverageSmoothness([]), null);
  assert.equal(getRepValidityPercent([]), null);
});

test("session tabs separate video, live workout and yoga recordings", () => {
  assert.deepEqual(getDashboardSessions(example, "Live").map((s) => s.id), ["a"]);
  assert.deepEqual(getDashboardSessions(example, "Video").map((s) => s.id), ["c"]);
  assert.deepEqual(getDashboardSessions(example, "Yoga").map((s) => s.id), ["b"]);
  assert.equal(getDashboardSessions(example, "All").length, 3);
});

test("activity buckets reflect actual recorded dates and relative levels", () => {
  const cols = getActivityColumns(example, "Week", new Date(2026, 9, 24, 12));
  assert.equal(cols.length, 8);
  assert.equal(cols[6].sessions, 1);
  assert.equal(cols[7].sessions, 2);
  assert.equal(cols[7].blocks, 6);
  assert.equal(cols[0].sessions, 0);
  assert.equal(getActivityColumns(example, "Month", new Date(2026, 9, 24, 12)).reduce((n,c) => n+c.sessions, 0), 3);
});

test("movement mix and quality rates derive only from saved samples", () => {
  const mix = getMovementMix(example);
  assert.equal(mix.reduce((sum, item) => sum + item.reps, 0), 16);
  assert.equal(mix.find((item) => item.name === "Squat")?.reps, 10);
  assert.equal(getAverageSmoothness(example), 80);
  assert.equal(getRepValidityPercent(example), 82);
});
