import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateJointAngle,
  computeKinematicSmoothness,
  computeBilateralSymmetry,
} from "../src/lib/kinematics.ts";

test("calculateJointAngle calculates 90 degrees correctly for planar orthogonal vectors", () => {
  const hip = { x: 0, y: 1, z: 0 };
  const knee = { x: 0, y: 0, z: 0 };
  const ankle = { x: 1, y: 0, z: 0 };

  const angle = calculateJointAngle(hip, knee, ankle);
  assert.equal(angle, 90);
});

test("calculateJointAngle calculates 180 degrees correctly for collinear extension", () => {
  const hip = { x: 0, y: 1, z: 0 };
  const knee = { x: 0, y: 0, z: 0 };
  const ankle = { x: 0, y: -1, z: 0 };

  const angle = calculateJointAngle(hip, knee, ankle);
  assert.equal(angle, 180);
});

test("calculateJointAngle incorporates 3D Z-coordinates correctly", () => {
  // Hip along Z axis, Ankle along X axis, Knee at origin
  const hip = { x: 0, y: 0, z: 1 };
  const knee = { x: 0, y: 0, z: 0 };
  const ankle = { x: 1, y: 0, z: 0 };

  const angle = calculateJointAngle(hip, knee, ankle);
  assert.equal(angle, 90);

  // 45-degree angle in X-Z plane:
  // Vector BA = (1, 0, 1), |BA| = sqrt(2)
  // Vector BC = (1, 0, 0), |BC| = 1
  // Dot product = 1
  // cos(theta) = 1 / sqrt(2) => theta = 45 deg
  const hip45 = { x: 1, y: 0, z: 1 };
  const ankle45 = { x: 1, y: 0, z: 0 };
  const angle45 = calculateJointAngle(hip45, knee, ankle45);
  assert.equal(angle45, 45);

  // If Z component of vector BC were erroneously computed as (cz - cz) == 0,
  // shifting vertex B along Z would fail. Verify with non-zero vertex B z-offset:
  const kneeOffset = { x: 0, y: 0, z: 0.5 };
  const hipOffset = { x: 0, y: 1, z: 0.5 }; // BA = (0, 1, 0)
  const ankleOffset = { x: 1, y: 0, z: 0.5 }; // BC = (1, 0, 0)
  const angleOffset = calculateJointAngle(hipOffset, kneeOffset, ankleOffset);
  assert.equal(angleOffset, 90);
});

test("calculateJointAngle returns null for missing or invalid landmarks", () => {
  const valid = { x: 0, y: 0, z: 0 };

  assert.equal(calculateJointAngle(null, valid, valid), null);
  assert.equal(calculateJointAngle(valid, undefined, valid), null);
  assert.equal(calculateJointAngle(valid, valid, null), null);

  const nanPoint = { x: NaN, y: 0, z: 0 };
  assert.equal(calculateJointAngle(nanPoint, valid, valid), null);

  const infPoint = { x: 0, y: Infinity, z: 0 };
  assert.equal(calculateJointAngle(valid, infPoint, valid), null);
});

test("calculateJointAngle returns null for degenerate zero-length vectors", () => {
  const origin = { x: 0, y: 0, z: 0 };
  const sameAsOrigin = { x: 0, y: 0, z: 0 };
  const point = { x: 1, y: 1, z: 1 };

  // BA has length 0
  assert.equal(calculateJointAngle(sameAsOrigin, origin, point), null);
  // BC has length 0
  assert.equal(calculateJointAngle(point, origin, sameAsOrigin), null);
});

test("computeKinematicSmoothness returns null for insufficient or stationary trajectories", () => {
  // Fewer than 15 frames
  assert.equal(computeKinematicSmoothness([90, 92, 94]), null);

  // Exactly stationary (0 excursion)
  const stationary = new Array(30).fill(90);
  assert.equal(computeKinematicSmoothness(stationary), null);

  // Small excursion (< 15 degrees threshold)
  const slightSway = Array.from({ length: 30 }, (_, i) => 90 + Math.sin(i / 5) * 4);
  assert.equal(computeKinematicSmoothness(slightSway), null);

  // Non-finite values
  const withNaN = Array.from({ length: 30 }, (_, i) => (i === 10 ? NaN : 90 + i));
  assert.equal(computeKinematicSmoothness(withNaN), null);
});

test("computeKinematicSmoothness evaluates genuine dynamic movement and distinguishes smooth vs jerky trajectories", () => {
  // Generate smooth sinusoidal knee flexion (60 deg to 120 deg, excursion = 60 deg)
  const smoothTrajectory: number[] = [];
  for (let i = 0; i < 60; i++) {
    smoothTrajectory.push(90 + 30 * Math.sin((i / 60) * 2 * Math.PI));
  }
  const smoothScore = computeKinematicSmoothness(smoothTrajectory, 30);
  assert.ok(smoothScore !== null, "Smooth trajectory should yield a valid numeric score");
  assert.ok(smoothScore >= 0.7, `Smooth score should be high (>= 0.7), got ${smoothScore}`);

  // Generate jerky trajectory with alternating high-frequency noise
  const jerkyTrajectory: number[] = [];
  for (let i = 0; i < 60; i++) {
    const base = 90 + 30 * Math.sin((i / 60) * 2 * Math.PI);
    const jerkNoise = (i % 2 === 0 ? 8 : -8);
    jerkyTrajectory.push(base + jerkNoise);
  }
  const jerkyScore = computeKinematicSmoothness(jerkyTrajectory, 30);
  assert.ok(jerkyScore !== null, "Jerky trajectory should yield a valid numeric score");
  assert.ok(
    jerkyScore < smoothScore,
    `Jerky score (${jerkyScore}) must be strictly lower than smooth score (${smoothScore})`
  );
});

test("computeBilateralSymmetry computes limb symmetry ratio honestly", () => {
  // Identical 60-frame trajectories => perfect symmetry 1.0
  const left: number[] = [];
  const right: number[] = [];
  for (let i = 0; i < 60; i++) {
    const angle = 90 + 35 * Math.sin((i / 60) * 2 * Math.PI);
    left.push(angle);
    right.push(angle);
  }
  const perfectSym = computeBilateralSymmetry(left, right);
  assert.equal(perfectSym, 1.0);

  // Asymmetric trajectory (right knee lags or has 20 deg offset)
  const asymmetricRight = left.map((a) => a + 20);
  const asymScore = computeBilateralSymmetry(left, asymmetricRight);
  assert.ok(asymScore !== null, "Asymmetric trajectory should return a score");
  assert.ok(asymScore < 1.0, "Asymmetric score must be less than 1.0");
  assert.ok(asymScore >= 0.5, "20 deg offset should still yield a moderate symmetry score");

  // Invalid cases: length mismatch or stationary
  assert.equal(computeBilateralSymmetry(left.slice(0, 20), right), null);
  assert.equal(computeBilateralSymmetry(new Array(30).fill(90), new Array(30).fill(90)), null);
});
