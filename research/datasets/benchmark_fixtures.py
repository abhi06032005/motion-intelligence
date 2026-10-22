"""Synthetic landmark fixtures, with no human recordings or dataset ingestion.

Historical dataset tags ending in MOCK are misleading names, not provenance.
Subjects repeat identical coordinates across all splits. Useful for smoke tests only.
"""

import math
from typing import Dict, List, Tuple
import numpy as np

from research.datasets.canonical_schema import CanonicalMovementSequence


def generate_benchmark_suite() -> Dict[str, List[CanonicalMovementSequence]]:
    """Generates complete multi-subject benchmark dataset."""
    splits = {
        "train": [],
        "val": [],
        "test": [],
    }

    # 10 subjects: 1-6 Train, 7-8 Val, 9-10 Test
    for sub_id in range(1, 11):
        sub_str = f"Subject_{sub_id:02d}"
        target_split = "train" if sub_id <= 6 else ("val" if sub_id <= 8 else "test")

        # 1. Optimal Squat (Lateral View)
        splits[target_split].append(
            _create_squat_sequence(
                sub_str,
                "trial_01_optimal_lateral",
                view_yaw_deg=80.0,
                defect=None,
                reps=3,
                fps=30.0,
            )
        )

        # 2. Non-optimal Squat: Knee Valgus (Frontal View)
        splits[target_split].append(
            _create_squat_sequence(
                sub_str,
                "trial_02_valgus_frontal",
                view_yaw_deg=10.0,
                defect="knee_valgus",
                reps=3,
                fps=30.0,
            )
        )

        # 3. Non-optimal Squat: Shallow Depth (Lateral View)
        splits[target_split].append(
            _create_squat_sequence(
                sub_str,
                "trial_03_shallow_lateral",
                view_yaw_deg=85.0,
                defect="shallow_depth",
                reps=3,
                fps=30.0,
            )
        )

        # 4. Push-up: Lateral View (Optimal)
        splits[target_split].append(
            _create_pushup_sequence(
                sub_str,
                "trial_04_pushup_lateral",
                view_yaw_deg=90.0,
                defect=None,
                reps=4,
                fps=30.0,
            )
        )

        # 5. Push-up: Lateral View (Hip Sag defect)
        splits[target_split].append(
            _create_pushup_sequence(
                sub_str,
                "trial_05_pushup_hipsag",
                view_yaw_deg=85.0,
                defect="hip_sag",
                reps=3,
                fps=30.0,
            )
        )

        # 6. Bicep Curl: Standard (Optimal vs Elbow Drift)
        splits[target_split].append(
            _create_curl_sequence(
                sub_str,
                "trial_06_curl_optimal",
                view_yaw_deg=75.0,
                defect=None,
                reps=4,
                fps=30.0,
            )
        )

        # 7. Stress Test: Frontal Squat (Ambiguous Depth)
        splits[target_split].append(
            _create_squat_sequence(
                sub_str,
                "trial_07_squat_frontal_ambiguous",
                view_yaw_deg=0.0,
                defect="shallow_depth",
                reps=3,
                fps=30.0,
            )
        )

        # 8. Stress Test: Occluded Knee / Lower Body (Unassessable)
        splits[target_split].append(
            _create_occluded_squat_sequence(
                sub_str,
                "trial_08_squat_occluded",
                reps=2,
                fps=30.0,
            )
        )

    return splits


