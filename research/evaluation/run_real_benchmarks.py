"""Execute authentic UI-PRMD benchmark on 200 real human movement recordings.

Strict separation of:
- Task A: Blind exercise recognition (no labels supplied)
- Task B: Technique assessment conditioned on declared exercise

Evaluates:
- Baseline 0: No-warning baseline
- Baseline 1: Simple orientation gating
- Model A: Upstream planar baseline
- Model B: 3D Torso-normal view-gated
- Model C: View-aware + temporal kinematics
- Model D: Full MotionIQ (view-gated + temporal + calibrated abstention)

Evaluated across 0° (frontal), 45° (oblique), 90° (lateral) virtual camera projections.
Saves comprehensive verified results into research/results/real_human/ and virtual_camera/.
"""

from __future__ import annotations

import json
import logging
import os
import sys
import time
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Tuple
import numpy as np

# Ensure project root and backend are on sys.path
PROJECT_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = PROJECT_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Suppress verbose per-frame log messages
logging.getLogger("detect").setLevel(logging.ERROR)
logging.getLogger().setLevel(logging.ERROR)

from models.model_a_baseline import ModelABaseline
from models.model_b_view_gated import ModelBViewGated
from models.model_c_temporal import ModelCTemporal
from models.model_d_calibrated import ModelDCalibrated
from models.model_interface import AssessmentResult, AssessmentStatus
from research.datasets.uiprmd_loader import AuthenticMovementTrial, load_all_uiprmd_squats

RESULTS_REAL_DIR = PROJECT_ROOT / "research" / "results" / "real_human"
RESULTS_VCAM_DIR = PROJECT_ROOT / "research" / "results" / "virtual_camera"
RESULTS_REAL_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_VCAM_DIR.mkdir(parents=True, exist_ok=True)


class NoWarningBaseline:
    """Baseline 0: Control baseline that never issues a defect warning."""
    model_id = "baseline_0_no_warning"
    description = "Control baseline emitting no warnings (FWR=0%, TPR=0%)."

    def predict(self, pose_sequence, exercise=None):
        return AssessmentResult(
            exercise_prediction=exercise or "squat",
            rep_count=1,
            rep_phase="concentric",
            observed_form_issues=[],
            confidence_score=1.0,
            assessment_status=AssessmentStatus.ASSESSABLE,
            visibility_status="good",
            view_type="frontal",
        )


class SimpleOrientationGatingBaseline:
    """Baseline 1: Heuristic orientation gating based on bounding box width/depth ratio."""
    model_id = "baseline_1_orientation_gating"
    description = "Simple threshold on shoulder-hip bounding ratio to suppress knee rules."

    def __init__(self):
        self._inner = ModelABaseline()

    def predict(self, pose_sequence, exercise=None):
        res = self._inner.predict(pose_sequence, exercise=exercise)
        # Check simple 2D aspect ratio of shoulders vs hips
        if pose_sequence and len(pose_sequence) > 0:
            last_frame = pose_sequence[-1]
            l_sh = last_frame[11]
            r_sh = last_frame[12]
            width = abs(l_sh["x"] - r_sh["x"])
            # If perceived shoulder width < 0.08, assume side view and drop valgus
            if width < 0.08:
                filtered = [iss for iss in res.observed_form_issues if "valgus" not in iss.lower()]
                res.observed_form_issues = filtered
                res.suppressed_warnings.append("Knee valgus suppressed by simple width threshold")
        return res


