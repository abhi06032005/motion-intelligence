# Upstream Open-Source Audit & Reuse Specification

**Project:** MotionIQ (View-Aware and Uncertainty-Aware Human Movement Assessment)  
**Date of Audit:** October 22, 2026  
**Auditor:** MotionIQ Engineering & Research Team  

---

## 1. Primary Upstream Repository Audit

### Metadata & Revision
- **Repository URL:** `https://github.com/shahmir2004/exercise-form-correction`
- **Reported License:** MIT License (confirmed in `LICENSE` file)
- **Copyright Holder:** (c) 2026 Muhammad Shahmir Ahmed
- **Pinned Commit SHA:** `b1e56f009f4db193514216914ddb4b69c49c684a`
- **Commit Date:** Mon Aug 31 02:12:01 2026 +0500
- **Upstream Branch:** `main`

### Original Capabilities
1. **FastAPI WebSocket Streaming:** `/api/ws/pose/{client_id}` receives live 33 MediaPipe landmark frames (normalized x, y, z, visibility) over WebSockets at up to 30 FPS.
2. **Pose Landmark Preprocessing:**
   - Input validation in `pipeline/validator.py` ensuring 33-point schema integrity, bounds checking, and NaN/infinity detection.
   - 3D landmark Kalman filtering in `pipeline/kalman.py` with adaptive uncertainty covariance tracking and outlier rejection.
   - Body-frame coordinate normalization in `pipeline/features.py` (hip-centered origin, torso/inter-shoulder scale normalization, and horizontal posture detection).
3. **Probabilistic State Machine & Exercise Classification:**
   - 4-state Hidden Markov Model (HMM) in `pipeline/hmm.py` enforcing smooth transitions without label flickering.
   - Rule-based classifier guards preventing false-positive exercise classification.
4. **Supported Exercise Form Evaluation:**
   - **Squats:** Knee valgus (inward collapse), forward torso lean, squat depth tracking.
   - **Push-ups:** Hip sag, incomplete lockouts, upper-body inclination tracking.
   - **Bicep Curls (Standard & Alternating):** Elbow drift/swing, incomplete range of motion, independent left/right repetition tracking.
5. **Static Held-Pose Yoga Mode:**
   - 8 yoga poses: Mountain, Tree, Warrior I, Warrior II, Chair, Triangle, Downward Dog, Cobra.
   - Joint angle tolerance bands and monotonic hold-duration timer with debounce logic.
6. **Automated Test Suite:**
   - 102 comprehensive pytest unit and integration tests passing in `backend/tests/` (verified 102 passed, 0 failed on Python 3.11/3.13).

### Dependencies & Licenses
- `fastapi` (MIT)
- `uvicorn` (BSD-3-Clause)
- `numpy` (BSD-3-Clause)
- `scipy` (BSD-3-Clause)
- `pydantic` (MIT)
- `websockets` (BSD-3-Clause)
- `aiofiles` (Apache-2.0)
- `pytest` & `pytest-asyncio` (MIT)

### Identified Gaps in Upstream Codebase
1. **Lack of View-Awareness:**
   - Geometry rules assume an ideal camera viewpoint (e.g., squat rules measure knee valgus from frontal view and hip depth from lateral view without knowing whether the camera is frontal, lateral, or oblique).
   - If a user performs a squat sideways to a camera that expects frontal view, knee valgus warnings fire erroneously.
2. **Deterministic Thresholds Without Calibration:**
   - Confidence score (`pipeline/confidence.py`) is an ad-hoc heuristic weighted sum of landmark visibility and velocity, not a calibrated statistical probability.
   - No explicit abstention mechanism: the system either accepts or guesses instead of warning the user "camera angle suboptimal" or "knee joint occluded, please reposition".
3. **No Temporal Trajectory Dynamics:**
   - Repetition phases are evaluated primarily on instantaneous angular state; angular velocities, acceleration reversals, and temporal smoothness are not modeled jointly.
4. **Vite SPA Frontend Limitations:**
   - Upstream frontend is a basic single-page Vite demo (`frontend/src/App.tsx`).
   - Lacks dedicated research dashboard, session progress analytics, consent-controlled data export, and modular component architecture.

---

## 2. Secondary Repository Audit: Sports2D

