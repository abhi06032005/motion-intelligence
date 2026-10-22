"""Unit tests for MotionIQ UncertaintyGate & Reliability Layer."""

import pytest
from pipeline.uncertainty_gate import UncertaintyGate, AssessmentStatus, AbstentionReason
from pipeline.view_classifier import ViewAssessment, ViewType, ViewSuitability


def _base_lms():
    lms = []
    for i in range(33):
        # Human proportion height from y=0.15 to y=0.95 (height=0.80)
        lms.append({"x": 0.5, "y": 0.15 + (i / 33.0) * 0.8, "z": 0.0, "visibility": 0.95})
    return lms


def test_uncertainty_gate_assessable_optimal():
    gate = UncertaintyGate()
    lms = _base_lms()
    view = ViewAssessment(
        view_type=ViewType.LATERAL_LEFT,
        yaw_angle_deg=80.0,
        pitch_angle_deg=0.0,
        suitability=ViewSuitability.OPTIMAL,
        confidence=0.95,
    )
    report = gate.evaluate(lms, "squat", view)

    assert report.status == AssessmentStatus.ASSESSABLE
    assert report.abstention_reason == AbstentionReason.NONE
    assert report.calibrated_confidence > 0.70
    assert "knee_valgus" in report.suppressed_rules  # suppressed from lateral view


def test_uncertainty_gate_occlusion_abstention():
    gate = UncertaintyGate()
    lms = _base_lms()
    # Mask knee and ankle joints
    for j in [25, 26, 27, 28]:
        lms[j]["visibility"] = 0.10

    view = ViewAssessment(
        view_type=ViewType.FRONTAL,
        yaw_angle_deg=0.0,
        pitch_angle_deg=0.0,
        suitability=ViewSuitability.ACCEPTABLE,
        confidence=0.5,
    )
    report = gate.evaluate(lms, "squat", view)

    assert report.status == AssessmentStatus.UNASSESSABLE
    assert report.abstention_reason == AbstentionReason.CRITICAL_JOINTS_OCCLUDED


def test_uncertainty_gate_too_far_abstention():
    gate = UncertaintyGate(min_body_height=0.20)
    lms = _base_lms()
    # Compress body to 0.10 of screen height (user standing 10m away)
    for i in range(33):
        lms[i]["y"] = 0.50 + (i / 33.0) * 0.08

    view = ViewAssessment(
        view_type=ViewType.FRONTAL,
        yaw_angle_deg=0.0,
        pitch_angle_deg=0.0,
        suitability=ViewSuitability.ACCEPTABLE,
        confidence=0.8,
    )
    report = gate.evaluate(lms, "squat", view)

    assert report.status == AssessmentStatus.UNASSESSABLE
    assert report.abstention_reason == AbstentionReason.SUBJECT_TOO_FAR
