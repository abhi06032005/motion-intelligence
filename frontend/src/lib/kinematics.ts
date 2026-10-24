/**
 * MotionIQ Biomechanical Kinematics & Smoothness Calculator
 *
 * Computes 3D joint angles, angular velocities, kinematic smoothness proxy,
 * and bilateral symmetry from MediaPipe NormalizedLandmark coordinates.
 *
 * All functions return null for invalid, degenerate, stationary or insufficient data
 * to guarantee scientific integrity and prevent fabricated measurements.
 */

import type { NormalizedLandmark } from "./mediapipe";

/**
 * Calculates the interior angle (in degrees) at joint vertex B formed by segments BA and BC.
 * Uses 3D Euclidean coordinates (x, y, z) consistent with MediaPipe pose coordinate space.
 *
 * Returns null if:
 * - Any landmark is missing, null, undefined, or contains non-finite/NaN coordinates
 * - Either segment has zero or degenerate length (< 1e-6)
 */
export function calculateJointAngle(
  a: NormalizedLandmark | null | undefined,
  b: NormalizedLandmark | null | undefined,
  c: NormalizedLandmark | null | undefined
): number | null {
  if (!a || !b || !c) return null;

  const ax = a.x;
  const ay = a.y;
  const az = a.z ?? 0;

  const bx = b.x;
  const by = b.y;
  const bz = b.z ?? 0;

  const cx = c.x;
  const cy = c.y;
  const cz = c.z ?? 0;

  if (
    !Number.isFinite(ax) || !Number.isFinite(ay) || !Number.isFinite(az) ||
    !Number.isFinite(bx) || !Number.isFinite(by) || !Number.isFinite(bz) ||
    !Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(cz)
  ) {
    return null;
  }

  // Vector BA = A - B
  const ba = {
    x: ax - bx,
    y: ay - by,
    z: az - bz,
  };

  // Vector BC = C - B (correctly subtracts vertex B from endpoint C in all 3 dimensions)
  const bc = {
    x: cx - bx,
    y: cy - by,
    z: cz - bz,
  };

  const magASq = ba.x * ba.x + ba.y * ba.y + ba.z * ba.z;
  const magBSq = bc.x * bc.x + bc.y * bc.y + bc.z * bc.z;

  // Degenerate zero-length vector check
  if (magASq < 1e-12 || magBSq < 1e-12) {
    return null;
  }

  const magA = Math.sqrt(magASq);
  const magB = Math.sqrt(magBSq);

  const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;
  const cosAngle = Math.max(-1.0, Math.min(1.0, dot / (magA * magB)));
  const angleRad = Math.acos(cosAngle);
  const angleDeg = (angleRad * 180) / Math.PI;

  return Math.round(angleDeg * 10) / 10;
}

/**
 * Computes a normalized kinematic smoothness proxy score based on third-derivative
 * angular jerk and velocity profile consistency.
 *
 * NOTE: This is a discrete kinematic jerk proxy for qualitative movement tracking.
 * It is NOT clinical Spectral Arc Length (SPARC) and must not be described as such.
 *
 * Returns null if:
 * - Trajectory has fewer than 15 valid frames
 * - Excursion range is < 15 degrees (stationary, no significant movement performed)
 * - Trajectory contains non-finite values
 */
export function computeKinematicSmoothness(
  angleTrajectory: number[] | null | undefined,
  fps = 30
): number | null {
  if (!angleTrajectory || angleTrajectory.length < 15) {
    return null;
  }

  // Ensure all values are finite
  for (let i = 0; i < angleTrajectory.length; i++) {
    if (!Number.isFinite(angleTrajectory[i])) {
      return null;
    }
  }

  const minAngle = Math.min(...angleTrajectory);
  const maxAngle = Math.max(...angleTrajectory);
  const excursion = maxAngle - minAngle;

  // Stationary trajectory threshold: minimum 15 degrees excursion required to evaluate movement
  if (excursion < 15.0) {
    return null;
  }

  const dt = 1 / Math.max(1, fps);
  const velocities: number[] = [];
  for (let i = 1; i < angleTrajectory.length; i++) {
    velocities.push((angleTrajectory[i] - angleTrajectory[i - 1]) / dt);
  }

  const accelerations: number[] = [];
  for (let i = 1; i < velocities.length; i++) {
    accelerations.push((velocities[i] - velocities[i - 1]) / dt);
  }

  const jerks: number[] = [];
  for (let i = 1; i < accelerations.length; i++) {
    jerks.push((accelerations[i] - accelerations[i - 1]) / dt);
  }

  if (jerks.length === 0) return null;

  const totalTime = angleTrajectory.length * dt;
  if (totalTime <= 0) return null;

  // Integrated squared jerk
  const integratedSquaredJerk = jerks.reduce((sum, j) => sum + j * j * dt, 0);

  // Dimensionless jerk normalized by duration and total angular excursion
  // NJ = sqrt(0.5 * int(j^2) * T^5 / D^2)
  const normalizedJerk = Math.sqrt(
    0.5 * integratedSquaredJerk * Math.pow(totalTime, 5) / (excursion * excursion)
  );

  if (!Number.isFinite(normalizedJerk)) return null;

  // Continuous monotonic mapping to [0.10, 0.98]
  // Harmonic sinusoidal movements yield NJ ≈ 10–60 (score ≈ 0.75–0.96)
  // Tremulous or jerky movements yield NJ > 250 (score < 0.40)
  const score = Math.max(0.1, Math.min(0.98, Math.exp(-normalizedJerk / 250)));

  return Math.round(score * 100) / 100;
}

/**
 * Computes bilateral symmetry ratio between left and right limb angles.
 * Returns a score between 0.0 and 1.0, or null if insufficient valid data or movement.
 */
export function computeBilateralSymmetry(
  leftAngles: number[] | null | undefined,
  rightAngles: number[] | null | undefined
): number | null {
  if (
    !leftAngles ||
    !rightAngles ||
    leftAngles.length < 15 ||
    leftAngles.length !== rightAngles.length
  ) {
    return null;
  }

  let totalDiff = 0;
  let leftValid = 0;

  for (let i = 0; i < leftAngles.length; i++) {
    const l = leftAngles[i];
    const r = rightAngles[i];
    if (!Number.isFinite(l) || !Number.isFinite(r)) return null;
    totalDiff += Math.abs(l - r);
    leftValid++;
  }

  if (leftValid < 15) return null;

  const leftRange = Math.max(...leftAngles) - Math.min(...leftAngles);
  const rightRange = Math.max(...rightAngles) - Math.min(...rightAngles);

  // Require meaningful movement on at least one side
  if (leftRange < 12 && rightRange < 12) {
    return null;
  }

  const meanDiff = totalDiff / leftValid;
  // Symmetry where 0 deg average difference = 1.0, and 60 deg difference = 0.33
  const symmetry = Math.max(0.0, Math.min(1.0, 1.0 - meanDiff / 90.0));
  return Math.round(symmetry * 100) / 100;
}
