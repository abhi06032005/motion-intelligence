"""Summarize user-operated camera evidence without fabricating missing measurements."""
import argparse
import hashlib
import json
from pathlib import Path
import numpy as np


def stats(values):
    values = [float(v) for v in values if v is not None and np.isfinite(v)]
    return {"n": len(values), "p50_ms": float(np.percentile(values, 50)) if values else None,
            "p95_ms": float(np.percentile(values, 95)) if values else None}


def summarize(path):
    data = json.loads(path.read_text(encoding="utf-8-sig"))
    if data.get("schema") != "motioniq.camera-audit.v1":
        raise ValueError(f"Unsupported capture schema: {path}")
    frames = data["frames"]
    received = [f for f in frames if f.get("received_ms") is not None and f.get("sent_ms") is not None]
    displayed = [f for f in received if f.get("after_animation_frames_ms") is not None]
    residuals = [f["received_ms"] - f["sent_ms"] - f["backend_processing_ms"]
                 for f in received if f.get("backend_processing_ms") is not None]
    counts = [f["response"].get("rep_count", 0) for f in received]
    detected = [f["response"].get("current_exercise") for f in received]
    return {
        "source": str(path.resolve()), "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "evidence_type": data["evidence_type"], "model": data["model"], "metadata": data["metadata"],
        "observer_notes": data["observer_notes"], "observer_count": data["observer_count"],
        "frames": len(frames), "no_pose_frames": sum(not f["landmarks"] for f in frames),
        "sent": sum("sent_ms" in f for f in frames), "received": len(received),
        "sent_without_response": sum("sent_ms" in f and "received_ms" not in f for f in frames),
        "omitted_frames_at_capacity": data["omitted_frames_at_capacity"],
        "detected_exercises": sorted({e for e in detected if e}),
        "unknown_exercise_responses": sum(e is None for e in detected),
        "last_response_rep_count": counts[-1] if counts else None,
        "max_response_rep_count": max(counts) if counts else None,
        "count_warning": "Counts can reset when detected exercise changes; inspect raw timeline before scoring",
        "browser_pose": stats([f["pose_ms"] for f in frames]),
        "live_backend_processing": stats([f.get("backend_processing_ms") for f in received]),
        "websocket_round_trip": stats([f["received_ms"] - f["sent_ms"] for f in received]),
        "transport_residual_not_pure_network": stats(residuals),
        "negative_residual_count": sum(v < 0 for v in residuals),
        "app_feedback_proxy_not_physical_e2e": stats([f["after_animation_frames_ms"] - f["inference_start_ms"] for f in displayed]),
        "pure_network_delay_ms": None, "physical_sensor_to_display_ms": None,
        "ground_truth_status": "Observer report only; no independent video adjudication",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("inputs", nargs="+", type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    result = [summarize(p) for p in args.inputs]
    with args.output.open("x", encoding="utf-8") as f:
        json.dump(result, f, indent=2)
    print(json.dumps(result, indent=2))
