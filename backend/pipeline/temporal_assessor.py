"""MotionIQ Temporal Trajectory & Kinematic Assessment.

Extracts temporal features across sliding windows of pose sequences:
- Angular velocities and accelerations
- Movement smoothness (spectral arc length / jerk index)
- Bilateral symmetry index
- Phase pacing (eccentric vs concentric ratio)
"""

from collections import deque
from dataclasses import dataclass
from typing import Deque, Dict, List, Optional
import numpy as np


@dataclass
class TemporalKinematics:
    knee_angular_velocity_deg_s: float
    elbow_angular_velocity_deg_s: float
    hip_angular_velocity_deg_s: float
    smoothness_score: float  # [0.0 (jerky) .. 1.0 (smooth)]
    bilateral_symmetry_ratio: float  # [0.0 .. 1.0, 1.0 = perfect symmetry]
    eccentric_concentric_ratio: Optional[float] = None


class TemporalAssessor:
    """Computes continuous temporal derivatives and movement quality indicators."""

    def __init__(self, window_size: int = 30):
        self.window_size = window_size
        self._timestamps: Deque[float] = deque(maxlen=window_size)
        self._angles: Deque[Dict[str, float]] = deque(maxlen=window_size)
        self._phase_history: Deque[str] = deque(maxlen=window_size * 2)

    def update(
        self,
        timestamp: float,
        angles: Dict[str, float],
        current_phase: Optional[str] = None,
    ) -> TemporalKinematics:
        """Add current frame kinematics and compute rolling temporal metrics."""
        self._timestamps.append(timestamp)
        self._angles.append(angles)
        if current_phase:
            self._phase_history.append(current_phase)

        if len(self._timestamps) < 3:
            return TemporalKinematics(
                knee_angular_velocity_deg_s=0.0,
                elbow_angular_velocity_deg_s=0.0,
                hip_angular_velocity_deg_s=0.0,
                smoothness_score=1.0,
                bilateral_symmetry_ratio=1.0,
            )

        # Compute dt
        dt = (self._timestamps[-1] - self._timestamps[-2])
        dt = max(dt, 1e-4)  # prevent divide by zero

        # Velocity for primary joints
        curr_angles = self._angles[-1]
        prev_angles = self._angles[-2]

        def joint_vel(key: str) -> float:
            if key in curr_angles and key in prev_angles:
                return abs(curr_angles[key] - prev_angles[key]) / dt
            return 0.0

        knee_vel = max(joint_vel("left_knee"), joint_vel("right_knee"))
        elbow_vel = max(joint_vel("left_elbow"), joint_vel("right_elbow"))
        hip_vel = max(joint_vel("left_hip"), joint_vel("right_hip"))

        # Smoothness over recent window
        smoothness = self._calculate_smoothness()

        # Bilateral symmetry
        symmetry = self._calculate_symmetry(curr_angles)

        return TemporalKinematics(
            knee_angular_velocity_deg_s=round(knee_vel, 1),
            elbow_angular_velocity_deg_s=round(elbow_vel, 1),
            hip_angular_velocity_deg_s=round(hip_vel, 1),
            smoothness_score=round(smoothness, 2),
            bilateral_symmetry_ratio=round(symmetry, 2),
        )

    def _calculate_smoothness(self) -> float:
        """Approximate dimensionless jerk index mapped to [0, 1]."""
        if len(self._angles) < 5:
            return 1.0

        # Extract sequence for dominant joint (e.g., knee or elbow)
        keys = ["left_knee", "right_knee", "left_elbow", "right_elbow"]
        series = []
        for a in self._angles:
            val = next((a[k] for k in keys if k in a), None)
            if val is not None:
                series.append(val)

        if len(series) < 5:
            return 1.0

        diffs = np.diff(series)
        accels = np.diff(diffs)
        jerk = np.diff(accels)
        mean_jerk = float(np.mean(np.abs(jerk))) if len(jerk) > 0 else 0.0

        # Normalization: typical smooth movement has jerk < 5 deg/s^3
        smooth_score = 1.0 / (1.0 + mean_jerk / 8.0)
        return float(np.clip(smooth_score, 0.05, 1.0))

    def _calculate_symmetry(self, angles: Dict[str, float]) -> float:
        """Calculate bilateral angular concordance."""
        diffs = []
        pairs = [
            ("left_elbow", "right_elbow"),
            ("left_knee", "right_knee"),
            ("left_hip", "right_hip"),
        ]
        for l_key, r_key in pairs:
            if l_key in angles and r_key in angles:
                diff = abs(angles[l_key] - angles[r_key])
                diffs.append(diff)

        if not diffs:
            return 1.0

        mean_diff = float(np.mean(diffs))
        # 0 deg diff -> 1.0, 30 deg diff -> ~0.5
        symmetry = 1.0 / (1.0 + mean_diff / 15.0)
        return float(np.clip(symmetry, 0.0, 1.0))

    def reset(self) -> None:
        self._timestamps.clear()
        self._angles.clear()
        self._phase_history.clear()
