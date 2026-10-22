"""Canonical Movement Sequence Schema for MotionIQ.

Enforces uniform schema across UI-PRMD, UL-RED, RepCount, and live MediaPipe streams.
"""

from dataclasses import dataclass, field
import hashlib
import json
from typing import Any, Dict, List, Optional, Tuple
import numpy as np


@dataclass
class CanonicalMovementSequence:
    dataset_id: str
    subject_id: str
    session_id: str
    exercise_label: str
    movement_protocol: str  # "optimal" | "non_optimal" | "unlabeled"
    timestamps_sec: List[float]
    joint_coords_3d: np.ndarray  # Shape: (T, 33, 3)
    joint_visibility: np.ndarray  # Shape: (T, 33)
    coordinate_system: str  # "camera_relative" | "hip_centered_metric"
    camera_view: str  # "frontal" | "lateral" | "oblique" | "unknown"
    repetition_boundaries: List[Tuple[int, int]] = field(default_factory=list)
    movement_quality_score: Optional[float] = None
    provenance_hash: str = ""

    def validate(self) -> bool:
        """Validate tensor shapes and temporal monotonicity."""
        T = len(self.timestamps_sec)
        if self.joint_coords_3d.shape[0] != T or self.joint_coords_3d.shape[1] != 33:
            return False
        if self.joint_visibility.shape[0] != T or self.joint_visibility.shape[1] != 33:
            return False
        # Check monotonic timestamps
        if T > 1 and any(np.diff(self.timestamps_sec) <= 0):
            return False
        return True

    def compute_provenance_hash(self) -> str:
        data_str = f"{self.dataset_id}:{self.subject_id}:{self.session_id}:{self.exercise_label}:{len(self.timestamps_sec)}"
        self.provenance_hash = hashlib.sha256(data_str.encode("utf-8")).hexdigest()
        return self.provenance_hash

    def to_mediapipe_stream(self) -> List[List[Dict[str, float]]]:
        """Convert to standard MediaPipe landmark list of dicts for pipeline evaluation."""
        stream = []
        T = len(self.timestamps_sec)
        for t in range(T):
            frame_lms = []
            for j in range(33):
                frame_lms.append({
                    "x": float(self.joint_coords_3d[t, j, 0]),
                    "y": float(self.joint_coords_3d[t, j, 1]),
                    "z": float(self.joint_coords_3d[t, j, 2]),
                    "visibility": float(self.joint_visibility[t, j]),
                })
            stream.append(frame_lms)
        return stream
