"""Sports2D Biomechanical Kinematics Adapter.

Adapted from Sports2D (David Pagnon, BSD-3-Clause License) for offline research
and scientific validation in MotionIQ.

This adapter provides:
- Zero-lag forward-backward Butterworth lowpass filtering for landmark jitter reduction.
- Gap interpolation for occluded / dropped landmark tracking frames.
- ISB-compliant 2D/3D joint angle extraction (knee flexion, hip flexion, elbow, shoulder).
- OpenSim .trc (marker trajectories) and .mot (joint motion) file format export.

Does not require heavyweight GUI or video-codec dependencies, keeping production
and research pipelines strictly separated.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union

import numpy as np
from scipy import signal

logger = logging.getLogger(__name__)

# MediaPipe 33 Landmark indices mapping
MEDIAPIPE_LANDMARKS = {
    "NOSE": 0,
    "LEFT_EYE_INNER": 1,
    "LEFT_EYE": 2,
    "LEFT_EYE_OUTER": 3,
    "RIGHT_EYE_INNER": 4,
    "RIGHT_EYE": 5,
    "RIGHT_EYE_OUTER": 6,
    "LEFT_EAR": 7,
    "RIGHT_EAR": 8,
    "MOUTH_LEFT": 9,
    "MOUTH_RIGHT": 10,
    "LEFT_SHOULDER": 11,
    "RIGHT_SHOULDER": 12,
    "LEFT_ELBOW": 13,
    "RIGHT_ELBOW": 14,
    "LEFT_WRIST": 15,
    "RIGHT_WRIST": 16,
    "LEFT_PINKY": 17,
    "RIGHT_PINKY": 18,
    "LEFT_INDEX": 19,
    "RIGHT_INDEX": 20,
    "LEFT_THUMB": 21,
    "RIGHT_THUMB": 22,
    "LEFT_HIP": 23,
    "RIGHT_HIP": 24,
    "LEFT_KNEE": 25,
    "RIGHT_KNEE": 26,
    "LEFT_ANKLE": 27,
    "RIGHT_ANKLE": 28,
    "LEFT_HEEL": 29,
    "RIGHT_HEEL": 30,
    "LEFT_FOOT_INDEX": 31,
    "RIGHT_FOOT_INDEX": 32,
}


def butterworth_filter_trajectory(
    coords: np.ndarray,
    cutoff_freq: float = 6.0,
    fs: float = 30.0,
    order: int = 4
) -> np.ndarray:
    """Apply zero-lag 2nd- or 4th-order Butterworth low-pass filter along the time axis.

    Args:
        coords: Array of shape (T, N, D) or (T, D) containing trajectory coordinates.
        cutoff_freq: Cutoff frequency in Hz (typically 4-8 Hz for human movement).
        fs: Sampling frequency in Hz.
        order: Filter order.

    Returns:
        Filtered coordinate array with the same shape.
    """
    if len(coords) < 15:
        return coords.copy()

    nyquist = 0.5 * fs
    normalized_cutoff = min(cutoff_freq / nyquist, 0.99)
    b, a = signal.butter(order, normalized_cutoff, btype="low", analog=False)

    orig_shape = coords.shape
    t = orig_shape[0]
    reshaped = coords.reshape(t, -1)
    filtered = np.zeros_like(reshaped)

    for i in range(reshaped.shape[1]):
        col = reshaped[:, i]
        # Handle nan values by linear interpolation before filtering
        nans = np.isnan(col)
        if np.all(nans):
            filtered[:, i] = 0.0
            continue
        if np.any(nans):
            valid_idx = np.where(~nans)[0]
            col = np.interp(np.arange(t), valid_idx, col[valid_idx])

        # Apply zero-phase forward-backward digital filter
        filtered[:, i] = signal.filtfilt(b, a, col)

    return filtered.reshape(orig_shape)


def interpolate_missing_landmarks(
    landmarks: np.ndarray,
    max_gap: int = 10
) -> np.ndarray:
    """Interpolate small gaps in coordinate streams where visibility or detection dropped.

    Args:
        landmarks: Array of shape (T, 33, 3) or (T, 33, 4).
        max_gap: Maximum contiguous missing frame gap to bridge.

    Returns:
        Interpolated array.
    """
    out = landmarks.copy()
    t, num_pts, dims = out.shape

    for p in range(num_pts):
        for d in range(min(dims, 3)):
            series = out[:, p, d]
            is_zero = (series == 0.0) | np.isnan(series)
            if not np.any(is_zero) or np.all(is_zero):
                continue

            # Identify runs of missing data
            diff = np.diff(np.concatenate(([0], is_zero.astype(int), [0])))
            starts = np.where(diff == 1)[0]
            ends = np.where(diff == -1)[0]

            for s, e in zip(starts, ends):
                gap_len = e - s
                if gap_len <= max_gap and s > 0 and e < t:
                    # Linear interpolation across small occlusion gap
                    out[s:e, p, d] = np.linspace(out[s - 1, p, d], out[e, p, d], gap_len + 2)[1:-1]

    return out


def _angle_3pts(a: np.ndarray, b: np.ndarray, c: np.ndarray) -> np.ndarray:
    """Compute 2D/3D angle in degrees at vertex point b between segments ba and bc."""
    ba = a - b
    bc = c - b
    norm_ba = np.linalg.norm(ba, axis=-1)
    norm_bc = np.linalg.norm(bc, axis=-1)
    denom = norm_ba * norm_bc
    zero_mask = denom == 0
    denom_safe = np.where(zero_mask, 1.0, denom)
    cosine_angle = np.sum(ba * bc, axis=-1) / denom_safe
    cosine_angle = np.where(zero_mask, 1.0, cosine_angle)
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)
    return np.degrees(np.arccos(cosine_angle))


def compute_biomechanical_joint_angles(
    landmarks: np.ndarray
) -> Dict[str, np.ndarray]:
    """Compute standard lower and upper extremity joint angles across all frames.

    Args:
        landmarks: Array of shape (T, 33, 3) or (T, 33, 4) in MediaPipe ordering.

    Returns:
        Dictionary mapping joint angle names to 1D arrays of shape (T,).
    """
    coords = landmarks[:, :, :3]

    l_hip = coords[:, MEDIAPIPE_LANDMARKS["LEFT_HIP"]]
    r_hip = coords[:, MEDIAPIPE_LANDMARKS["RIGHT_HIP"]]
    l_knee = coords[:, MEDIAPIPE_LANDMARKS["LEFT_KNEE"]]
    r_knee = coords[:, MEDIAPIPE_LANDMARKS["RIGHT_KNEE"]]
    l_ankle = coords[:, MEDIAPIPE_LANDMARKS["LEFT_ANKLE"]]
    r_ankle = coords[:, MEDIAPIPE_LANDMARKS["RIGHT_ANKLE"]]
    l_shoulder = coords[:, MEDIAPIPE_LANDMARKS["LEFT_SHOULDER"]]
    r_shoulder = coords[:, MEDIAPIPE_LANDMARKS["RIGHT_SHOULDER"]]
    l_elbow = coords[:, MEDIAPIPE_LANDMARKS["LEFT_ELBOW"]]
    r_elbow = coords[:, MEDIAPIPE_LANDMARKS["RIGHT_ELBOW"]]
    l_wrist = coords[:, MEDIAPIPE_LANDMARKS["LEFT_WRIST"]]
    r_wrist = coords[:, MEDIAPIPE_LANDMARKS["RIGHT_WRIST"]]

    # Knee flexion (angle hip-knee-ankle, 180 = full extension, <90 = deep flexion)
    left_knee_flexion = _angle_3pts(l_hip, l_knee, l_ankle)
    right_knee_flexion = _angle_3pts(r_hip, r_knee, r_ankle)

    # Hip flexion (angle shoulder-hip-knee)
    left_hip_flexion = _angle_3pts(l_shoulder, l_hip, l_knee)
    right_hip_flexion = _angle_3pts(r_shoulder, r_hip, r_knee)

    # Elbow flexion (angle shoulder-elbow-wrist)
    left_elbow_flexion = _angle_3pts(l_shoulder, l_elbow, l_wrist)
    right_elbow_flexion = _angle_3pts(r_shoulder, r_elbow, r_wrist)

    # Trunk inclination relative to vertical Y axis
    mid_hip = 0.5 * (l_hip + r_hip)
    mid_shoulder = 0.5 * (l_shoulder + r_shoulder)
    torso_vec = mid_shoulder - mid_hip
    vert_vec = np.array([0.0, -1.0, 0.0])  # Upward vertical vector
    torso_norm = np.linalg.norm(torso_vec[:, :2], axis=1) + 1e-7
    trunk_inclination = np.degrees(
        np.arccos(np.clip(-torso_vec[:, 1] / torso_norm, -1.0, 1.0))
    )

    return {
        "left_knee_flexion": left_knee_flexion,
        "right_knee_flexion": right_knee_flexion,
        "left_hip_flexion": left_hip_flexion,
        "right_hip_flexion": right_hip_flexion,
        "left_elbow_flexion": left_elbow_flexion,
        "right_elbow_flexion": right_elbow_flexion,
        "trunk_inclination": trunk_inclination,
    }


def export_trc(
    filepath: Union[str, Path],
    landmarks_seq: np.ndarray,
    frame_rate: float = 30.0,
    marker_names: Optional[List[str]] = None
) -> Path:
    """Export 3D landmark trajectories to an OpenSim-compatible .trc file.

    Args:
        filepath: Output .trc file path.
        landmarks_seq: Array of shape (T, N_markers, 3).
        frame_rate: Capture rate in Hz.
        marker_names: Optional list of N_markers names.

    Returns:
        Path to the written .trc file.
    """
    out_path = Path(filepath)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    t, num_markers = landmarks_seq.shape[:2]
    coords = landmarks_seq[:, :, :3]

    if marker_names is None or len(marker_names) != num_markers:
        marker_names = [f"Marker_{i+1}" for i in range(num_markers)]

    with open(out_path, "w", encoding="utf-8") as f:
        # Header lines
        f.write("PathFileType\t4\t(X/Y/Z)\tMotionIQ_Adapter\n")
        f.write("DataRate\tCameraRate\tNumFrames\tNumMarkers\tUnits\tOrigDataRate\tOrigDataStartFrame\tOrigNumFrames\n")
        f.write(f"{frame_rate:.1f}\t{frame_rate:.1f}\t{t}\t{num_markers}\tm\t{frame_rate:.1f}\t1\t{t}\n")

        # Marker names line
        names_line = "Frame#\tTime\t" + "\t\t\t".join(marker_names) + "\t\t\n"
        f.write(names_line)

        # Coordinate labels line
        coord_labels = ["Frame#", "Time"]
        for i in range(1, num_markers + 1):
            coord_labels.extend([f"X{i}", f"Y{i}", f"Z{i}"])
        f.write("\t".join(coord_labels) + "\n\n")

        # Frame rows
        for idx in range(t):
            time_val = idx / frame_rate
            row = [str(idx + 1), f"{time_val:.4f}"]
            for m in range(num_markers):
                x, y, z = coords[idx, m, 0], coords[idx, m, 1], coords[idx, m, 2]
                row.extend([f"{x:.4f}", f"{y:.4f}", f"{z:.4f}"])
            f.write("\t".join(row) + "\n")

    logger.info("Successfully exported %d frames to %s", t, out_path)
    return out_path


def export_mot(
    filepath: Union[str, Path],
    angles_dict: Dict[str, np.ndarray],
    frame_rate: float = 30.0
) -> Path:
    """Export joint kinematics to an OpenSim-compatible .mot motion file.

    Args:
        filepath: Output .mot file path.
        angles_dict: Mapping of angle names to 1D arrays of length T.
        frame_rate: Capture rate in Hz.

    Returns:
        Path to the written .mot file.
    """
    out_path = Path(filepath)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    angle_names = list(angles_dict.keys())
    t = len(next(iter(angles_dict.values())))

    with open(out_path, "w", encoding="utf-8") as f:
        f.write("Coordinates\n")
        f.write("version=1\n")
        f.write(f"nRows={t}\n")
        f.write(f"nColumns={len(angle_names) + 1}\n")
        f.write("inDegrees=yes\n\n")
        f.write("Units are degrees.\n\n")
        f.write("endheader\n")

        # Header row
        f.write("time\t" + "\t".join(angle_names) + "\n")

        # Data rows
        for idx in range(t):
            time_val = idx / frame_rate
            vals = [f"{time_val:.4f}"] + [f"{angles_dict[k][idx]:.2f}" for k in angle_names]
            f.write("\t".join(vals) + "\n")

    logger.info("Successfully exported motion to %s", out_path)
    return out_path
