# MotionIQ: Dataset Provenance, Reused Software & Licences (Phase 7)

## 1. Primary Research Dataset

### The University of Idaho Physical Rehabilitation Movement Dataset (UI-PRMD)
- **Official Citation**: Vakanski, A., Jun, H. P., Paul, S., & Baker, R. (2018). *A Data Set of Human Body Movements for Physical Rehabilitation Exercises*. Data, 3(1), 2. [https://doi.org/10.3390/data3010002](https://doi.org/10.3390/data3010002)
- **Licence**: Creative Commons Attribution 4.0 International (CC BY 4.0).
- **Authors**: Aleksandar Vakanski, Hyoung P. Jun, Samiksha Paul, and Russell Baker (University of Idaho).
- **Modality**: 8-camera optical Vicon motion-capture system sampling at 100 Hz (Plug-in Gait marker topology) and two Microsoft Kinect v2 sensors.
- **Inventory in MotionIQ**: 200 authentic Deep Squat recordings (`m01_s01_e01` through `m01_s10_e10`), comprising 10 human subjects, 10 episodes each, 100 optimal and 100 non-optimal trials (55,179 frames total).
- **Integrity**: Verified via SHA-256 hashes in [`research/data/REAL_DATA_MANIFEST.md`](../research/data/REAL_DATA_MANIFEST.md).

---

## 2. Reused Open-Source Software & Upstream Attribution

### 2.1 Upstream Application Codebase
- **Repository**: [https://github.com/shahmir2004/exercise-form-correction](https://github.com/shahmir2004/exercise-form-correction)
- **Licence**: MIT Licence. Copyright (c) 2024 Shahmir.
- **Reused Components**:
  - FastAPI WebSocket connection lifecycle and base route handlers (`backend/api/`).
  - Core exercise state machines, rep inflection counter, and joint angle utilities (`backend/state_machine/`, `backend/exercises/`).
  - Eight static yoga posture rules (`backend/api/yoga_routes.py`).
- **Modifications in MotionIQ**:
  - Added 3D Torso-Normal Camera Viewpoint Classifier.
  - Added View-Aware Rule Gating (suppressing coronal valgus checks under lateral profiles).
  - Added Temporal Trajectory Assessor (SPARC movement smoothness and angular velocities).
  - Added Calibrated Uncertainty Gate with selective classification (abstention).

### 2.2 Secondary Biomechanical Toolkit (Offline Research Adapter)
- **Repository**: [https://github.com/davidpagnon/Sports2D](https://github.com/davidpagnon/Sports2D)
- **Licence**: BSD-3-Clause Licence. Copyright (c) 2023 David Pagnon.
- **Reused Components**: Kinematic joint angle conventions, Butterworth low-pass filter design, and 2D calibration adapters in `backend/sports2d/`.

### 2.3 Pose Estimation Engine
- **Repository**: [https://github.com/google-ai-edge/mediapipe](https://github.com/google-ai-edge/mediapipe)
- **Licence**: Apache Licence 2.0. Copyright (c) Google LLC.
- **Reused Components**: Official MediaPipe Pose Landmarker browser API (BlazePose Lite / Full WebGL) executing client-side in Google Chrome Web Workers.

---

## 3. MotionIQ Original Contributions & Software Licence

- **Project Licence**: MIT Licence. Copyright (c) 2026 MotionIQ Contributors.
- **Newly Authored Modules**:
  1. `backend/pipeline/view_classifier.py`: 3D Torso-Normal Camera Azimuth Estimator.
  2. `backend/pipeline/temporal_assessor.py`: Continuous trajectory kinematics & SPARC smoothness calculator.
  3. `backend/pipeline/uncertainty_gate.py`: Selective prediction & reliability gating engine.
  4. `backend/models/model_c_temporal.py`, `model_d_calibrated.py`: View-aware & uncertainty-gated model interfaces.
  5. `research/datasets/uiprmd_loader.py`: Optical Vicon mo-cap ingestion & metric perspective camera projector.
  6. `research/evaluation/run_phase6_evaluation.py` & `verify_phase7_statistics.py`: Independent LOSO cross-validation and paired statistical verification suites.
  7. `frontend/src/app/research/page.tsx`: Interactive Research Evidence Dashboard.
