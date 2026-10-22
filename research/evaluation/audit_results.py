"""Diagnostic audit script to verify experimental results and uncover anomalies."""

import logging
import sys
from pathlib import Path
import numpy as np

# Suppress verbose per-frame log messages
logging.getLogger("detect").setLevel(logging.ERROR)
logging.getLogger().setLevel(logging.ERROR)

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from research.datasets.benchmark_fixtures import generate_benchmark_suite
from models.model_a_baseline import ModelABaseline
from models.model_b_view_gated import ModelBViewGated
from models.model_c_temporal import ModelCTemporal
from models.model_d_calibrated import ModelDCalibrated
from research.evaluation.metrics import (
    compute_classification_metrics,
    compute_rep_count_error,
    compute_calibration_and_abstention,
)


def run_audit():
    suite = generate_benchmark_suite()
    test_set = suite["test"]
    true_labels = [seq.exercise_label for seq in test_set]
    true_reps = [len(seq.repetition_boundaries) for seq in test_set]
    dataset_ids = [seq.dataset_id for seq in test_set]
    subject_ids = [seq.subject_id for seq in test_set]

    print("=== 1. DATASET PROVENANCE AUDIT ===")
    print(f"Total test sequences: {len(test_set)}")
    print(f"Dataset IDs in test split: {set(dataset_ids)}")
    print(f"Subject IDs in test split: {set(subject_ids)}")
    for i, s in enumerate(test_set):
        print(f"  [{i:02d}] {s.dataset_id} | {s.subject_id} | {s.session_id} | frames={len(s.timestamps_sec)} | true_reps={len(s.repetition_boundaries)}")

    print("\n=== 2. LABEL LEAKAGE & CLASSIFICATION AUDIT ===")
    models = [ModelABaseline(), ModelBViewGated(), ModelCTemporal(), ModelDCalibrated()]

    for m in models:
        preds_hint = []
        preds_blind = []
        reps_pred = []
        confs = []
        abstentions = []

        for seq in test_set:
            stream = seq.to_mediapipe_stream()
            # 1. As run in run_experiments.py (passing exercise=seq.exercise_label)
            res_hint = m.predict(stream, exercise=seq.exercise_label)
            preds_hint.append(res_hint.exercise_prediction or "unknown")
            reps_pred.append(res_hint.rep_count)
            confs.append(res_hint.confidence_score)
            abstentions.append(res_hint.assessment_status.value == "unassessable")

            # 2. Blind prediction (exercise=None, testing actual classification capability)
            res_blind = m.predict(stream, exercise=None)
            preds_blind.append(res_blind.exercise_prediction or "unknown")

        metrics_hint = compute_classification_metrics(true_labels, preds_hint)
        metrics_blind = compute_classification_metrics(true_labels, preds_blind)
        rep_err = compute_rep_count_error(true_reps, reps_pred)

        print(f"\n--- {m.model_id} ---")
        print(f"  [WITH HINT (run_experiments.py protocol)]")
        print(f"    Predictions: {preds_hint}")
        print(f"    Macro-F1: {metrics_hint['macro_f1']} | Balanced Acc: {metrics_hint['balanced_accuracy']}")
        print(f"  [BLIND EVALUATION (exercise=None)]")
        print(f"    Predictions: {preds_blind}")
        print(f"    Macro-F1: {metrics_blind['macro_f1']} | Balanced Acc: {metrics_blind['balanced_accuracy']}")
        print(f"  [REPETITION COUNTS]")
        print(f"    True reps:      {true_reps}")
        print(f"    Predicted reps: {reps_pred}")
        print(f"    Rep MAE: {rep_err['rep_mae']}")
        print(f"  [CONFIDENCE & CALIBRATION]")
        print(f"    Mean confidence: {np.mean(confs):.4f}")
        print(f"    Min confidence:  {np.min(confs):.4f}")
        print(f"    Max confidence:  {np.max(confs):.4f}")
        print(f"    Abstention rate: {np.mean(abstentions):.4f}")


if __name__ == "__main__":
    run_audit()
