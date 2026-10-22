"""Tests for Sports2D biomechanical kinematics adapter."""

import numpy as np
import pytest
from pathlib import Path
import sys

# Ensure research package is importable
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from research.adapters.sports2d_adapter import (
    butterworth_filter_trajectory,
    interpolate_missing_landmarks,
    compute_biomechanical_joint_angles,
    export_trc,
    export_mot,
)


def test_butterworth_filter_reduces_noise():
    # 60 frames, clean sine wave + random noise
    t = np.linspace(0, 2 * np.pi, 60)
    clean = np.sin(t)
    noise = np.random.normal(0, 0.1, 60)
    noisy = (clean + noise).reshape(60, 1, 1)

    filtered = butterworth_filter_trajectory(noisy, cutoff_freq=4.0, fs=30.0)
    assert filtered.shape == (60, 1, 1)
    # Filtered signal should be closer to clean than the noisy signal
    noise_err = np.mean((noisy.flatten() - clean) ** 2)
    filt_err = np.mean((filtered.flatten() - clean) ** 2)
    assert filt_err < noise_err


def test_interpolate_missing_landmarks():
    coords = np.ones((20, 33, 3))
    # Artificially set frames 5..7 to 0 (dropped frames)
    coords[5:8, 11, :] = 0.0

    interpolated = interpolate_missing_landmarks(coords, max_gap=5)
    # Middle dropped frame should now be restored to non-zero
    assert not np.allclose(interpolated[6, 11, :], 0.0)
    assert np.allclose(interpolated[6, 11, :], 1.0)


def test_compute_biomechanical_joint_angles():
    # Synthetic squat sequence with 30 frames
    landmarks = np.zeros((30, 33, 3))
    # Hip at (0, 0, 0), Knee at (0, -0.5, 0), Ankle at (0, -1.0, 0) -> Straight 180 degrees
    landmarks[:, 23] = [0.0, 0.0, 0.0]  # Left hip
    landmarks[:, 24] = [0.2, 0.0, 0.0]  # Right hip
    landmarks[:, 25] = [0.0, -0.5, 0.0]  # Left knee
    landmarks[:, 26] = [0.2, -0.5, 0.0]  # Right knee
    landmarks[:, 27] = [0.0, -1.0, 0.0]  # Left ankle
    landmarks[:, 28] = [0.2, -1.0, 0.0]  # Right ankle
    landmarks[:, 11] = [0.0, 0.6, 0.0]  # Left shoulder
    landmarks[:, 12] = [0.2, 0.6, 0.0]  # Right shoulder
    landmarks[:, 13] = [0.0, 0.3, 0.0]  # Left elbow
    landmarks[:, 14] = [0.2, 0.3, 0.0]  # Right elbow
    landmarks[:, 15] = [0.0, 0.0, 0.0]  # Left wrist
    landmarks[:, 16] = [0.2, 0.0, 0.0]  # Right wrist

    angles = compute_biomechanical_joint_angles(landmarks)
    assert "left_knee_flexion" in angles
    assert "right_knee_flexion" in angles
    assert "trunk_inclination" in angles
    assert np.isclose(angles["left_knee_flexion"][0], 180.0, atol=0.1)


def test_export_trc_and_mot(tmp_path):
    landmarks = np.random.rand(10, 33, 3)
    trc_file = tmp_path / "test.trc"
    export_trc(trc_file, landmarks, frame_rate=30.0)
    assert trc_file.exists()
    assert trc_file.stat().st_size > 500

    angles = {"knee_flex": np.linspace(170, 90, 10), "hip_flex": np.linspace(175, 100, 10)}
    mot_file = tmp_path / "test.mot"
    export_mot(mot_file, angles, frame_rate=30.0)
    assert mot_file.exists()
    assert mot_file.stat().st_size > 200
