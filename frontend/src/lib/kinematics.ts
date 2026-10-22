/**
 * MotionIQ Biomechanical Kinematics & Smoothness Calculator
 *
 * Computes genuine joint angles, angular velocities, kinematic smoothness,
 * and bilateral symmetry without fabricating metrics.
 */

import { NormalizedLandmark } from "./mediapipe";

/**
 * Calculates the interior angle (in degrees) at joint vertex B formed by segments BA and BC.
 */
export function calculateJointAngle(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark
): number {
  const ba = { x: a.x - b.x, y: a.y - b.y, z: (a.z ?? 0) - (b.z ?? 0) };
  const bc = { x: c.x - b.x, y: c.y - b.y, z: (c.z ?? 0) - (c.z ?? 0) };

  const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;
  const magA = Math.sqrt(ba.x * ba.x + ba.y * ba.y + ba.z * ba.z);
  const magB = Math.sqrt(bc.x * bc.x + bc.y * bc.y + bc.z * bc.z);

  if (magA === 0 || magB === 0) return 180;
  const cosAngle = Math.max(-1, Math.min(1, dot / (magA * magB)));
  return (Math.acos(cosAngle) * 180) / Math.PI;
}

/**
 * Computes the kinematic smoothness score for a joint angular trajectory.
 * Based on dimensionless jerk and angular velocity profile consistency.
 *
 * Returns null if the trajectory is too short (< 15 frames) or if the movement
 * amplitude is negligible (stationary / no rep performed), so the UI can honestly
 * display "Not available".
 */
export function computeKinematicSmoothness(
  angleTrajectory: number[],
  fps = 30
): number | null {
  if (!angleTrajectory || angleTrajectory.length < 15) {
    return null;
  }

  // Check movement range
  const minAngle = Math.min(...angleTrajectory);
  const maxAngle = Math.max(...angleTrajectory);
  const range = maxAngle - minAngle;

  // If movement range is minimal (< 12 degrees), no significant movement occurred
  if (range < 12) {
    return null;
  }

  const dt = 1 / fps;
  const velocities: number[] = [];
  for (let i = 1; i < angleTrajectory.length; i++) {
    velocities.push((angleTrajectory[i] - angleTrajectory[i - 1]) / dt);
  }

  const accelerations: number[] = [];
  for (let i = 1; i < velocities.length; i++) {
    accelerations.push((velocities[i] - velocities[i - 1]) / dt);
  }

  if (accelerations.length === 0) return null;

  // Mean absolute velocity and acceleration variance
  const meanAbsVelocity =
    velocities.reduce((sum, v) => sum + Math.abs(v), 0) / velocities.length;

  const meanAcc =
    accelerations.reduce((sum, a) => sum + a, 0) / accelerations.length;
  const varianceAcc =
    accelerations.reduce((sum, a) => sum + Math.pow(a - meanAcc, 2), 0) /
    accelerations.length;
  const stdAcc = Math.sqrt(varianceAcc);

  if (meanAbsVelocity <= 1e-3) return null;

  // Dimensionless jerk-based normalized smoothness: high jerk relative to speed -> low score
  const jerkRatio = stdAcc / (meanAbsVelocity * 10 + 1);
  const score = Math.max(0.1, Math.min(0.99, Math.exp(-0.04 * jerkRatio)));

  return Math.round(score * 100) / 100;
}

/**
 * Computes bilateral symmetry ratio between left and right limb angles.
 * Returns a score between 0.0 and 1.0, or null if insufficient valid data.
 */
export function computeBilateralSymmetry(
  leftAngles: number[],
  rightAngles: number[]
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
  for (let i = 0; i < leftAngles.length; i++) {
    totalDiff += Math.abs(leftAngles[i] - rightAngles[i]);
  }

  const meanDiff = totalDiff / leftAngles.length;
  // Normalized symmetry where 0 deg mean difference = 1.0, 45 deg difference = 0.5
  const symmetry = Math.max(0, Math.min(1, 1 - meanDiff / 90));
  return Math.round(symmetry * 100) / 100;
}
