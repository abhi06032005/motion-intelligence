"""Unit tests for MotionIQ ViewClassifier."""

import pytest
from pipeline.view_classifier import ViewClassifier, ViewType, ViewSuitability


def _make_dummy_landmarks(yaw_offset_z: float = 0.0) -> list[dict]:
    """Create 33 standard landmarks with adjustable shoulder/hip depth offset."""
    lms = []
    for i in range(33):
        lms.append({"x": 0.5, "y": 0.5, "z": 0.0, "visibility": 1.0})

    # Shoulders (11=L, 12=R)
    lms[11]["x"] = 0.60
    lms[11]["z"] = yaw_offset_z
    lms[12]["x"] = 0.40
    lms[12]["z"] = -yaw_offset_z

    # Hips (23=L, 24=R)
    lms[23]["x"] = 0.58
    lms[23]["z"] = yaw_offset_z * 0.9
    lms[24]["x"] = 0.42
    lms[24]["z"] = -yaw_offset_z * 0.9

    return lms


def test_view_classifier_frontal():
    clf = ViewClassifier()
    lms = _make_dummy_landmarks(yaw_offset_z=0.01)
    res = clf.estimate_view(lms, target_exercise="squat")

    assert res.view_type == ViewType.FRONTAL
    assert abs(res.yaw_angle_deg) <= 25.0
    assert res.suitability == ViewSuitability.ACCEPTABLE


def test_view_classifier_lateral():
    clf = ViewClassifier()
    # High Z offset with compressed X width indicates lateral (profile) view
    lms = _make_dummy_landmarks(yaw_offset_z=0.25)
    lms[11]["x"] = 0.52
    lms[12]["x"] = 0.48
    lms[23]["x"] = 0.51
    lms[24]["x"] = 0.49

    res = clf.estimate_view(lms, target_exercise="squat")
    assert res.view_type in (ViewType.LATERAL_LEFT, ViewType.LATERAL_RIGHT)
    assert res.suitability == ViewSuitability.OPTIMAL


def test_pushup_view_suitability():
    clf = ViewClassifier()
    lms_front = _make_dummy_landmarks(yaw_offset_z=0.0)
    res_front = clf.estimate_view(lms_front, target_exercise="pushup")
    assert res_front.suitability == ViewSuitability.SUBOPTIMAL
    assert "rotate side-on" in res_front.recommendation.lower()
