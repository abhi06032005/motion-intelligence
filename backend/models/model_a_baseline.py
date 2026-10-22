"""Model A: Upstream Baseline (Rule-Based + HMM).

Evaluates the original open-source pipeline without view-awareness or
calibrated uncertainty gating.
"""

from typing import Any, Dict, List, Optional
import numpy as np

from models.model_interface import AssessmentResult, AssessmentStatus, MovementAssessor
from state_machine.manager import FormManager, _EX_TYPE_TO_NAME


class ModelABaseline(MovementAssessor):
    """Model A: Unmodified upstream baseline."""

    @property
    def model_id(self) -> str:
        return "model_a_baseline"

    @property
    def description(self) -> str:
        return "Baseline rule-based geometric constraints with 4-state HMM classification."

    def __init__(self):
        self._manager = FormManager()

    def predict(
        self,
        pose_sequence: List[List[Dict[str, float]]],
        exercise: Optional[str] = None,
        camera_metadata: Optional[Dict[str, Any]] = None,
    ) -> AssessmentResult:
        self.reset()
        last_state = None

        for landmarks in pose_sequence:
            last_state = self._manager.process_frame(landmarks)

        if not last_state:
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

        ex_name = _EX_TYPE_TO_NAME.get(last_state.current_exercise)
        issues = [v.message for v in (last_state.stable_violations or [])]

        return AssessmentResult(
            exercise_prediction=ex_name,
            rep_count=self._manager.rep_count,
            rep_phase=last_state.exercise_result.rep_phase if last_state.exercise_result else "idle",
            observed_form_issues=issues,
            confidence_score=float(last_state.exercise_confidence),
            assessment_status=AssessmentStatus.ASSESSABLE,
            visibility_status=last_state.signal_quality,
            view_type="unknown",
            explanation_evidence={"hmm_confidence": last_state.exercise_confidence},
            suppressed_warnings=[],
            smoothness_score=1.0,
            symmetry_ratio=1.0,
        )

    def reset(self) -> None:
        self._manager.reset()
