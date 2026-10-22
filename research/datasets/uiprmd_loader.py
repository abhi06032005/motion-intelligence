"""UI-PRMD Authentic Vicon Motion Capture Ingestion and Virtual-Camera Projection.

Loads authentic Vicon 3D position recordings (100 Hz, 39 markers = 117 values/frame),
maps anatomical markers to MediaPipe 33-joint topology, and computes mathematically
rigorous virtual camera projections at 0° (frontal), 45° (oblique), and 90° (lateral).

Preserves original Subject IDs (s01-s10), trial IDs (e01-e10), and technique labels.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union
import numpy as np

# Directory holding downloaded authentic raw files
RAW_DIR = Path(__file__).resolve().parent.parent / "data" / "uiprmd" / "raw"

# Vicon Plug-in Gait (PiG) 39 Marker indices to MediaPipe 33 indices mapping
# Verified against UI-PRMD paper (Vakanski et al., Data 2018, 3, 2)
VICON_TO_MEDIAPIPE = {
    # Head / Face
    "NOSE": (0, 1),           # Midpoint of LFHD (0) and RFHD (1)
    "LEFT_EYE": 0,            # LFHD
    "RIGHT_EYE": 1,           # RFHD
    "LEFT_EAR": 2,            # LBHD
    "RIGHT_EAR": 3,           # RBHD
    # Torso / Upper Extremity
    "LEFT_SHOULDER": 9,       # LSHO
    "RIGHT_SHOULDER": 16,     # RSHO
    "LEFT_ELBOW": 11,         # LELB
    "RIGHT_ELBOW": 18,        # RELB
    "LEFT_WRIST": 13,         # LWRA
    "RIGHT_WRIST": 20,        # RWRA
    # Pelvis / Lower Extremity
    "LEFT_HIP": 23,           # LASI
    "RIGHT_HIP": 24,          # RASI
    "LEFT_KNEE": 28,          # LKNE
    "RIGHT_KNEE": 34,         # RKNE
    "LEFT_ANKLE": 30,         # LANK
    "RIGHT_ANKLE": 36,        # RANK
    "LEFT_HEEL": 31,          # LHEE
    "RIGHT_HEEL": 37,         # RHEE
    "LEFT_FOOT_INDEX": 32,    # LTOE
    "RIGHT_FOOT_INDEX": 38,   # RTOE
}


@dataclass
class AuthenticMovementTrial:
    subject_id: str
    trial_id: str
    movement_id: str
    protocol: str  # 'optimal' or 'non_optimal'
    raw_vicon_pts: np.ndarray  # (T, 39, 3) in mm
    frame_rate_hz: float = 100.0

    @property
    def num_frames(self) -> int:
        return self.raw_vicon_pts.shape[0]

    @property
    def duration_sec(self) -> float:
        return self.num_frames / self.frame_rate_hz

    def compute_ground_truth_biomechanics(self) -> Dict[str, float]:
        """Compute true 3D reference kinematics from pristine 3D Vicon markers."""
        pts = self.raw_vicon_pts

        # 3D Knee Flexion angles (degrees)
        # Left: Hip(23) - Knee(28) - Ankle(30)
        l_hip, l_knee, l_ankle = pts[:, 23], pts[:, 28], pts[:, 30]
        r_hip, r_knee, r_ankle = pts[:, 24], pts[:, 34], pts[:, 36]

        def angle_3pts(a, b, c):
            ba = a - b
            bc = c - b
            norm_ba = np.linalg.norm(ba, axis=-1, keepdims=True)
            norm_bc = np.linalg.norm(bc, axis=-1, keepdims=True)
            denom = np.maximum(norm_ba * norm_bc, 1e-6)
            cos_ang = np.sum(ba * bc, axis=-1, keepdims=True) / denom
            return np.degrees(np.arccos(np.clip(cos_ang, -1.0, 1.0))).flatten()

        l_knee_flex = angle_3pts(l_hip, l_knee, l_ankle)
        r_knee_flex = angle_3pts(r_hip, r_knee, r_ankle)
        min_knee_flex = float(np.min(0.5 * (l_knee_flex + r_knee_flex)))

        # 3D Knee Valgus Displacement:
        # In standing, inter-knee distance / inter-ankle distance ratio
        knee_dist = np.linalg.norm(l_knee - r_knee, axis=-1)
        ankle_dist = np.linalg.norm(l_ankle - r_ankle, axis=-1) + 1e-6
        knee_ankle_ratio = knee_dist / ankle_dist
        min_knee_ratio = float(np.min(knee_ankle_ratio))

        # True defect identification from 3D ground truth:
        has_valgus_defect = (min_knee_ratio < 0.72)
        has_shallow_defect = (min_knee_flex > 105.0)

        return {
            "min_knee_flexion_deg": round(min_knee_flex, 1),
            "min_knee_ankle_ratio": round(min_knee_ratio, 2),
            "true_has_valgus": has_valgus_defect,
            "true_has_shallow": has_shallow_defect,
            "protocol_is_optimal": (self.protocol == "optimal"),
        }

    def project_to_virtual_camera(
        self,
        yaw_deg: float = 0.0,
        target_fps: float = 30.0,
    ) -> List[List[Dict[str, float]]]:
        """Project 3D Vicon markers into a virtual camera view rotated by yaw_deg.

        Transforms millimeter coordinate space into MediaPipe-compatible normalized [0, 1]
        space with subsampling from 100 Hz to 30 Hz.

        Args:
            yaw_deg: Camera azimuth angle (0° = frontal, 45° = oblique, 90° = lateral profile).
            target_fps: Sampling rate for downstream vision pipeline.

        Returns:
            List of 33-landmark dictionaries per frame in MediaPipe format.
        """
        pts = self.raw_vicon_pts.copy()

        # Step 1: Temporal subsampling from 100Hz to 30Hz
        step = int(round(self.frame_rate_hz / target_fps))
        subsampled_pts = pts[::step]
        num_frames = subsampled_pts.shape[0]

        # Step 2: Center coordinate system at pelvis midpoint
        pelvis_mid = 0.5 * (subsampled_pts[:, 23, :] + subsampled_pts[:, 24, :])
        centered_pts = subsampled_pts - pelvis_mid[:, np.newaxis, :]

        # Step 3: Apply Azimuth Rotation Matrix R_y(yaw)
        # Vicon coordinates: X = anterior-posterior (depth), Y = medial-lateral, Z = vertical
        # In Camera frame: X_cam = lateral, Y_cam = vertical (downward), Z_cam = optical depth
        rad = math.radians(yaw_deg)
        cos_y, sin_y = math.cos(rad), math.sin(rad)

        rot_pts = np.zeros_like(centered_pts)
        for f in range(num_frames):
            for m in range(39):
                vx, vy, vz = centered_pts[f, m]
                rx = vx * cos_y - vy * sin_y
                ry = vx * sin_y + vy * cos_y
                rz = vz
                rot_pts[f, m] = [rx, ry, rz]

        # Step 4: Map into Camera Viewport Normalized Coordinates [0, 1]
        # Camera X: medial-lateral (scaled)
        # Camera Y: vertical inverted (MediaPipe origin is top-left, y=0 top, y=1 bottom)
        # Camera Z: optical depth relative to pelvis center
        # Unified metric scale: 2000mm body span fits into 0.80 of viewport height
        # Pelvis midpoint is positioned at (x=0.5, y=0.55) in camera viewport
        scale = 0.80 / 2000.0

        mp_to_vicon = {
            11: 9, 12: 16, 13: 11, 14: 18, 15: 13, 16: 20,
            23: 23, 24: 24, 25: 28, 26: 34, 27: 30, 28: 36,
            29: 31, 30: 37, 31: 32, 32: 38
        }

        mp_frames = []
        for f in range(num_frames):
            frame_lms = []
            for mp_idx in range(33):
                # Default coordinate if joint not directly mapped
                lm = {"x": 0.5, "y": 0.55, "z": 0.0, "visibility": 0.95}

                if mp_idx == 0:  # Nose: midpoint of LFHD (0) and RFHD (1)
                    p0 = rot_pts[f, 0]
                    p1 = rot_pts[f, 1]
                    p = 0.5 * (p0 + p1)
                    lm["x"] = float(np.clip(0.5 + p[1] * scale, 0.02, 0.98))
                    lm["y"] = float(np.clip(0.55 - p[2] * scale, 0.02, 0.98))
                    lm["z"] = float(p[0] * scale)
                elif mp_idx in mp_to_vicon:
                    v_idx = mp_to_vicon[mp_idx]
                    p = rot_pts[f, v_idx]
                    lm["x"] = float(np.clip(0.5 + p[1] * scale, 0.02, 0.98))
                    lm["y"] = float(np.clip(0.55 - p[2] * scale, 0.02, 0.98))
                    lm["z"] = float(p[0] * scale)
                elif mp_idx in [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]:  # Face
                    p = rot_pts[f, 0 if mp_idx % 2 == 1 else 1]
                    lm["x"] = float(np.clip(0.5 + p[1] * scale, 0.02, 0.98))
                    lm["y"] = float(np.clip(0.55 - p[2] * scale, 0.02, 0.98))
                    lm["z"] = float(p[0] * scale)
                elif mp_idx in [17, 19, 21]:  # Left hand fingers
                    p = rot_pts[f, 13]  # LWRA
                    lm["x"] = float(np.clip(0.5 + p[1] * scale, 0.02, 0.98))
                    lm["y"] = float(np.clip(0.55 - p[2] * scale, 0.02, 0.98))
                    lm["z"] = float(p[0] * scale)
                elif mp_idx in [18, 20, 22]:  # Right hand fingers
                    p = rot_pts[f, 20]  # RWRA
                    lm["x"] = float(np.clip(0.5 + p[1] * scale, 0.02, 0.98))
                    lm["y"] = float(np.clip(0.55 - p[2] * scale, 0.02, 0.98))
                    lm["z"] = float(p[0] * scale)

                # Simulated occlusion visibility attenuation for far limbs under rotation
                if abs(yaw_deg) > 60:
                    # Near lateral: far arm / far leg has lower visibility
                    if yaw_deg > 0 and mp_idx in [12, 14, 16, 24, 26, 28]:
                        lm["visibility"] = 0.40
                    elif yaw_deg < 0 and mp_idx in [11, 13, 15, 23, 25, 27]:
                        lm["visibility"] = 0.40
                elif abs(yaw_deg) > 30:
                    if yaw_deg > 0 and mp_idx in [12, 14, 16, 24, 26, 28]:
                        lm["visibility"] = 0.70
                    elif yaw_deg < 0 and mp_idx in [11, 13, 15, 23, 25, 27]:
                        lm["visibility"] = 0.70

                frame_lms.append(lm)
            mp_frames.append(frame_lms)

        return mp_frames


def load_all_uiprmd_squats() -> List[AuthenticMovementTrial]:
    """Load all 200 authentic UI-PRMD Deep Squat recordings from disk."""
    trials = []
    if not RAW_DIR.exists():
        raise FileNotFoundError(f"Raw directory not found: {RAW_DIR}")

    files = sorted(list(RAW_DIR.glob("m01_s*_e*_positions*.txt")))
    if not files:
        raise FileNotFoundError(f"No UI-PRMD files found in {RAW_DIR}. Run acquire_uiprmd.py first.")

    for p in files:
        # e.g., m01_s01_e01_positions.txt or m01_s01_e01_positions_inc.txt
        parts = p.stem.split("_")
        mov = parts[0]
        subj = f"Subject_{int(parts[1][1:]):02d}"
        trial = f"trial_{int(parts[2][1:]):02d}"
        protocol = "non_optimal" if "inc" in p.stem else "optimal"

        try:
            raw_data = np.loadtxt(p, delimiter=",").reshape(-1, 39, 3)
            trials.append(
                AuthenticMovementTrial(
                    subject_id=subj,
                    trial_id=trial,
                    movement_id=mov,
                    protocol=protocol,
                    raw_vicon_pts=raw_data,
                    frame_rate_hz=100.0,
                )
            )
        except Exception as e:
            print(f"Error loading {p.name}: {e}")

    return trials
