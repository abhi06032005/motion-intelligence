"""Research Benchmark API router.

Exposes historical fixture metrics, dataset metadata, and comparative
model evaluation endpoints to the MotionIQ frontend research dashboard.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, model_validator

from models.model_a_baseline import ModelABaseline
from models.model_b_view_gated import ModelBViewGated
from models.model_c_temporal import ModelCTemporal
from models.model_d_calibrated import ModelDCalibrated

router = APIRouter(prefix="/research", tags=["research"])

RESEARCH_DIR = Path(__file__).resolve().parents[2] / "research"
RESULTS_DIR = RESEARCH_DIR / "results"
PHASE6_SUMMARY_FILE = RESULTS_DIR / "phase6" / "phase6_loso_benchmark_summary.json"
PHASE7_COVERAGE_FILE = RESULTS_DIR / "phase7" / "phase7_matched_coverage_analysis.json"
ARTIFACTS_DIR = RESEARCH_DIR / "artifacts"
SUMMARY_FILE = ARTIFACTS_DIR / "experiments_summary.json"

_MODELS = {
    "model_a_baseline": ModelABaseline,
    "model_b_view_gated": ModelBViewGated,
    "model_c_temporal": ModelCTemporal,
    "model_d_calibrated": ModelDCalibrated,
}


class ModelEvaluationRequest(BaseModel):
    model_id: str
    exercise: Optional[str] = "squat"
    landmarks_sequence: List[List[Dict[str, float]]] = Field(min_length=1, max_length=600)

    @model_validator(mode="after")
    def validate_frames(self):
        if any(len(frame) != 33 for frame in self.landmarks_sequence):
            raise ValueError("Each frame requires exactly 33 landmarks")
        return self



@router.get("/summary")
async def get_research_summary():
    """Return genuine verified Leave-One-Subject-Out (LOSO) benchmark results as single source of truth."""
    if PHASE6_SUMMARY_FILE.exists():
        try:
            with open(PHASE6_SUMMARY_FILE, "r", encoding="utf-8") as f:
                phase6_data = json.load(f)

            overall_summary = phase6_data.get("overall_summary", {})

            matched_coverage = {}
            if PHASE7_COVERAGE_FILE.exists():
                try:
                    with open(PHASE7_COVERAGE_FILE, "r", encoding="utf-8") as f_cov:
                        matched_coverage = json.load(f_cov)
                except Exception:
                    matched_coverage = {}

            # Legacy public model IDs are preserved for existing API clients.
            # Metrics are selected from the published LOSO artifact, with no
            # made-up rep-count error or FPS values on unmeasured benchmarks.
            model_map = {
                "model_a_baseline": ("model_a_rules", "Static planar rule baseline"),
                "model_b_view_gated": ("model_b_temporal", "Temporal rule baseline"),
                "model_c_temporal": ("model_c_supervised_temporal", "Supervised temporal model"),
                "model_d_calibrated": ("model_e_uncertainty_calibrated", "Uncertainty-gated selective model"),
            }
            phase7_statistics = {}
            phase7_file = RESULTS_DIR / "phase7" / "phase7_statistical_verification.json"
            if phase7_file.exists():
                with open(phase7_file, "r", encoding="utf-8") as f_statistics:
                    phase7_statistics = json.load(f_statistics)
            calibration = phase7_statistics.get("calibration_analysis", {})

            models = {}
            ablation_table = []
            for public_id, (artifact_id, description) in model_map.items():
                if artifact_id not in overall_summary:
                    raise ValueError(f"Missing benchmark model in artifact: {artifact_id}")
                model = overall_summary[artifact_id]
                calibration_data = calibration.get(artifact_id, {})
                row = {
                    "model_id": public_id,
                    "benchmark_model_id": artifact_id,
                    "description": description,
                    "exercise_macro_f1": model["macro_f1"],
                    "balanced_accuracy": model["balanced_accuracy_pct"] / 100.0,
                    "false_warning_rate": model["false_warning_rate_pct"] / 100.0,
                    "abstention_rate": model["abstention_rate_pct"] / 100.0,
                    "retained_accuracy": model["balanced_accuracy_pct"] / 100.0,
                    "latency_p50_ms": model["inference_latency_ms"]["p50"],
                    "latency_p95_ms": model["inference_latency_ms"]["p95"],
                    "rep_mae": None,  # Not evaluated in the LOSO classification artifact.
                    "rep_rmse": None,
                    "throughput_fps": None,  # Lab inference is not webcam FPS.
                    "brier_score": calibration_data.get("brier_score"),
                    "ece": calibration_data.get("expected_calibration_error_ece"),
                }
                models[public_id] = row
                ablation_table.append({
                    "model": public_id,
                    "benchmark_model_id": artifact_id,
                    "macro_f1": row["exercise_macro_f1"],
                    "rep_mae": row["rep_mae"],
                    "false_warning_rate": row["false_warning_rate"],
                    "brier_score": row["brier_score"],
                    "retained_accuracy": row["retained_accuracy"],
                    "abstention_rate": row["abstention_rate"],
                    "latency_p50_ms": row["latency_p50_ms"],
                })

            return {
                **phase6_data,
                "models": models,
                "ablation_table": ablation_table,
                "matched_coverage": matched_coverage,
                "evidence_status": {
                    "kind": "authentic_vicon_mocap_loso",
                    "human_recordings": 200,
                    "subjects_count": 10,
                    "total_frames": 55179,
                    "total_streams_evaluated": 600,
                    "classification_valid": True,
                    "protocol": "Leave-One-Subject-Out (LOSO) 10-Fold Cross-Validation with 95% Bootstrap CIs",
                    "provenance": "University of Idaho UI-PRMD (100 Hz Vicon Optical Mocap)",
                },
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail="Benchmark artifact could not be loaded") from e

    raise HTTPException(status_code=404, detail="Verified LOSO benchmark artifact is not available.")


@router.get("/datasets")
async def get_datasets_metadata():
    """Metadata for evaluated and candidate datasets."""
    return {"datasets": [
        {
            "id": "UI-PRMD",
            "status": "evaluated_authentic_mocap",
            "recordings_used": 200,
            "label_mapping_validated": True,
            "subject_mapping_validated": True,
            "description": "University of Idaho Physical Rehabilitation Movement Dataset (10 subjects, 100Hz Vicon Optical MoCap)"
        },
        {
            "id": "UL-RED",
            "status": "candidate_dataset",
            "recordings_used": 0,
            "label_mapping_validated": False,
            "subject_mapping_validated": False,
            "description": "Upper Limb Rehabilitation Exercise Dataset"
        },
        {
            "id": "RepCount",
            "status": "candidate_dataset",
            "recordings_used": 0,
            "label_mapping_validated": False,
            "subject_mapping_validated": False,
            "description": "Repetition Counting in Repetitive Video Dataset"
        },
        {
            "id": "KIMORE",
            "status": "candidate_dataset",
            "recordings_used": 0,
            "label_mapping_validated": False,
            "subject_mapping_validated": False,
            "description": "Kinect Motion Interactive Rehabilitation Exercise Dataset"
        }
    ]}


@router.post("/evaluate")
async def evaluate_custom_sequence(req: ModelEvaluationRequest):
    """Run interactive model evaluation on a custom pose landmark sequence."""
    if req.model_id not in _MODELS:
        raise HTTPException(status_code=400, detail=f"Unknown model_id: {req.model_id}")

    model = _MODELS[req.model_id]()
    res = model.predict(req.landmarks_sequence, exercise=req.exercise)

    return {
        "model_id": req.model_id,
        "exercise_prediction": res.exercise_prediction,
        "rep_count": res.rep_count,
        "rep_phase": res.rep_phase,
        "observed_form_issues": res.observed_form_issues,
        "confidence_score": res.confidence_score,
        "assessment_status": res.assessment_status.value,
        "visibility_status": res.visibility_status,
        "view_type": res.view_type,
        "explanation_evidence": res.explanation_evidence,
        "suppressed_warnings": res.suppressed_warnings,
        "smoothness_score": res.smoothness_score,
        "symmetry_ratio": res.symmetry_ratio,
    }