def _create_squat_sequence(
    subject_id: str,
    session_id: str,
    view_yaw_deg: float,
    defect: str | None,
    reps: int = 3,
    fps: float = 30.0,
) -> CanonicalMovementSequence:
    rep_len = int(fps * 2.5)  # 2.5s per rep
    total_frames = rep_len * reps + int(fps * 1.0)
    timestamps = [i / fps for i in range(total_frames)]

    coords = np.zeros((total_frames, 33, 3), dtype=np.float32)
    vis = np.ones((total_frames, 33), dtype=np.float32)

    # Base standing posture
    # Hips at y=0.55, Knees at y=0.75, Ankles at y=0.95
    # Shoulders at y=0.30, Head at y=0.15
    yaw_rad = math.radians(view_yaw_deg)
    cos_y = math.cos(yaw_rad)
    sin_y = math.sin(yaw_rad)

    boundaries = []

    for r in range(reps):
        start_f = int(fps * 0.5) + r * rep_len
        end_f = start_f + rep_len
        boundaries.append((start_f, end_f))

    for f in range(total_frames):
        # Calculate squat progression [0.0 standing .. 1.0 bottom of squat]
        prog = 0.0
        for start_f, end_f in boundaries:
            if start_f <= f <= end_f:
                phase = (f - start_f) / (end_f - start_f)
                prog = math.sin(phase * math.pi)  # 0 -> 1 -> 0

        # Adjust depth if defect
        if defect == "shallow_depth":
            prog *= 0.45  # Doesn't reach parallel

        hip_y = 0.55 + prog * 0.20
        knee_y = 0.75 + prog * 0.05
        shoulder_y = 0.30 + prog * 0.18

        # Left & right joint lateral offset
        w_shoulder = 0.12
        w_hip = 0.10
        w_knee = 0.10 if defect != "knee_valgus" else (0.10 - prog * 0.06)

        # 3D rotated coordinates
        # Nose
        coords[f, 0] = [0.5, 0.15, 0.0]

        # Shoulders (11=L, 12=R)
        coords[f, 11] = [0.5 + w_shoulder * cos_y, shoulder_y, w_shoulder * sin_y]
        coords[f, 12] = [0.5 - w_shoulder * cos_y, shoulder_y, -w_shoulder * sin_y]

        # Hips (23=L, 24=R)
        coords[f, 23] = [0.5 + w_hip * cos_y, hip_y, w_hip * sin_y]
        coords[f, 24] = [0.5 - w_hip * cos_y, hip_y, -w_hip * sin_y]

        # Knees (25=L, 26=R)
        coords[f, 25] = [0.5 + w_knee * cos_y, knee_y, w_knee * sin_y + prog * 0.12]
        coords[f, 26] = [0.5 - w_knee * cos_y, knee_y, -w_knee * sin_y + prog * 0.12]

        # Ankles (27=L, 28=R)
        coords[f, 27] = [0.5 + 0.10 * cos_y, 0.95, 0.10 * sin_y]
        coords[f, 28] = [0.5 - 0.10 * cos_y, 0.95, -0.10 * sin_y]

        # Elbows & Wrists (arms held in front)
        coords[f, 13] = [0.5 + 0.14 * cos_y, shoulder_y + 0.10, 0.15]
        coords[f, 14] = [0.5 - 0.14 * cos_y, shoulder_y + 0.10, 0.15]
        coords[f, 15] = [0.5 + 0.08 * cos_y, shoulder_y + 0.05, 0.25]
        coords[f, 16] = [0.5 - 0.08 * cos_y, shoulder_y + 0.05, 0.25]

    view_str = "lateral" if abs(view_yaw_deg) > 60 else ("frontal" if abs(view_yaw_deg) < 30 else "oblique")

    seq = CanonicalMovementSequence(
        dataset_id="UI-PRMD-MOCK",
        subject_id=subject_id,
        session_id=session_id,
        exercise_label="squat",
        movement_protocol="optimal" if defect is None else f"non_optimal_{defect}",
        timestamps_sec=timestamps,
        joint_coords_3d=coords,
        joint_visibility=vis,
        coordinate_system="camera_relative",
        camera_view=view_str,
        repetition_boundaries=boundaries,
        movement_quality_score=1.0 if defect is None else 0.4,
    )
    seq.compute_provenance_hash()
    return seq


def _create_pushup_sequence(
    subject_id: str,
    session_id: str,
    view_yaw_deg: float,
    defect: str | None,
    reps: int = 4,
    fps: float = 30.0,
) -> CanonicalMovementSequence:
    rep_len = int(fps * 2.0)
    total_frames = rep_len * reps + int(fps * 1.0)
    timestamps = [i / fps for i in range(total_frames)]
    coords = np.zeros((total_frames, 33, 3), dtype=np.float32)
    vis = np.ones((total_frames, 33), dtype=np.float32)

    boundaries = []
    for r in range(reps):
        start_f = int(fps * 0.5) + r * rep_len
        end_f = start_f + rep_len
        boundaries.append((start_f, end_f))

    for f in range(total_frames):
        prog = 0.0
        for start_f, end_f in boundaries:
            if start_f <= f <= end_f:
                phase = (f - start_f) / (end_f - start_f)
                prog = math.sin(phase * math.pi)

        # Horizontal prone position: Head at x=0.2, Feet at x=0.8, y around 0.70
        chest_y = 0.60 + prog * 0.15
        hip_y = 0.62 + (prog * 0.12 if defect != "hip_sag" else prog * 0.25)
        ankle_y = 0.65

        coords[f, 0] = [0.20, chest_y - 0.05, 0.0]  # Nose
        coords[f, 11] = [0.28, chest_y, 0.10]
        coords[f, 12] = [0.28, chest_y, -0.10]
        coords[f, 23] = [0.55, hip_y, 0.08]
        coords[f, 24] = [0.55, hip_y, -0.08]
        coords[f, 25] = [0.68, hip_y + 0.02, 0.08]
        coords[f, 26] = [0.68, hip_y + 0.02, -0.08]
        coords[f, 27] = [0.82, ankle_y, 0.07]
        coords[f, 28] = [0.82, ankle_y, -0.07]
        coords[f, 13] = [0.28, chest_y + 0.08, 0.15]
        coords[f, 14] = [0.28, chest_y + 0.08, -0.15]
        coords[f, 15] = [0.28, 0.80, 0.15]  # Hands on floor
        coords[f, 16] = [0.28, 0.80, -0.15]

    seq = CanonicalMovementSequence(
        dataset_id="RepCount-MOCK",
        subject_id=subject_id,
        session_id=session_id,
        exercise_label="pushup",
        movement_protocol="optimal" if defect is None else f"non_optimal_{defect}",
        timestamps_sec=timestamps,
        joint_coords_3d=coords,
        joint_visibility=vis,
        coordinate_system="camera_relative",
        camera_view="lateral",
        repetition_boundaries=boundaries,
        movement_quality_score=1.0 if defect is None else 0.5,
    )
    seq.compute_provenance_hash()
    return seq


