"use client";

import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

// Pinned WASM binary version to prevent breaking changes from unversioned CDN builds
const MEDIAPIPE_WASM_PATH =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.1.1/wasm";

const MODEL_ASSET_PATH =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

let poseLandmarkerInstance: PoseLandmarker | null = null;
let initializationPromise: Promise<PoseLandmarker> | null = null;

export async function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (poseLandmarkerInstance) {
    return poseLandmarkerInstance;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    let vision;
    try {
      vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_PATH);
    } catch (err) {
      console.warn("Failed to load MediaPipe vision WASM fileset from primary CDN, retrying with fallback:", err);
      // Fallback in case of network glitch
      vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
      );
    }

    // Attempt 1: Fast WebGL GPU delegate
    try {
      poseLandmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_ASSET_PATH,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      return poseLandmarkerInstance;
    } catch (gpuErr) {
      console.warn("MediaPipe GPU delegate initialization failed, falling back to CPU delegate:", gpuErr);

      // Attempt 2: CPU WebAssembly fallback
      try {
        poseLandmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_ASSET_PATH,
            delegate: "CPU",
          },
          runningMode: "VIDEO",
          numPoses: 1,
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        return poseLandmarkerInstance;
      } catch (cpuErr) {
        // Reset initialization promise so user can retry on next button click
        initializationPromise = null;
        poseLandmarkerInstance = null;
        console.error("Both GPU and CPU MediaPipe PoseLandmarker initialization failed:", cpuErr);
        throw new Error(
          "Could not initialize pose estimation engine. Please check your internet connection or browser WebGL/WASM support."
        );
      }
    }
  })();

  return initializationPromise;
}

/**
 * Resets the cached landmarker instance (useful for clean tear-down or testing).
 */
export function resetPoseLandmarker(): void {
  if (poseLandmarkerInstance) {
    try {
      poseLandmarkerInstance.close();
    } catch {}
    poseLandmarkerInstance = null;
  }
  initializationPromise = null;
}

export type NormalizedLandmark = {
  x: number;
  y: number;
  z: number;
  visibility?: number;
};
