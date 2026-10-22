"""MotionIQ Uncertainty Gate & Reliability Layer.

Implements calibrated reliability assessment, explicit model abstention,
and viewpoint-conditional form rule suppression.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Set
import numpy as np

from pipeline.view_classifier import ViewAssessment, ViewSuitability, ViewType


class AssessmentStatus(str, Enum):
    ASSESSABLE = "assessable"
    UNCERTAIN = "uncertain"
    UNASSESSABLE = "unassessable"


class AbstentionReason(str, Enum):
    NONE = "none"
    CRITICAL_JOINTS_OCCLUDED = "critical_joints_occluded"
    CAMERA_VIEW_INSUFFICIENT = "camera_view_insufficient"
    SUBJECT_TOO_FAR = "subject_too_far"
    TRACKING_UNSTABLE = "tracking_unstable"
    PARTIAL_BODY_FRAME = "partial_body_frame"


@dataclass
class ReliabilityReport:
    status: AssessmentStatus
    calibrated_confidence: float
    abstention_reason: AbstentionReason
    explanation: str
    suppressed_rules: List[str] = field(default_factory=list)
    joint_visibility_map: Dict[str, float] = field(default_factory=dict)


class UncertaintyGate:
    """Evaluates multi-factor tracking reliability and gates exercise assessment."""

    # Keypoint groupings by exercise
    EXERCISE_CRITICAL_JOINTS = {
        "squat": [11, 12, 23, 24, 25, 26, 27, 28],  # shoulders, hips, knees, ankles
        "pushup": [11, 12, 13, 14, 15, 16, 23, 24, 27, 28],  # arms, shoulders, hips, feet
        "bicep_curl": [11, 12, 13, 14, 15, 16],  # shoulders, elbows, wrists
        "alternate_bicep_curl": [11, 12, 13, 14, 15, 16],
    }

    # Rules that MUST be suppressed if camera viewpoint cannot observe them
    VIEW_CONDITIONAL_RULES = {
        "squat": {
            "knee_valgus": [ViewType.LATERAL_LEFT, ViewType.LATERAL_RIGHT],  # Can't see valgus from side!
            "squat_depth": [ViewType.FRONTAL],  # Depth is unreliable from pure front
        },
        "pushup": {
            "hip_sag": [ViewType.FRONTAL],  # Sagging spine is obscured head-on
            "elbow_flare": [ViewType.LATERAL_LEFT, ViewType.LATERAL_RIGHT],
        },
        "bicep_curl": {
            "elbow_drift": [ViewType.FRONTAL],  # Sagittal drift invisible frontally
        },
    }

    def __init__(
        self,
        visibility_threshold: float = 0.55,
        min_body_height: float = 0.20,
        abstention_threshold: float = 0.50,
    ):
        self.visibility_threshold = visibility_threshold
        self.min_body_height = min_body_height
        self.abstention_threshold = abstention_threshold

    def evaluate(
        self,
        landmarks: List[Dict[str, float]],
        exercise: Optional[str],
        view_assessment: ViewAssessment,
        kalman_uncertainty: float = 0.05,
    ) -> ReliabilityReport:
        """Evaluate landmarks and viewpoint to generate calibrated reliability assessment."""
        if len(landmarks) < 33:
            return ReliabilityReport(
                status=AssessmentStatus.UNASSESSABLE,
                calibrated_confidence=0.0,
                abstention_reason=AbstentionReason.PARTIAL_BODY_FRAME,
                explanation="Fewer than 33 pose landmarks detected.",
            )

        ex = (exercise or "").lower()
        critical_indices = self.EXERCISE_CRITICAL_JOINTS.get(ex, list(range(11, 29)))

        # 1. Check critical joint visibility
        vis_scores = [landmarks[i].get("visibility", 1.0) for i in critical_indices]
        mean_critical_vis = float(np.mean(vis_scores))
        min_critical_vis = float(np.min(vis_scores))

        # 2. Check subject bounding box scale
        ys = [landmarks[i]["y"] for i in range(11, 29)]
        body_height = max(ys) - min(ys)

        # 3. Check view suitability
        view_penalty = 0.0
        if view_assessment.suitability == ViewSuitability.SUBOPTIMAL:
            view_penalty = 0.35
        elif view_assessment.suitability == ViewSuitability.ACCEPTABLE:
            view_penalty = 0.10

        # 4. Compute calibrated confidence score (Sigmoid logistic combination)
        # Raw logit based on visibility, scale, tracking jitter, and view
        vis_logit = (mean_critical_vis - 0.6) * 4.0
        scale_logit = min(1.0, body_height / 0.40) * 2.0
        jitter_penalty = min(2.0, kalman_uncertainty * 10.0)

        raw_score = vis_logit + scale_logit - jitter_penalty - (view_penalty * 3.0)
        calibrated_conf = float(1.0 / (1.0 + np.exp(-raw_score)))
        calibrated_conf = max(0.01, min(0.99, calibrated_conf))

        # 5. Determine rules to suppress for current view
        suppressed: List[str] = []
        if ex in self.VIEW_CONDITIONAL_RULES:
            for rule_name, forbidden_views in self.VIEW_CONDITIONAL_RULES[ex].items():
                if view_assessment.view_type in forbidden_views:
                    suppressed.append(rule_name)

        # 6. Apply Abstention Decision Logic
        if min_critical_vis < 0.25 or mean_critical_vis < self.visibility_threshold:
            return ReliabilityReport(
                status=AssessmentStatus.UNASSESSABLE,
                calibrated_confidence=round(calibrated_conf * 0.5, 3),
                abstention_reason=AbstentionReason.CRITICAL_JOINTS_OCCLUDED,
                explanation=f"Critical joints for {ex} are occluded or out of frame (mean visibility: {mean_critical_vis:.2f}).",
                suppressed_rules=suppressed,
            )

        if body_height < self.min_body_height:
            return ReliabilityReport(
                status=AssessmentStatus.UNASSESSABLE,
                calibrated_confidence=round(calibrated_conf * 0.4, 3),
                abstention_reason=AbstentionReason.SUBJECT_TOO_FAR,
                explanation="You are positioned too far from the camera. Please step closer.",
                suppressed_rules=suppressed,
            )

        if view_assessment.suitability == ViewSuitability.SUBOPTIMAL:
            return ReliabilityReport(
                status=AssessmentStatus.UNCERTAIN,
                calibrated_confidence=round(calibrated_conf, 3),
                abstention_reason=AbstentionReason.CAMERA_VIEW_INSUFFICIENT,
                explanation=view_assessment.recommendation or "Camera angle is suboptimal for this exercise.",
                suppressed_rules=suppressed,
            )

        if calibrated_conf < self.abstention_threshold:
            return ReliabilityReport(
                status=AssessmentStatus.UNCERTAIN,
                calibrated_confidence=round(calibrated_conf, 3),
                abstention_reason=AbstentionReason.TRACKING_UNSTABLE,
                explanation="Movement or lighting is causing high tracking uncertainty. Repeat repetition steadily.",
                suppressed_rules=suppressed,
            )

        return ReliabilityReport(
            status=AssessmentStatus.ASSESSABLE,
            calibrated_confidence=round(calibrated_conf, 3),
            abstention_reason=AbstentionReason.NONE,
            explanation="Pose tracking and camera viewpoint are optimal for assessment.",
            suppressed_rules=suppressed,
        )
