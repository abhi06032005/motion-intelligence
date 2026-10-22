"""Model B: View-Aware Gated Baseline.

Incorporates real-time 3D camera viewpoint estimation and suppresses
geometric form rules that cannot be reliably assessed from the detected view.
"""

from typing import Any, Dict, List, Optional

from models.model_interface import AssessmentResult, AssessmentStatus, MovementAssessor
from pipeline.view_classifier import ViewClassifier
from pipeline.uncertainty_gate import UncertaintyGate
from state_machine.manager import FormManager, _EX_TYPE_TO_NAME


class ModelBViewGated(MovementAssessor):
    """Model B: Rule-based + HMM with view-aware rule suppression."""

    @property
    def model_id(self) -> str:
        return "model_b_view_gated"

    @property
    def description(self) -> str:
        return "HMM baseline augmented with real-time 3D camera view classification and angle-gated rule suppression."

    def __init__(self):
        self._manager = FormManager()
        self._view_classifier = ViewClassifier()
        self._uncertainty_gate = UncertaintyGate()

    def predict(
        self,
        pose_sequence: List[List[Dict[str, float]]],
        exercise: Optional[str] = None,
        camera_metadata: Optional[Dict[str, Any]] = None,
    ) -> AssessmentResult:
        self.reset()
        last_state = None
        last_view = None
        last_reliability = None

        for landmarks in pose_sequence:
            last_state = self._manager.process_frame(landmarks)
            ex_name = exercise or _EX_TYPE_TO_NAME.get(last_state.current_exercise)
            last_view = self._view_classifier.estimate_view(landmarks, ex_name)
            last_reliability = self._uncertainty_gate.evaluate(landmarks, ex_name, last_view)

        if not last_state or not last_view or not last_reliability:
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
        raw_issues = [v.message for v in (last_state.stable_violations or [])]

        # Suppress rules that cannot be reliably assessed from this view
        filtered_issues = []
        suppressed = []
        for issue in raw_issues:
            issue_lower = issue.lower()
            should_suppress = any(rule in issue_lower for rule in last_reliability.suppressed_rules)
            if should_suppress:
                suppressed.append(issue)
            else:
                filtered_issues.append(issue)

        return AssessmentResult(
            exercise_prediction=ex_name,
            rep_count=self._manager.rep_count,
            rep_phase=last_state.exercise_result.rep_phase if last_state.exercise_result else "idle",
            observed_form_issues=filtered_issues,
            confidence_score=float(last_reliability.calibrated_confidence),
            assessment_status=last_reliability.status,
            visibility_status=last_state.signal_quality,
            view_type=last_view.view_type.value,
            explanation_evidence={
                "yaw_angle_deg": last_view.yaw_angle_deg,
                "view_suitability": last_view.suitability.value,
                "recommendation": last_view.recommendation,
            },
            suppressed_warnings=suppressed,
            smoothness_score=1.0,
            symmetry_ratio=1.0,
        )

    def reset(self) -> None:
        self._manager.reset()
        self._view_classifier.reset()
