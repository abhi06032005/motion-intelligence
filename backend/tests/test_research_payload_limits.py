from fastapi.testclient import TestClient
from main import app

def test_research_rejects_empty_and_malformed_sequences():
    c = TestClient(app)
    body = {"model_id": "model_d_calibrated", "landmarks_sequence": []}
    assert c.post("/api/research/evaluate", json=body).status_code == 422
    body["landmarks_sequence"] = [[{"x": 0.5, "y": 0.5, "z": 0.0}] * 32]
    assert c.post("/api/research/evaluate", json=body).status_code == 422

def test_research_rejects_large_sequences():
    frame = [{"x": 0.5, "y": 0.5, "z": 0.0}] * 33
    body = {"model_id": "model_d_calibrated", "landmarks_sequence": [frame] * 601}
    assert TestClient(app).post("/api/research/evaluate", json=body).status_code == 422
