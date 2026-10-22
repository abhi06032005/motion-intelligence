"""Integration tests for Research Benchmark API endpoints."""

import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_get_research_datasets(client):
    res = client.get("/api/research/datasets")
    assert res.status_code == 200
    data = res.json()
    assert "datasets" in data
    assert len(data["datasets"]) >= 4
    ids = [d["id"] for d in data["datasets"]]
    assert "UI-PRMD" in ids
    assert "UL-RED" in ids
    assert "RepCount" in ids


def test_get_research_summary(client):
    res = client.get("/api/research/summary")
    assert res.status_code == 200
    data = res.json()
    assert "models" in data
    assert "model_a_baseline" in data["models"]
    assert "model_d_calibrated" in data["models"]
    assert "ablation_table" in data
    assert len(data["ablation_table"]) >= 4


def test_evaluate_sample_sequence(client):
    # Dummy 33-landmark sequence of 5 frames
    seq = []
    for _ in range(5):
        frame = [{"x": 0.5, "y": 0.5, "z": 0.0, "visibility": 0.9} for _ in range(33)]
        seq.append(frame)

    payload = {
        "model_id": "model_d_calibrated",
        "exercise": "squat",
        "landmarks_sequence": seq,
    }
    res = client.post("/api/research/evaluate", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["model_id"] == "model_d_calibrated"
    assert "assessment_status" in data
    assert "confidence_score" in data