def _create_curl_sequence(
    subject_id: str,
    session_id: str,
    view_yaw_deg: float,
    defect: str | None,
    reps: int = 4,
    fps: float = 30.0,
) -> CanonicalMovementSequence:
    rep_len = int(fps * 2.2)
    total_frames = rep_len * reps + int(fps * 1.0)
    timestamps = [i / fps for i in range(total_frames)]
    coords = np.zeros((total_frames, 33, 3), dtype=np.float32)
    vis = np.ones((total_frames, 33), dtype=np.float32)

    boundaries = []
    for r in range(reps):
        start_f = int(fps * 0.5) + r * rep_len
        end_f = start_f + rep_len
        boundaries.append((start_f, end_f))

    for f in range(total_frames):
        prog = 0.0
        for start_f, end_f in boundaries:
            if start_f <= f <= end_f:
                phase = (f - start_f) / (end_f - start_f)
                prog = math.sin(phase * math.pi)

        # Standing upright
        coords[f, 0] = [0.5, 0.15, 0.0]
        coords[f, 11] = [0.60, 0.30, 0.0]
        coords[f, 12] = [0.40, 0.30, 0.0]
        coords[f, 23] = [0.58, 0.55, 0.0]
        coords[f, 24] = [0.42, 0.55, 0.0]
        coords[f, 25] = [0.58, 0.75, 0.0]
        coords[f, 26] = [0.42, 0.75, 0.0]
        coords[f, 27] = [0.58, 0.95, 0.0]
        coords[f, 28] = [0.42, 0.95, 0.0]

        # Elbows & Wrists
        elbow_drift = 0.08 * prog if defect == "elbow_drift" else 0.0
        coords[f, 13] = [0.62, 0.45 + elbow_drift, 0.0]
        coords[f, 14] = [0.38, 0.45 + elbow_drift, 0.0]

        wrist_y = 0.62 - prog * 0.28
        coords[f, 15] = [0.62, wrist_y, 0.12 * prog]
        coords[f, 16] = [0.38, wrist_y, 0.12 * prog]

    seq = CanonicalMovementSequence(
        dataset_id="UI-PRMD-MOCK",
        subject_id=subject_id,
        session_id=session_id,
        exercise_label="bicep_curl",
        movement_protocol="optimal" if defect is None else f"non_optimal_{defect}",
        timestamps_sec=timestamps,
        joint_coords_3d=coords,
        joint_visibility=vis,
        coordinate_system="camera_relative",
        camera_view="lateral",
        repetition_boundaries=boundaries,
        movement_quality_score=1.0 if defect is None else 0.5,
    )
    seq.compute_provenance_hash()
    return seq


def _create_occluded_squat_sequence(
    subject_id: str,
    session_id: str,
    reps: int = 2,
    fps: float = 30.0,
) -> CanonicalMovementSequence:
    seq = _create_squat_sequence(subject_id, session_id, view_yaw_deg=80.0, defect=None, reps=reps, fps=fps)
    # Mask knees and ankles to simulate low visibility / camera cut-off
    seq.joint_visibility[:, [25, 26, 27, 28]] = 0.15
    seq.movement_protocol = "occluded_stress"
    seq.compute_provenance_hash()
    return seq
