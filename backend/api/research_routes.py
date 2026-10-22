"""Research Benchmark API router.

Exposes historical fixture metrics, dataset metadata, and comparative
model evaluation endpoints to the MotionIQ frontend research dashboard.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from models.model_a_baseline import ModelABaseline
from models.model_b_view_gated import ModelBViewGated
from models.model_c_temporal import ModelCTemporal
from models.model_d_calibrated import ModelDCalibrated

router = APIRouter(prefix="/research", tags=["research"])

ARTIFACTS_DIR = Path(__file__).resolve().parents[2] / "research" / "artifacts"
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
    landmarks_sequence: List[List[Dict[str, float]]]


@router.get("/summary")
async def get_research_summary():
    """Return original numbers with explicit evidence limitations; do not modify the file."""
    if not SUMMARY_FILE.exists():
        raise HTTPException(status_code=404, detail="Benchmark artifacts not found.")
    try:
        with open(SUMMARY_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        data["evidence_status"] = {
            "kind": "synthetic_fixture_only",
            "human_recordings": 0,
            "classification_valid": False,
            "reason": "True exercise supplied to Models B/C/D; duplicate inputs across splits",
            "calibration_validated": False,
            "latency_scope": "Offline sequence processing divided by frame count; not end-to-end",
            "report": "docs/EVALUATION_AUDIT.md",
        }
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/datasets")
async def get_datasets_metadata():
    """Candidate datasets only; none contributed recordings to the saved benchmark."""
    return {"datasets": [
        {"id": dataset, "status": "not_evaluated_no_source_recordings",
         "recordings_used": 0, "label_mapping_validated": False,
         "subject_mapping_validated": False}
        for dataset in ("UI-PRMD", "UL-RED", "RepCount", "KIMORE")
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
