"""Model C: Lightweight Temporal Kinematic Assessor.

Computes multi-frame temporal feature trajectories (angular velocities,
smoothness, bilateral symmetry, range of motion, and phase dynamics)
across continuous movement windows.
"""

from typing import Any, Dict, List, Optional
import numpy as np

from models.model_interface import AssessmentResult, AssessmentStatus, MovementAssessor
from pipeline.temporal_assessor import TemporalAssessor
from pipeline.view_classifier import ViewClassifier
from pipeline.features import FeatureExtractor
from pipeline.kalman import KalmanPoseTracker
from state_machine.manager import FormManager, _EX_TYPE_TO_NAME


class ModelCTemporal(MovementAssessor):
    """Model C: Temporal kinematic trajectory model."""

    @property
    def model_id(self) -> str:
        return "model_c_temporal"

    @property
    def description(self) -> str:
        return "Temporal trajectory assessment combining angular velocities, phase dynamics, and jerk smoothness."

    def __init__(self):
        self._manager = FormManager()
        self._temporal = TemporalAssessor()
        self._view_classifier = ViewClassifier()
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
        frame_time = 0.0
        fps = 30.0

        for landmarks in pose_sequence:
            last_state = self._manager.process_frame(landmarks)
            ex_name = exercise or _EX_TYPE_TO_NAME.get(last_state.current_exercise)
            last_view = self._view_classifier.estimate_view(landmarks, ex_name)

            # Compute features for temporal kinematics
            lms_4d = np.array([[lm["x"], lm["y"], lm.get("z", 0.0), lm.get("visibility", 1.0)] for lm in landmarks])
            smoothed_xyz, uncert = self._kalman.update(lms_4d)
            vis = lms_4d[:, 3]
            body_frame = self._feature_extractor.extract(smoothed_xyz, uncert, vis)

            phase = last_state.exercise_result.rep_phase if last_state.exercise_result else "idle"
            last_kinematics = self._temporal.update(frame_time, body_frame.angles, phase)
            frame_time += (1.0 / fps)

        if not last_state or not last_kinematics or not last_view:
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
        issues = [v.message for v in (last_state.stable_violations or [])]

        # Temporal defect checks:
        if last_kinematics.smoothness_score < 0.35:
            issues.append("Jerky or uncontrolled movement cadence detected.")
        if last_kinematics.bilateral_symmetry_ratio < 0.65:
            issues.append("Significant bilateral asymmetry between left and right sides.")

        return AssessmentResult(
            exercise_prediction=ex_name,
            rep_count=self._manager.rep_count,
            rep_phase=last_state.exercise_result.rep_phase if last_state.exercise_result else "idle",
            observed_form_issues=issues,
            confidence_score=float(last_state.exercise_confidence),
            assessment_status=AssessmentStatus.ASSESSABLE,
            visibility_status=last_state.signal_quality,
            view_type=last_view.view_type.value,
            explanation_evidence={
                "smoothness": last_kinematics.smoothness_score,
                "symmetry": last_kinematics.bilateral_symmetry_ratio,
                "knee_vel": last_kinematics.knee_angular_velocity_deg_s,
                "elbow_vel": last_kinematics.elbow_angular_velocity_deg_s,
            },
            suppressed_warnings=[],
            smoothness_score=last_kinematics.smoothness_score,
            symmetry_ratio=last_kinematics.bilateral_symmetry_ratio,
        )

    def reset(self) -> None:
        self._manager.reset()
        self._temporal.reset()
        self._view_classifier.reset()
        self._kalman.reset()
