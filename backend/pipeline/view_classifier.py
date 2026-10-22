"""MotionIQ Viewpoint Classifier.

Estimates the 3D orientation of the body relative to the camera in real-time
from 33 MediaPipe pose landmarks, and determines viewpoint suitability for
specific exercises.
"""

from dataclasses import dataclass
from enum import Enum
import math
from typing import Dict, List, Optional, Tuple
import numpy as np


class ViewType(str, Enum):
    FRONTAL = "frontal"
    LATERAL_LEFT = "lateral_left"
    LATERAL_RIGHT = "lateral_right"
    OBLIQUE = "oblique"
    UNKNOWN = "unknown"


class ViewSuitability(str, Enum):
    OPTIMAL = "optimal"
    ACCEPTABLE = "acceptable"
    SUBOPTIMAL = "suboptimal"


@dataclass
class ViewAssessment:
    view_type: ViewType
    yaw_angle_deg: float
    pitch_angle_deg: float
    suitability: ViewSuitability
    confidence: float
    recommendation: Optional[str] = None


class ViewClassifier:
    """Classifies camera-to-body perspective and evaluates exercise suitability."""

    # Landmark indices according to standard MediaPipe topology
    LEFT_SHOULDER = 11
    RIGHT_SHOULDER = 12
    LEFT_HIP = 23
    RIGHT_HIP = 24
    LEFT_KNEE = 25
    RIGHT_KNEE = 26
    LEFT_ANKLE = 27
    RIGHT_ANKLE = 28

    def __init__(self, smoothing_alpha: float = 0.3):
        self.alpha = smoothing_alpha
        self._smoothed_yaw: Optional[float] = None
        self._smoothed_pitch: Optional[float] = None

    def estimate_view(
        self,
        landmarks: List[Dict[str, float]],
        target_exercise: Optional[str] = None,
    ) -> ViewAssessment:
        """Estimate viewpoint angles and suitability for target exercise.

        landmarks: list of 33 dicts with keys 'x', 'y', 'z', and optional 'visibility'.
        target_exercise: e.g. 'squat', 'pushup', 'bicep_curl', 'yoga'.
        """
        if len(landmarks) < 33:
            return ViewAssessment(
                view_type=ViewType.UNKNOWN,
                yaw_angle_deg=0.0,
                pitch_angle_deg=0.0,
                suitability=ViewSuitability.SUBOPTIMAL,
                confidence=0.0,
                recommendation="Full body landmark topology required for viewpoint estimation.",
            )

        # Extract 3D coordinates for coronal anchor points
        ls = np.array([landmarks[self.LEFT_SHOULDER]["x"], landmarks[self.LEFT_SHOULDER]["y"], landmarks[self.LEFT_SHOULDER].get("z", 0.0)])
        rs = np.array([landmarks[self.RIGHT_SHOULDER]["x"], landmarks[self.RIGHT_SHOULDER]["y"], landmarks[self.RIGHT_SHOULDER].get("z", 0.0)])
        lh = np.array([landmarks[self.LEFT_HIP]["x"], landmarks[self.LEFT_HIP]["y"], landmarks[self.LEFT_HIP].get("z", 0.0)])
        rh = np.array([landmarks[self.RIGHT_HIP]["x"], landmarks[self.RIGHT_HIP]["y"], landmarks[self.RIGHT_HIP].get("z", 0.0)])

        # Shoulder horizontal axis (from right to left)
        shoulder_vec = ls - rs
        # Hip horizontal axis
        hip_vec = lh - rh

        # Check visibility
        vis_ls = landmarks[self.LEFT_SHOULDER].get("visibility", 1.0)
        vis_rs = landmarks[self.RIGHT_SHOULDER].get("visibility", 1.0)
        vis_lh = landmarks[self.LEFT_HIP].get("visibility", 1.0)
        vis_rh = landmarks[self.RIGHT_HIP].get("visibility", 1.0)
        mean_vis = float(np.mean([vis_ls, vis_rs, vis_lh, vis_rh]))

        # Calculate yaw from depth offset and lateral width
        # In MediaPipe, x is horizontal (0..1), z is depth roughly normalized to torso scale
        # Angle in the horizontal (X-Z) plane
        dx_shoulder = ls[0] - rs[0]
        dz_shoulder = ls[2] - rs[2]
        shoulder_yaw = math.degrees(math.atan2(dz_shoulder, max(abs(dx_shoulder), 1e-5)))

        dx_hip = lh[0] - rh[0]
        dz_hip = lh[2] - rh[2]
        hip_yaw = math.degrees(math.atan2(dz_hip, max(abs(dx_hip), 1e-5)))

        raw_yaw = float(0.6 * shoulder_yaw + 0.4 * hip_yaw)

        # Vertical axis for pitch
        mid_shoulder = (ls + rs) / 2.0
        mid_hip = (lh + rh) / 2.0
        spine_vec = mid_shoulder - mid_hip
        raw_pitch = float(math.degrees(math.atan2(spine_vec[2], max(abs(spine_vec[1]), 1e-5))))

        # Exponential moving average smoothing
        if self._smoothed_yaw is None:
            self._smoothed_yaw = raw_yaw
            self._smoothed_pitch = raw_pitch
        else:
            self._smoothed_yaw = self.alpha * raw_yaw + (1.0 - self.alpha) * self._smoothed_yaw
            self._smoothed_pitch = self.alpha * raw_pitch + (1.0 - self.alpha) * self._smoothed_pitch

        yaw = self._smoothed_yaw
        abs_yaw = abs(yaw)

        # Determine discrete category
        if abs_yaw <= 25.0:
            view_type = ViewType.FRONTAL
        elif abs_yaw >= 65.0:
            view_type = ViewType.LATERAL_LEFT if yaw > 0 else ViewType.LATERAL_RIGHT
        else:
            view_type = ViewType.OBLIQUE

        suitability, rec = self._evaluate_suitability(view_type, abs_yaw, target_exercise)

        return ViewAssessment(
            view_type=view_type,
            yaw_angle_deg=round(yaw, 1),
            pitch_angle_deg=round(self._smoothed_pitch, 1),
            suitability=suitability,
            confidence=round(min(1.0, max(0.0, mean_vis)), 2),
            recommendation=rec,
        )

    def _evaluate_suitability(
        self,
        view: ViewType,
        abs_yaw: float,
        exercise: Optional[str],
    ) -> Tuple[ViewSuitability, Optional[str]]:
        if not exercise:
            return ViewSuitability.ACCEPTABLE, None

        ex = exercise.lower()

        if "squat" in ex:
            # Squat depth and lumbar curvature require lateral view (~70-90 deg).
            # Knee valgus (cave-in) requires frontal view (~0-30 deg).
            if view in (ViewType.LATERAL_LEFT, ViewType.LATERAL_RIGHT):
                return ViewSuitability.OPTIMAL, "Lateral view active: Excellent for squat depth and hip tracking."
            elif view == ViewType.FRONTAL:
                return ViewSuitability.ACCEPTABLE, "Frontal view active: Good for knee symmetry, but rotate 90° for depth measurement."
            else:
                return ViewSuitability.ACCEPTABLE, "Oblique angle detected: Usable, but recommend 90° side-view for accurate depth."

        elif "pushup" in ex or "push_up" in ex:
            # Push-up requires lateral view to evaluate core plank / hip sag
            if view in (ViewType.LATERAL_LEFT, ViewType.LATERAL_RIGHT):
                return ViewSuitability.OPTIMAL, "Side view active: Ideal for push-up spine and elbow angle assessment."
            elif view == ViewType.FRONTAL:
                return ViewSuitability.SUBOPTIMAL, "Frontal view detected: Cannot accurately check hip sag or plank form. Please rotate side-on to camera."
            else:
                return ViewSuitability.ACCEPTABLE, "Oblique angle detected: Partial visibility of plank alignment."

        elif "curl" in ex:
            # Bicep curl elbow drift is best visible laterally
            if view in (ViewType.LATERAL_LEFT, ViewType.LATERAL_RIGHT):
                return ViewSuitability.OPTIMAL, "Side view active: Ideal for checking elbow swing and arm extension."
            elif view == ViewType.FRONTAL:
                return ViewSuitability.ACCEPTABLE, "Frontal view active: Suitable for rep counting and bilateral symmetry, but elbow swing needs side view."
            else:
                return ViewSuitability.ACCEPTABLE, "Oblique angle: Usable for curl assessment."

        return ViewSuitability.ACCEPTABLE, None

    def reset(self) -> None:
        self._smoothed_yaw = None
        self._smoothed_pitch = None
