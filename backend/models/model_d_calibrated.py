"""Model D: View-Aware & Uncertainty-Aware Calibrated Temporal Model.

MotionIQ's full proposed architecture:
Combines temporal trajectory assessment, 3D viewpoint classification,
rule suppression for inappropriate views, calibrated confidence scoring,
and explicit abstention under uncertainty.
"""

from typing import Any, Dict, List, Optional
import numpy as np

from models.model_interface import AssessmentResult, AssessmentStatus, MovementAssessor
from pipeline.view_classifier import ViewClassifier, ViewSuitability
from pipeline.uncertainty_gate import UncertaintyGate, AbstentionReason
from pipeline.temporal_assessor import TemporalAssessor
from pipeline.features import FeatureExtractor
from pipeline.kalman import KalmanPoseTracker
from state_machine.manager import FormManager, _EX_TYPE_TO_NAME


class ModelDCalibrated(MovementAssessor):
    """Model D: Full view-aware, uncertainty-aware, calibrated temporal model."""

    @property
    def model_id(self) -> str:
        return "model_d_calibrated"

    @property
    def description(self) -> str:
        return (
            "MotionIQ proposed model: Temporal kinematic modeling, 3D view-awareness, "
            "calibrated confidence estimation, and explicit abstention under occlusion or uncertainty."
        )

    def __init__(self, abstention_threshold: float = 0.65):
        self.abstention_threshold = abstention_threshold
        self._manager = FormManager()
        self._view_classifier = ViewClassifier()
        self._uncertainty_gate = UncertaintyGate(abstention_threshold=abstention_threshold)
        self._temporal = TemporalAssessor()
        self._feature_extractor = FeatureExtractor()
        self._kalman = KalmanPoseTracker()

    def predict(
        self,
        pose_sequence: List[List[Dict[str, float]]],
        exercise: Optional[str] = None,
        camera_metadata: Optional[Dict[str, Any]] = None,
    ) -> AssessmentResult:
        self.reset()
        last_state = None
        last_kinematics = None
        last_view = None
        last_reliability = None
        frame_time = 0.0
        fps = 30.0

        for landmarks in pose_sequence:
            last_state = self._manager.process_frame(landmarks)
            ex_name = exercise or _EX_TYPE_TO_NAME.get(last_state.current_exercise)
            last_view = self._view_classifier.estimate_view(landmarks, ex_name)

            lms_4d = np.array([[lm["x"], lm["y"], lm.get("z", 0.0), lm.get("visibility", 1.0)] for lm in landmarks])
            smoothed_xyz, uncert = self._kalman.update(lms_4d)
            vis = lms_4d[:, 3]
            body_frame = self._feature_extractor.extract(smoothed_xyz, uncert, vis)

            last_reliability = self._uncertainty_gate.evaluate(
                landmarks, ex_name, last_view, kalman_uncertainty=float(np.mean(uncert))
            )

            phase = last_state.exercise_result.rep_phase if last_state.exercise_result else "idle"
            last_kinematics = self._temporal.update(frame_time, body_frame.angles, phase)
            frame_time += (1.0 / fps)

        if not last_state or not last_kinematics or not last_view or not last_reliability:
            return AssessmentResult(
                exercise_prediction=None,
                rep_count=0,
                rep_phase="idle",
                observed_form_issues=[],
                confidence_score=0.0,
                assessment_status=AssessmentStatus.UNASSESSABLE,
                visibility_status="unknown",
                view_type="unknown",
            )

        ex_name = exercise or _EX_TYPE_TO_NAME.get(last_state.current_exercise)

        # Check explicit abstention:
        # If the model is uncertain or unassessable, we abstain from giving false-positive feedback
        if last_reliability.status == AssessmentStatus.UNASSESSABLE:
            return AssessmentResult(
                exercise_prediction=ex_name,
                rep_count=self._manager.rep_count,
                rep_phase=last_state.exercise_result.rep_phase if last_state.exercise_result else "idle",
                observed_form_issues=[],
                confidence_score=last_reliability.calibrated_confidence,
                assessment_status=AssessmentStatus.UNASSESSABLE,
                visibility_status=last_state.signal_quality,
                view_type=last_view.view_type.value,
                explanation_evidence={
                    "abstention_reason": last_reliability.abstention_reason.value,
                    "guidance": last_reliability.explanation,
                },
                suppressed_warnings=[],
                smoothness_score=last_kinematics.smoothness_score,
                symmetry_ratio=last_kinematics.bilateral_symmetry_ratio,
            )

        # Rule evaluation with view-conditional suppression
        raw_issues = [v.message for v in (last_state.stable_violations or [])]
        filtered_issues = []
        suppressed = []

        for issue in raw_issues:
            issue_lower = issue.lower()
            should_suppress = any(rule in issue_lower for rule in last_reliability.suppressed_rules)
            if should_suppress:
                suppressed.append(issue)
            else:
                filtered_issues.append(issue)

        # Add validated temporal kinematic issues
        if last_kinematics.smoothness_score < 0.35:
            filtered_issues.append("Uncontrolled movement tempo (high jerk). Lower weight or slow down.")
        if last_kinematics.bilateral_symmetry_ratio < 0.65:
            filtered_issues.append("Asymmetrical limb movement detected.")

        return AssessmentResult(
            exercise_prediction=ex_name,
            rep_count=self._manager.rep_count,
            rep_phase=last_state.exercise_result.rep_phase if last_state.exercise_result else "idle",
            observed_form_issues=filtered_issues,
            confidence_score=round(last_reliability.calibrated_confidence, 3),
            assessment_status=last_reliability.status,
            visibility_status=last_state.signal_quality,
            view_type=last_view.view_type.value,
            explanation_evidence={
                "view_suitability": last_view.suitability.value,
                "yaw_angle_deg": last_view.yaw_angle_deg,
                "smoothness": last_kinematics.smoothness_score,
                "symmetry": last_kinematics.bilateral_symmetry_ratio,
                "guidance": last_view.recommendation,
            },
            suppressed_warnings=suppressed,
            smoothness_score=last_kinematics.smoothness_score,
            symmetry_ratio=last_kinematics.bilateral_symmetry_ratio,
        )

    def reset(self) -> None:
        self._manager.reset()
        self._temporal.reset()
        self._view_classifier.reset()
        self._kalman.reset()
