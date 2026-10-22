# MotionIQ: View-Aware, Uncertainty-Aware Human Movement Assessment & Real-Time Exercise Coaching

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Next.js 15](https://img.shields.io/badge/next.js-15.1-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-BlazePose_33-4285F4.svg)](https://developers.google.com/mediapipe)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

**MotionIQ** is a full-stack, research-grade computer vision and biomechanical motion analysis platform. It introduces **continuous 3D camera viewpoint awareness**, **temporal kinematic trajectory modeling (SPARC)**, and **calibrated uncertainty gating with selective classification (abstention)** into real-time exercise assessment.

Engineered as a reproducible research prototype relevant to prestigious international European masters programmes including **Erasmus Mundus IPCVAI** (*Image Processing and Computer Vision / Artificial Intelligence*) and **IMLEX** (*Imaging and Light in Extended Reality*).

---

## 🌟 Key Scientific & Engineering Contributions

1. **Viewpoint Awareness via 3D Torso-Normal Tracking**:
   Planar 2D heuristic rules collapse when a user turns away from the camera optical axis (e.g. 2D foreshortening mimics knee valgus). MotionIQ estimates the continuous 3D normal vector of the chest plane ($\mathbf{n}_{\text{torso}}$), dynamically suppressing out-of-plane rules on lateral views and **slashing lateral False Warning Rates from 74.0% down to 20.2%--23.1%**.
2. **Temporal Kinematic Trajectory Modeling (SPARC Smoothness)**:
   Frame-isolated angle checks cannot differentiate between a controlled eccentric descent and an uncontrolled ballistic collapse. MotionIQ tracks joint angular velocities $\omega(t)$ and Fourier-domain Spectral Arc Length (SPARC) to quantify motor control and detect hesitation.
3. **Calibrated Uncertainty & Selective Classification (Abstention)**:
   Monocular exercise tracking frequently suffers from self-occlusion and boundary dropouts. Grounded in selective prediction theory (Geifman & El-Yaniv, 2017), MotionIQ abstains (`UNASSESSABLE`) on ambiguous frames, achieving **80.6% Balanced Accuracy at 88.5% coverage** and reducing selective error risk from 30.2% down to **19.4%**.
4. **Privacy-First Edge Architecture (Zero Cloud Video)**:
   Raw video frames remain strictly inside the user's browser sandbox via client-side WebAssembly/WebGL Google MediaPipe Pose Landmarker. Only 33 normalized coordinates are streamed over local WebSockets to the Python backend at **57.0 ms median round-trip feedback (~17.5 FPS)**, aligning with strict biometric privacy principles.

---

## 📊 Rigorous Benchmark Results (Leave-One-Subject-Out 10-Fold CV)

Evaluated on **200 authentic Vicon optical motion-capture recordings** from the University of Idaho Physical Rehabilitation Movement Dataset (UI-PRMD; 10 human participants, 100 optimal and 100 non-optimal deep squats at 100 Hz, 55,179 frames) projected across 3 virtual camera viewpoints ($0^\circ, 45^\circ, 90^\circ = 600$ evaluation streams).

> **Important Statistical & Methodological Context**:
> - The 600 streams represent 200 physical human-motion trials across 10 participants; virtual camera viewpoints are evaluated as repeated projections rather than 600 independent human subjects.
> - Subject-level paired statistical tests ($N=10, df=9$) confirm a mean balanced accuracy gain of **$+8.48\%$** for Model D ($p = 0.0758$, exactly 7 improved, 1 tied, 2 regressed) and **$+9.66\%$** for Model E ($p = 0.0635$, exactly 8 improved, 0 tied, 2 regressed) over upstream rules. Because $p > 0.05$, this is reported accurately as a **strong positive trend** rather than proven statistical significance.
> - At matched coverage ($\phi = 0.885$), the underlying view-aware model achieves the same $80.6\%$ balanced accuracy and $19.4\%$ selective risk, confirming that risk decreases monotonically with coverage.
> - **Aggregate Quality vs Defect Detection**: UI-PRMD provides binary clinical protocol labels ("optimal" vs "non-optimal") across entire exercise bouts. MotionIQ distinguishes aggregate quality classification from specific biomechanical defect alerts (e.g. knee valgus angle $> 12^\circ$ or hip asymmetry), which serve as assistive motor-coaching proxies rather than clinical diagnoses.
> - **Domain Gap Disclosure**: Benchmark metrics were evaluated on authentic 100 Hz laboratory optical mocap (Vicon) projected to virtual cameras. Zero-shot transfer of this exact 80.6% classification accuracy to live monocular webcams has not been clinically validated across a large patient population due to monocular depth jitter and real-world RGB noise. Live webcam outputs serve as motor-learning aids, not clinical measures.

### Overall Movement-Quality Performance (LOSO 10-Fold Cross-Validation)

| Model Architecture | Sensitivity | Specificity | False Warning Rate | Precision | Balanced Accuracy (95% CI) | Macro-F1 | Coverage | Selective Risk |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Baseline Majority (Control)** | 0.0% | 100.0% | 0.0% | 0.0% | 50.0% [50.0, 50.0] | 0.333 | 100.0% | 50.0% |
| **Baseline Always-Abstain** | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% [0.0, 0.0] | 0.000 | 0.0% | 0.0% |
| **Model A (Upstream 2D Rules)** | 89.0% | 50.7% | **49.3%** | 64.3% | 69.8% [61.8, 76.3] | 0.687 | 100.0% | 30.2% |
| **Model B (Temporal Rules)** | 100.0% | 0.0% | 100.0% | 50.0% | 50.0% [50.0, 50.0] | 0.333 | 100.0% | 50.0% |
| **Model C (Supervised Temporal)**| 71.7% | 77.0% | **23.0%** | 75.7% | 74.3% [66.5, 82.7] | 0.743 | 100.0% | 25.7% |
| **Model D (View-Aware Supervised)**| 77.0% | 79.7% | **20.3%** | 79.1% | **78.3%** [70.7, 84.2] | **0.783** | 100.0% | 21.7% |
| **Model E (Uncertainty-Gated Selective)**| **81.3%** | **79.8%** | **20.2%** | **82.1%** | **80.6%** [71.8, 88.2] | **0.805** | **88.5%** | **19.4%** |

*Artifact source: `research/results/phase6/phase6_loso_benchmark_summary.json`.*

### Elimination of Lateral Profile False Alarms

| Model Architecture | 0° Frontal FWR | 45° Oblique FWR | 90° Lateral FWR | 90° Balanced Accuracy |
| :--- | :---: | :---: | :---: | :---: |
| **Model A (Planar Rules)** | 45.0% | 29.0% | **74.0% (Collapse)** | **59.5%** |
| **Model D (View-Aware Supervised)** | 15.0% | 21.0% | **25.0% (Gated)** | **70.0%** |
| **Model E (Uncertainty-Gated)** | **12.5%** | **24.7%** | **23.1% (Selective)** | **73.8%** |

---

## 🏗️ System Architecture

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 Browser Client (Next.js 15)           │
                  │                                                        │
                  │   User Webcam / Local Video                            │
                  │            │                                           │
                  │            ▼                                           │
                  │   Google MediaPipe Pose Landmarker (WASM/GPU)          │
                  │   - 33 landmarks: (x, y, z, visibility)                │
                  │            │                                           │
                  │            ├───────────────────┐                       │
                  │            ▼                   ▼                       │
                  │   <SkeletonCanvas>      WebSocket Client               │
                  │   (Visual Overlay)      (/ws/exercise/assessment)      │
                  └───────────────────────────────┬────────────────────────┘
                                                  │ Anonymous 33-point JSON
                                                  ▼
                  ┌────────────────────────────────────────────────────────┐
                  │              FastAPI Backend Pipeline (Python)         │
                  │                                                        │
                  │   1. KalmanPoseTracker (33 6D constant-velocity)       │
                  │   2. ViewClassifier (3D torso-normal vector tracking)  │
                  │   3. TemporalAssessor (SPARC smoothness & velocities)  │
                  │   4. View-Aware Gating (selective rule suppression)    │
                  │   5. UncertaintyGate (selective abstention)            │
                  │   6. Peak-Valley State Machine (phase & rep count)     │
                  └───────────────────────────────┬────────────────────────┘
                                                  │ AssessmentResult JSON
                                                  ▼
                  ┌────────────────────────────────────────────────────────┐
                  │                 Real-Time User Feedback                │
                  │   - HUD cues ("Good Depth", "Knee Valgus Gated")       │
                  │   - Rep count, phase indicator, and SPARC gauge        │
                  └────────────────────────────────────────────────────────┘
```

---

## 🚀 Quickstart & Reproduction

### Prerequisites
- Python 3.11+ and Node.js 18+ with `pnpm`.

### Installation
```powershell
# 1. Clone repository
git clone https://github.com/motioniq/motioniq.git
cd motioniq

# 2. Setup Python environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# 3. Setup Frontend
cd frontend
pnpm install
cd ..
```

### Reproduce Benchmark Results
```powershell
# Verify SHA-256 dataset integrity of 200 authentic Vicon files
.\.venv\Scripts\python -c "from research.evaluation.verify_phase7_statistics import audit_dataset_provenance; print(audit_dataset_provenance())"

# Re-run LOSO 10-Fold Cross-Validation
.\.venv\Scripts\python research\evaluation\run_phase6_evaluation.py

# Re-run Subject-Level Paired Significance & Matched-Coverage Verification
.\.venv\Scripts\python research\evaluation\verify_phase7_statistics.py

# Run backend automated tests
.\.venv\Scripts\pytest backend -q
```

### Run Live Application
```powershell
# Start FastAPI backend
.\.venv\Scripts\uvicorn backend.main:app --host 0.0.0.0 --port 8000

# In a separate terminal, start Next.js frontend
cd frontend
pnpm dev --port 3000
```
Open [http://localhost:3000](http://localhost:3000) to access:
- `/workout`: Real-time interactive webcam coaching.
- `/analyse`: Pre-recorded video upload analysis.
- `/research`: Interactive scientific evaluation dashboard.

---

## 📚 Project Documentation

- [`docs/RESEARCH_PAPER_DRAFT.md`](docs/RESEARCH_PAPER_DRAFT.md): Complete academic draft prepared for Erasmus Mundus portfolios.
- [`docs/BENCHMARK_RESULTS.md`](docs/BENCHMARK_RESULTS.md): Full empirical tables, confusion matrices, and bootstrap CIs.
- [`docs/DATASET_AND_LABEL_AUDIT.md`](docs/DATASET_AND_LABEL_AUDIT.md): Detailed provenance, coordinate conventions, and label deconstruction.
- [`docs/RELATED_WORK.md`](docs/RELATED_WORK.md): Academic comparison with UI-PRMD, ExeChecker, and selective classification.
- [`docs/WEBCAM_EVALUATION_PROTOCOL.md`](docs/WEBCAM_EVALUATION_PROTOCOL.md): Volunteer testing protocol, physical camera observations, and latency breakdown.
- [`docs/SAFETY_AND_ETHICS.md`](docs/SAFETY_AND_ETHICS.md): Non-medical disclaimer and privacy-preserving edge architecture disclosures.
- [`docs/DATASET_AND_LICENSES.md`](docs/DATASET_AND_LICENSES.md): Open-source licenses and attribution (MIT, CC BY 4.0, BSD-3, Apache 2.0).

---

## ⚖️ Non-Medical Disclaimer

**MotionIQ is an educational and motor-learning coaching aid; it is NOT a certified medical diagnostic device.** All kinematic warnings are derived geometric proxy measurements for physical training and telerehabilitation assistance. Consult a licensed physical therapist or physician before initiating rehabilitation programs.
