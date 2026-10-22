"""Historical fixture diagnostic, NOT a valid classification benchmark.

The legacy protocol supplies true labels to B/C/D. Retained for forensic replay.
Use audit_results.py for paired label-supplied/blinded diagnostics and provenance.
"""

import json
import os
import sys
import time
from pathlib import Path
import numpy as np

# Add backend and research to path
sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from models.model_a_baseline import ModelABaseline
from models.model_b_view_gated import ModelBViewGated
from models.model_c_temporal import ModelCTemporal
from models.model_d_calibrated import ModelDCalibrated
from models.model_interface import AssessmentStatus

from research.datasets.benchmark_fixtures import generate_benchmark_suite
from research.evaluation.metrics import (
    compute_calibration_and_abstention,
    compute_classification_metrics,
    compute_rep_count_error,
)


def run_full_benchmark(output_path=None):
    print("=" * 70)
    print("  MotionIQ Benchmark & Ablation Study Suite")
    print("  View-Aware & Uncertainty-Aware Movement Assessment")
    print("=" * 70)

    # Synthetic fixtures; subject IDs do not alter the input coordinates.
    suite = generate_benchmark_suite()
    test_set = suite["test"]
    print(f"\n[Data] {len(test_set)} SYNTHETIC fixtures. Labels supplied: F1 is invalid for recognition.")

    models = [
        ModelABaseline(),
        ModelBViewGated(),
        ModelCTemporal(),
        ModelDCalibrated(),
    ]

    results_summary = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "test_subjects": ["Subject_09", "Subject_10"],
        "num_test_trials": len(test_set),
        "evidence_type": "synthetic_fixture_label_supplied_diagnostic",
        "human_recordings": 0,
        "classification_valid": False,
        "models": {},
        "ablation_table": [],
    }

    for model in models:
        print(f"\n---> Evaluating {model.model_id}: {model.description}")
        t_start = time.perf_counter()

        y_true_ex = []
        y_pred_ex = []
        y_true_reps = []
        y_pred_reps = []
        confs = []
        accuracies = []
        abstentions = []
        false_warnings = 0
        total_evaluable_reps = 0
        per_frame_latencies_ms = []

        for seq in test_set:
            landmarks_stream = seq.to_mediapipe_stream()
            true_ex = seq.exercise_label
            true_reps = len(seq.repetition_boundaries)

            # Benchmark inference latency
            t0 = time.perf_counter()
            pred = model.predict(landmarks_stream, exercise=true_ex)
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            per_frame_latencies_ms.append(elapsed_ms / max(len(landmarks_stream), 1))

            pred_ex = pred.exercise_prediction or "unknown"
            y_true_ex.append(true_ex)
            y_pred_ex.append(pred_ex)
            y_true_reps.append(true_reps)
            y_pred_reps.append(pred.rep_count)

            is_correct = 1 if (pred_ex == true_ex and abs(pred.rep_count - true_reps) <= 1) else 0
            is_abstained = (pred.assessment_status == AssessmentStatus.UNASSESSABLE)

            confs.append(pred.confidence_score)
            accuracies.append(is_correct)
            abstentions.append(is_abstained)

            # False-warning check:
            # If the movement protocol was "optimal" or camera view was unsuitable,
            # emitting warnings is a false-positive defect
            if seq.movement_protocol == "optimal" and len(pred.observed_form_issues) > 0:
                false_warnings += 1
            if "shallow_depth" in seq.movement_protocol and seq.camera_view == "frontal":
                # Frontal camera cannot see depth; emitting shallow depth warning is ungrounded
                if any("depth" in issue.lower() for issue in pred.observed_form_issues):
                    false_warnings += 1

            total_evaluable_reps += 1

        cls_metrics = compute_classification_metrics(y_true_ex, y_pred_ex)
        rep_metrics = compute_rep_count_error(y_true_reps, y_pred_reps)
        cal_metrics = compute_calibration_and_abstention(confs, accuracies, abstentions)

        p50_lat = float(np.percentile(per_frame_latencies_ms, 50))
        p95_lat = float(np.percentile(per_frame_latencies_ms, 95))
        throughput_fps = round(1000.0 / max(p50_lat, 0.1), 1)

        false_alarm_rate = round(false_warnings / max(total_evaluable_reps, 1), 3)

        model_summary = {
            "model_id": model.model_id,
            "description": model.description,
            "exercise_macro_f1": cls_metrics["macro_f1"],
            "balanced_accuracy": cls_metrics["balanced_accuracy"],
            "rep_mae": rep_metrics["rep_mae"],
            "rep_rmse": rep_metrics["rep_rmse"],
            "false_warning_rate": false_alarm_rate,
            "brier_score": cal_metrics["brier_score"],
            "ece": cal_metrics["ece"],
            "abstention_rate": cal_metrics["abstention_rate"],
            "retained_accuracy": cal_metrics["retained_accuracy"],
            "latency_p50_ms": round(p50_lat, 2),
            "latency_p95_ms": round(p95_lat, 2),
            "throughput_fps": throughput_fps,
        }

        results_summary["models"][model.model_id] = model_summary

        results_summary["ablation_table"].append({
            "model": model.model_id,
            "macro_f1": cls_metrics["macro_f1"],
            "rep_mae": rep_metrics["rep_mae"],
            "false_warning_rate": false_alarm_rate,
            "brier_score": cal_metrics["brier_score"],
            "retained_accuracy": cal_metrics["retained_accuracy"],
            "abstention_rate": cal_metrics["abstention_rate"],
            "latency_p50_ms": round(p50_lat, 2),
        })

        print(f"  F1: {cls_metrics['macro_f1']} | Rep MAE: {rep_metrics['rep_mae']} | False Warning Rate: {false_alarm_rate}")
        print(f"  Brier Score: {cal_metrics['brier_score']} | Retained Acc: {cal_metrics['retained_accuracy']} | Abstention: {cal_metrics['abstention_rate']}")
        print(f"  p50 Latency: {p50_lat:.2f}ms ({throughput_fps} FPS)")

    # Save artifacts
    artifacts_dir = Path(__file__).resolve().parents[1] / "artifacts"
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    summary_path = Path(output_path) if output_path else artifacts_dir / "experiments_fixture_rerun.json"
    if summary_path.resolve() == (artifacts_dir / "experiments_summary.json").resolve():
        raise ValueError("Historical artifact is preserved. Choose a separate output path.")

    with open(summary_path, "x", encoding="utf-8") as f:
        json.dump(results_summary, f, indent=2)

    print(f"\n[Artifacts] Synthetic diagnostic (not human validation) saved to {summary_path}")
    return results_summary


if __name__ == "__main__":
    run_full_benchmark()
