"""Standard MovementAssessor interface for baseline and research models.

Complies with Phase 3/4 requirements:
predict(pose_sequence, exercise, camera_metadata) -> AssessmentResult
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


class AssessmentStatus(str, Enum):
    ASSESSABLE = "assessable"
    UNCERTAIN = "uncertain"
    UNASSESSABLE = "unassessable"


@dataclass
class AssessmentResult:
    exercise_prediction: Optional[str]
    rep_count: int
    rep_phase: str
    observed_form_issues: List[str]
    confidence_score: float  # Calibrated [0.0, 1.0]
    assessment_status: AssessmentStatus
    visibility_status: str
    view_type: str
    explanation_evidence: Dict[str, Any] = field(default_factory=dict)
    suppressed_warnings: List[str] = field(default_factory=list)
    smoothness_score: float = 1.0
    symmetry_ratio: float = 1.0


class MovementAssessor(ABC):
    """Abstract base class for all exercise assessment models."""

    @property
    @abstractmethod
    def model_id(self) -> str:
        """Unique model identifier (e.g. 'model_a_baseline', 'model_d_calibrated')."""
        pass

    @property
    @abstractmethod
    def description(self) -> str:
        """Detailed academic model description."""
        pass

    @abstractmethod
    def predict(
        self,
        pose_sequence: List[List[Dict[str, float]]],
        exercise: Optional[str] = None,
        camera_metadata: Optional[Dict[str, Any]] = None,
    ) -> AssessmentResult:
        """Perform movement assessment over a sequence of 33-landmark pose frames."""
        pass

    @abstractmethod
    def reset(self) -> None:
        """Reset internal temporal states."""
        pass
