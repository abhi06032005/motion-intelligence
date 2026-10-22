"""Evaluation Metrics for MotionIQ Benchmark Suite.

Computes classification F1, rep-count MAE, false-alarm rates,
Brier score, calibration error, and deployment latency.
"""

from typing import Any, Dict, List, Tuple
import numpy as np


def compute_classification_metrics(
    y_true: List[str],
    y_pred: List[str],
) -> Dict[str, Any]:
    """Compute Macro-F1, balanced accuracy, and per-class precision/recall."""
    classes = sorted(list(set(y_true + y_pred)))
    tp = {c: 0 for c in classes}
    fp = {c: 0 for c in classes}
    fn = {c: 0 for c in classes}

    for t, p in zip(y_true, y_pred):
        if t == p:
            tp[t] += 1
        else:
            fp[p] += 1
            fn[t] += 1

    per_class = {}
    f1s = []
    recalls = []

    for c in classes:
        p = tp[c] / max(tp[c] + fp[c], 1)
        r = tp[c] / max(tp[c] + fn[c], 1)
        f1 = (2 * p * r) / max(p + r, 1e-6)
        per_class[c] = {"precision": round(p, 3), "recall": round(r, 3), "f1": round(f1, 3)}
        f1s.append(f1)
        recalls.append(r)

    macro_f1 = float(np.mean(f1s)) if f1s else 0.0
    balanced_acc = float(np.mean(recalls)) if recalls else 0.0

    return {
        "macro_f1": round(macro_f1, 3),
        "balanced_accuracy": round(balanced_acc, 3),
        "per_class": per_class,
        "classes": classes,
    }


def compute_rep_count_error(
    y_true_reps: List[int],
    y_pred_reps: List[int],
) -> Dict[str, float]:
    """Calculate Mean Absolute Error (MAE) and root mean squared error for rep counting."""
    diffs = np.abs(np.array(y_true_reps) - np.array(y_pred_reps))
    mae = float(np.mean(diffs)) if len(diffs) > 0 else 0.0
    rmse = float(np.sqrt(np.mean(diffs ** 2))) if len(diffs) > 0 else 0.0
    max_err = int(np.max(diffs)) if len(diffs) > 0 else 0

    return {
        "rep_mae": round(mae, 3),
        "rep_rmse": round(rmse, 3),
        "max_rep_error": max_err,
    }


def compute_calibration_and_abstention(
    confs: List[float],
    accuracies: List[int],  # 1 if prediction was correct, 0 otherwise
    abstentions: List[bool],
) -> Dict[str, Any]:
    """Calculate Brier score, Expected Calibration Error (ECE), and abstention rate."""
    total = len(confs)
    if total == 0:
        return {"brier_score": 0.0, "ece": 0.0, "abstention_rate": 0.0}

    abstention_count = sum(abstentions)
    abstention_rate = abstention_count / total

    # Accepted predictions
    accepted_confs = [c for c, a in zip(confs, abstentions) if not a]
    accepted_accs = [acc for acc, a in zip(accuracies, abstentions) if not a]

    if not accepted_confs:
        return {
            "brier_score": 0.0,
            "ece": 0.0,
            "abstention_rate": round(abstention_rate, 3),
            "retained_accuracy": 1.0,
        }

    brier = float(np.mean((np.array(accepted_confs) - np.array(accepted_accs)) ** 2))
    retained_acc = float(np.mean(accepted_accs))

    # ECE with 5 bins
    bins = np.linspace(0.0, 1.0, 6)
    ece = 0.0
    for i in range(len(bins) - 1):
        b_low, b_high = bins[i], bins[i + 1]
        in_bin = [
            (c, acc)
            for c, acc in zip(accepted_confs, accepted_accs)
            if b_low <= c < b_high or (i == 4 and c == 1.0)
        ]
        if in_bin:
            bin_conf = np.mean([x[0] for x in in_bin])
            bin_acc = np.mean([x[1] for x in in_bin])
            ece += (len(in_bin) / len(accepted_confs)) * abs(bin_acc - bin_conf)

    return {
        "brier_score": round(brier, 4),
        "ece": round(float(ece), 4),
        "abstention_rate": round(abstention_rate, 3),
        "retained_accuracy": round(retained_acc, 3),
    }