def run_benchmark():
    print("=" * 76)
    print("  MotionIQ Phase 5: Authentic Human Movement Evaluation (UI-PRMD)")
    print("  Testing Camera-View Awareness & Uncertainty Gating on Real Vicon Data")
    print("=" * 76)

    # 1. Load all 200 authentic UI-PRMD Deep Squats
    trials = load_all_uiprmd_squats()
    print(f"\n[Dataset] Successfully loaded {len(trials)} authentic Vicon recordings.")
    num_opt = sum(1 for t in trials if t.protocol == "optimal")
    num_non_opt = sum(1 for t in trials if t.protocol == "non_optimal")
    print(f"  - Optimal trials:     {num_opt}")
    print(f"  - Non-optimal trials: {num_non_opt}")
    print(f"  - Unique subjects:    {len(set(t.subject_id for t in trials))} (Subject_01 to Subject_10)")

    # 2. Instantiate all models
    models = [
        NoWarningBaseline(),
        SimpleOrientationGatingBaseline(),
        ModelABaseline(),
        ModelBViewGated(),
        ModelCTemporal(),
        ModelDCalibrated(),
    ]

    VIEWPOINTS = [
        ("frontal", 0.0),
        ("oblique", 45.0),
        ("lateral", 90.0),
    ]

    # Pre-generate virtual camera projections
    print("\n[Projection] Generating 0°, 45°, and 90° virtual-camera streams...")
    t0 = time.time()
    projected_data = {}
    for t_idx, trial in enumerate(trials):
        gt = trial.compute_ground_truth_biomechanics()
        for v_name, yaw_deg in VIEWPOINTS:
            lms_stream = trial.project_to_virtual_camera(yaw_deg=yaw_deg, target_fps=30.0)
            key = (trial.subject_id, trial.trial_id, trial.protocol, v_name)
            projected_data[key] = {
                "trial": trial,
                "view": v_name,
                "yaw_deg": yaw_deg,
                "stream": lms_stream,
                "gt": gt,
            }
    print(f"  Generated {len(projected_data)} projected streams in {time.time() - t0:.2f}s.")

    # 3. TASK A: BLIND EXERCISE RECOGNITION AUDIT
    print("\n" + "=" * 60)
    print("  TASK A: BLIND EXERCISE RECOGNITION (exercise = None)")
    print("=" * 60)

    task_a_results = {}
    # Test on upstream HMM baseline across views
    hmm_model = ModelABaseline()
    for v_name, yaw_deg in VIEWPOINTS:
        correct_count = 0
        total_count = 0
        predictions = defaultdict(int)

        for key, p_info in projected_data.items():
            if key[3] != v_name:
                continue
            res = hmm_model.predict(p_info["stream"], exercise=None)
            pred_ex = res.exercise_prediction or "unknown"
            predictions[pred_ex] += 1
            if pred_ex == "squat":
                correct_count += 1
            total_count += 1

        acc = correct_count / total_count if total_count > 0 else 0.0
        task_a_results[v_name] = {
            "accuracy": round(acc, 3),
            "correct_squats": correct_count,
            "total_trials": total_count,
            "distribution": dict(predictions),
        }
        print(f"  View: {v_name:8s} | Accuracy: {acc*100:5.1f}% ({correct_count}/{total_count}) | Preds: {dict(predictions)}")

    # 4. TASK B: TECHNIQUE ASSESSMENT EVALUATION
    print("\n" + "=" * 60)
    print("  TASK B: TECHNIQUE ASSESSMENT (Conditioned: exercise = 'squat')")
    print("=" * 60)

    full_evaluation_records = []
    summary_by_model_and_view = defaultdict(lambda: {
        "optimal_trials": 0,
        "false_warnings": 0,
        "non_optimal_trials": 0,
        "true_defect_detected": 0,
        "abstained_count": 0,
        "total_trials": 0,
    })

    # Execute all models across all projected streams
    for model in models:
        m_id = model.model_id
        t_start_model = time.time()
        print(f"\n---> Evaluating {m_id}...")

        for key, p_info in projected_data.items():
            subj_id, trial_id, protocol, v_name = key
            stream = p_info["stream"]
            gt = p_info["gt"]

            # Predict conditioned on exercise='squat' (legitimate for technique assessment)
            t_inf_0 = time.perf_counter()
            pred = model.predict(stream, exercise="squat")
            inf_time_ms = (time.perf_counter() - t_inf_0) * 1000.0

            is_abstained = (pred.assessment_status == AssessmentStatus.UNASSESSABLE)
            issues = pred.observed_form_issues or []
            has_defect_flag = len(issues) > 0
            has_valgus_flag = any("valgus" in iss.lower() for iss in issues)

            # Record per-trial metrics
            stats = summary_by_model_and_view[(m_id, v_name)]
            stats["total_trials"] += 1
            if is_abstained:
                stats["abstained_count"] += 1

            if protocol == "optimal":
                stats["optimal_trials"] += 1
                # Any form warning on an optimal trial is a False Warning
                if has_defect_flag and not is_abstained:
                    stats["false_warnings"] += 1
            else:
                stats["non_optimal_trials"] += 1
                # Non-optimal trial: Did the model flag a technique defect?
                if has_defect_flag and not is_abstained:
                    stats["true_defect_detected"] += 1

            full_evaluation_records.append({
                "model_id": m_id,
                "subject_id": subj_id,
                "trial_id": trial_id,
                "protocol": protocol,
                "viewpoint": v_name,
                "is_abstained": is_abstained,
                "issues": issues,
                "confidence": pred.confidence_score,
                "latency_ms": round(inf_time_ms, 2),
                "gt_min_knee_flex": gt["min_knee_flexion_deg"],
                "gt_knee_ankle_ratio": gt["min_knee_ankle_ratio"],
                "gt_has_valgus": gt["true_has_valgus"],
                "gt_has_shallow": gt["true_has_shallow"],
            })

        print(f"     Finished in {time.time() - t_start_model:.2f}s.")

    # 5. COMPUTE STATISTICAL METRICS TABLE
    metrics_summary = []
    print("\n" + "=" * 90)
    print(f" {'Model':<28} | {'View':<8} | {'FWR (%)':<8} | {'TPR/Sens (%)':<12} | {'Spec (%)':<9} | {'Coverage':<9} | {'Abstain'}")
    print("-" * 90)

    for (m_id, v_name), st in summary_by_model_and_view.items():
        n_opt = st["optimal_trials"]
        n_non_opt = st["non_optimal_trials"]
        n_tot = st["total_trials"]

        fwr = (st["false_warnings"] / n_opt * 100.0) if n_opt > 0 else 0.0
        tpr = (st["true_defect_detected"] / n_non_opt * 100.0) if n_non_opt > 0 else 0.0
        spec = 100.0 - fwr
        coverage = ((n_tot - st["abstained_count"]) / n_tot * 100.0) if n_tot > 0 else 0.0
        abstain_rate = (st["abstained_count"] / n_tot * 100.0) if n_tot > 0 else 0.0

        metrics_summary.append({
            "model_id": m_id,
            "viewpoint": v_name,
            "false_warning_rate_pct": round(fwr, 1),
            "true_positive_sensitivity_pct": round(tpr, 1),
            "specificity_pct": round(spec, 1),
            "coverage_pct": round(coverage, 1),
            "abstention_rate_pct": round(abstain_rate, 1),
            "optimal_trials": n_opt,
            "non_optimal_trials": n_non_opt,
        })

        print(f" {m_id:<28} | {v_name:<8} | {fwr:6.1f}%  | {tpr:9.1f}%    | {spec:7.1f}%  | {coverage:7.1f}%  | {abstain_rate:5.1f}%")

    # 6. SUBJECT-DISJOINT HOLDOUT SPLIT (Subjects 09 & 10)
    print("\n" + "=" * 90)
    print("  STRICT HOLDOUT TEST SPLIT (Subject_09 & Subject_10 ONLY)")
    print("=" * 90)

    holdout_summary = []
    for model in models:
        m_id = model.model_id
        for v_name, _ in VIEWPOINTS:
            subset = [
                r for r in full_evaluation_records
                if r["model_id"] == m_id and r["viewpoint"] == v_name and r["subject_id"] in ["Subject_09", "Subject_10"]
            ]
            opt_sub = [r for r in subset if r["protocol"] == "optimal"]
            non_opt_sub = [r for r in subset if r["protocol"] == "non_optimal"]

            fw = sum(1 for r in opt_sub if len(r["issues"]) > 0 and not r["is_abstained"])
            tp = sum(1 for r in non_opt_sub if len(r["issues"]) > 0 and not r["is_abstained"])
            abs_count = sum(1 for r in subset if r["is_abstained"])

            fwr = (fw / len(opt_sub) * 100.0) if opt_sub else 0.0
            tpr = (tp / len(non_opt_sub) * 100.0) if non_opt_sub else 0.0

            holdout_summary.append({
                "model_id": m_id,
                "viewpoint": v_name,
                "test_subjects": ["Subject_09", "Subject_10"],
                "false_warning_rate_pct": round(fwr, 1),
                "true_positive_sensitivity_pct": round(tpr, 1),
                "trials_evaluated": len(subset),
            })

            print(f" {m_id:<28} | {v_name:<8} | FWR: {fwr:5.1f}% | TPR: {tpr:5.1f}% | (N={len(subset)})")

    # 7. SAVE RESULTS TO ARTIFACTS
    out_real_file = RESULTS_REAL_DIR / "real_human_benchmark_summary.json"
    with open(out_real_file, "w") as f:
        json.dump({
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "dataset": "UI-PRMD Deep Squats (Vicon 100Hz)",
            "total_recordings": len(trials),
            "task_a_blind_recognition": task_a_results,
            "task_b_overall_metrics": metrics_summary,
            "task_b_holdout_test_metrics": holdout_summary,
        }, f, indent=2)

    out_vcam_file = RESULTS_VCAM_DIR / "virtual_camera_projection_results.json"
    with open(out_vcam_file, "w") as f:
        json.dump({
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "viewpoints_evaluated": ["frontal (0°)", "oblique (45°)", "lateral (90°)"],
            "total_projected_streams": len(projected_data),
            "summary_metrics": metrics_summary,
        }, f, indent=2)

    # Save detailed per-trial records for auditability
    out_trials_csv = RESULTS_REAL_DIR / "uiprmd_trial_level_predictions.json"
    with open(out_trials_csv, "w") as f:
        json.dump(full_evaluation_records[:300], f, indent=2)

    print(f"\n[Artifacts] Successfully saved verified results to:")
    print(f"  - {out_real_file}")
    print(f"  - {out_vcam_file}")
    print(f"  - {out_trials_csv}")


if __name__ == "__main__":
    run_benchmark()
