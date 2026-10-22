import { test } from "node:test";
import assert from "node:assert/strict";

// Re-import or test kinematics implementation
function calculateJointAngle(a, b, c) {
  const ba = { x: a.x - b.x, y: a.y - b.y, z: (a.z ?? 0) - (b.z ?? 0) };
  const bc = { x: c.x - b.x, y: c.y - b.y, z: (c.z ?? 0) - (c.z ?? 0) };

  const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;
  const magA = Math.sqrt(ba.x * ba.x + ba.y * ba.y + ba.z * ba.z);
  const magB = Math.sqrt(bc.x * bc.x + bc.y * bc.y + bc.z * bc.z);

  if (magA === 0 || magB === 0) return 180;
  const cosAngle = Math.max(-1, Math.min(1, dot / (magA * magB)));
  return (Math.acos(cosAngle) * 180) / Math.PI;
}

function computeKinematicSmoothness(angleTrajectory, fps = 30) {
  if (!angleTrajectory || angleTrajectory.length < 15) {
    return null;
  }

  const minAngle = Math.min(...angleTrajectory);
  const maxAngle = Math.max(...angleTrajectory);
  const range = maxAngle - minAngle;

  if (range < 12) {
    return null;
  }

  const dt = 1 / fps;
  const velocities = [];
  for (let i = 1; i < angleTrajectory.length; i++) {
    velocities.push((angleTrajectory[i] - angleTrajectory[i - 1]) / dt);
  }

  const accelerations = [];
  for (let i = 1; i < velocities.length; i++) {
    accelerations.push((velocities[i] - velocities[i - 1]) / dt);
  }

  if (accelerations.length === 0) return null;

  const meanAbsVelocity =
    velocities.reduce((sum, v) => sum + Math.abs(v), 0) / velocities.length;

  const meanAcc =
    accelerations.reduce((sum, a) => sum + a, 0) / accelerations.length;
  const varianceAcc =
    accelerations.reduce((sum, a) => sum + Math.pow(a - meanAcc, 2), 0) /
    accelerations.length;
  const stdAcc = Math.sqrt(varianceAcc);

  if (meanAbsVelocity <= 1e-3) return null;

  const jerkRatio = stdAcc / (meanAbsVelocity * 10 + 1);
  const score = Math.max(0.1, Math.min(0.99, Math.exp(-0.04 * jerkRatio)));

  return Math.round(score * 100) / 100;
}

function computeBilateralSymmetry(leftAngles, rightAngles) {
  if (
    !leftAngles ||
    !rightAngles ||
    leftAngles.length < 15 ||
    leftAngles.length !== rightAngles.length
  ) {
    return null;
  }

  let totalDiff = 0;
  for (let i = 0; i < leftAngles.length; i++) {
    totalDiff += Math.abs(leftAngles[i] - rightAngles[i]);
  }

  const meanDiff = totalDiff / leftAngles.length;
  const symmetry = Math.max(0, Math.min(1, 1 - meanDiff / 90));
  return Math.round(symmetry * 100) / 100;
}

test("calculateJointAngle calculates 90 degrees correctly for orthogonal vectors", () => {
  const hip = { x: 0, y: 1, z: 0 };
  const knee = { x: 0, y: 0, z: 0 };
  const ankle = { x: 1, y: 0, z: 0 };

  const angle = calculateJointAngle(hip, knee, ankle);
  assert.equal(Math.round(angle), 90);
});

test("calculateJointAngle calculates 180 degrees correctly for collinear extension", () => {
  const hip = { x: 0, y: 1, z: 0 };
  const knee = { x: 0, y: 0, z: 0 };
  const ankle = { x: 0, y: -1, z: 0 };

  const angle = calculateJointAngle(hip, knee, ankle);
  assert.equal(Math.round(angle), 180);
});

test("computeKinematicSmoothness returns null for stationary trajectories (no false data)", () => {
  // Completely stationary trajectory (range < 12 degrees)
  const stationary = Array(30).fill(175);
  const result = computeKinematicSmoothness(stationary);
  assert.equal(result, null);
});

test("computeKinematicSmoothness returns null for short trajectories (< 15 frames)", () => {
  const shortTrajectory = [170, 160, 150, 140, 130];
  const result = computeKinematicSmoothness(shortTrajectory);
  assert.equal(result, null);
});

test("computeKinematicSmoothness returns realistic score for smooth squat cycle", () => {
  // Generate 60 frames of a smooth squat descent and ascent (180° down to 90° back to 180°)
  const smoothSquat = [];
  for (let i = 0; i < 60; i++) {
    const t = (i / 59) * Math.PI * 2;
    // Angle oscillates smoothly between 90 and 180 degrees
    const angle = 135 - 45 * Math.cos(t);
    smoothSquat.push(angle);
  }

  const score = computeKinematicSmoothness(smoothSquat, 30);
  assert.ok(score !== null, "Score should not be null for valid squat");
  assert.ok(score >= 0.70 && score <= 0.99, `Score ${score} should be in realistic high range`);
});

test("computeBilateralSymmetry returns 1.0 for identical limb trajectories", () => {
  const left = Array(30).fill(0).map((_, i) => 100 + i);
  const right = [...left];

  const sym = computeBilateralSymmetry(left, right);
  assert.equal(sym, 1.0);
});

test("computeBilateralSymmetry returns lower score for asymmetric trajectories", () => {
  const left = Array(30).fill(0).map((_, i) => 100 + i);
  const right = Array(30).fill(0).map((_, i) => 130 + i); // 30 deg offset

  const sym = computeBilateralSymmetry(left, right);
  assert.ok(sym !== null);
  assert.ok(sym < 0.8, `Expected symmetry to reflect limb discrepancy, got ${sym}`);
});