### Metadata & Revision
- **Repository URL:** `https://github.com/davidpagnon/Sports2D`
- **Reported License:** BSD 3-Clause License
- **Copyright Holder:** (c) 2023 David Pagnon
- **Pinned Commit SHA:** `e3b15be162182abbfe5d2084ac6b0d3f3d6099ed`

### Architecture & Utility Evaluation
- **Components Examined:** `Sports2D/Sports2D.py`, `Sports2D/process.py`, `Sports2D/Utilities/common.py`.
- **Valuable Biomechanical Utilities:**
  - 2D/3D joint angle kinematic calculations (Butterworth low-pass filtering, Savitzky-Golay derivative smoothing).
  - Anthropometric anatomical segment length ratios and pixel-to-meter camera calibration.
  - Standardized anatomical landmark definitions (`marker_Z_positions`).
- **Heavyweight Dependencies Warning:**
  - Sports2D depends on `av`, heavy `opencv-python`, `matplotlib`, and heavyweight video decoding libraries.
  - **Architectural Decision:** Do **not** embed full Sports2D into the low-latency production FastAPI WebSocket loop. Instead, isolate its mathematical kinematic formulas into `research/adapters/sports2d_adapter.py` for scientific evaluation and offline benchmark comparisons.

---

## 3. Pose Estimation Browser Foundation: MediaPipe

### Metadata & API
- **Official Package:** `@mediapipe/tasks-vision`
- **License:** Apache License 2.0
- **Model:** Pose Landmarker (BlazePose 33-keypoint 3D topology)
- **Deployment Strategy:** Browser-side WebGL / WebGPU acceleration. Raw RGB camera frames remain strictly inside client memory on the user's device. Only 33 normalized floating-point coordinate vectors are streamed over WebSocket to the backend.

---

## 4. Reused vs Modified vs Newly Written Modules

| Module Path | Status | Attribution & Purpose |
| :--- | :--- | :--- |
| `backend/pipeline/kalman.py` | **Reused** | 3D Landmark Kalman Filter (upstream `exercise-form-correction`) |
| `backend/pipeline/features.py` | **Reused & Extended** | Body-frame normalization, angles, posture flags |
| `backend/pipeline/hmm.py` | **Reused** | 4-state HMM exercise classification |
| `backend/pipeline/rep_counter.py` | **Reused** | Repetition state machine with eccentric/concentric phases |
| `backend/pipeline/validator.py` | **Reused** | 33-point MediaPipe payload schema validation |
| `backend/exercises/*.py` | **Reused** | Squat, pushup, bicep curl, and 8 yoga pose geometry definitions |
| `backend/state_machine/manager.py` | **Reused & Extended**| Session lifecycle and WebSocket broadcasting |
| `backend/pipeline/view_classifier.py` | **Newly Written** | Real-time viewpoint estimation (Frontal, Lateral, Oblique) |
| `backend/pipeline/uncertainty_gate.py`| **Newly Written** | Calibrated reliability gating and explicit model abstention |
| `backend/pipeline/temporal_assessor.py`| **Newly Written**| Kinematic velocity and trajectory consistency scoring |
| `backend/api/research_routes.py` | **Newly Written** | Live API serving real experimental benchmark runs and metrics |
| `frontend/src/app/**` | **Newly Written** | Next.js App Router, Tailwind CSS, shadcn/ui, Recharts |
| `research/**` | **Newly Written** | Canonical dataset adapters, baseline evaluation, ablation harness |

---

## 5. Technical Risks & Mitigations

1. **Latency Overhead of Added Layers:**
   - *Risk:* Adding view-classification and uncertainty-gating could degrade 30 FPS processing.
   - *Mitigation:* Vectorized NumPy operations; view estimation computed on shoulder-hip depth vectors in $\mathcal{O}(1)$ time ($< 0.3$ ms per frame).
2. **Camera Angle Ambiguity:**
   - *Risk:* Ambiguous angles in 2D monocular projection.
   - *Mitigation:* MediaPipe provides metric relative $Z$ depth; combining shoulder-to-shoulder vector and hip-to-hip vector yields robust azimuthal angle estimation.
3. **Medical Advice Liability:**
   - *Risk:* User interpreting coaching feedback as medical diagnosis.
   - *Mitigation:* Strict non-medical disclaimers embedded in UI, deterministic templates, and explicit safety boundaries forbidding musculoskeletal diagnosis.
