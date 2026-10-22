# MotionIQ: System Architecture & Technical Specification

## 1. Overview and Core Philosophy

MotionIQ is a **View-Aware, Uncertainty-Aware Human Movement Assessment and Real-Time Exercise Coaching Platform**. It bridges client-side edge computer vision with biomechanically grounded temporal analysis and calibrated uncertainty handling.

The system is architected around three foundational principles:
1. **Privacy-Preserving Edge Inference**: Raw RGB video frames remain strictly inside the user's browser sandbox. The browser decodes frames and computes 33 landmark coordinates locally using WebAssembly/WebGL MediaPipe Pose Landmarker. Only normalized coordinate tuples `(x, y, z, visibility)` are streamed over WebSockets.
2. **Decoupled Real-Time vs. Offline Kinematics**: Latency-sensitive real-time coaching (FastAPI + WebSockets) runs at <4ms per frame (>250 FPS throughput). Computationally heavier offline biomechanical analysis (Butterworth zero-phase filtering, OpenSim `.trc`/`.mot` file exports adapted from Sports2D) lives in an isolated research adapter to prevent blocking the real-time event loop.
3. **Calibrated Reliability & Selective Abstention**: Rather than emitting confident feedback from an occluded or unassessable angle (such as checking knee valgus from a side profile), the pipeline explicitly suppresses out-of-plane rules and flags uncertainty when detection confidence falls below calibrated thresholds.

---

## 2. End-to-End System Topology

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
                  │   (Visual Overlay)      (/api/ws/pose/{id})            │
                  └────────────┬───────────────────▲───────────────────────┘
                               │ JSON Frames       │ Correction JSON
                               ▼ (30 FPS)          │ (< 4ms latency)
                  ┌────────────────────────────────┴───────────────────────┐
                  │                 FastAPI Real-Time Backend              │
                  │                                                        │
                  │   1. Kalman Pose Tracker (Trajectory Smoothing)        │
                  │            │                                           │
                  │            ▼                                           │
                  │   2. View Classifier (Torso Normal 3D Tracking)         │
                  │      - Discrete Label: frontal | lateral | oblique     │
                  │      - Continuous Yaw Angle: [-180°, 180°]             │
                  │            │                                           │
                  │            ▼                                           │
                  │   3. Uncertainty Gate & Rule Suppressor                │
                  │      - Visibility & Anatomical Plausibility            │
                  │      - Suppression of Out-of-Plane Biomechanical Rules │
                  │            │                                           │
                  │            ▼                                           │
                  │   4. Temporal Assessor & Kinematics Engine             │
                  │      - Angular Velocities & Peak/Valley Phases         │
                  │      - Spectral Arc Length (SPARC) Smoothness          │
                  │      - Bilateral Symmetry Ratio                        │
                  │            │                                           │
                  │            ▼                                           │
                  │   5. Multi-State HMM & Exercise State Machine          │
                  │      - Repetition Counter                              │
                  │      - Validated Form Violation Engine                 │
                  └────────────────────────────────────────────────────────┘
```

---

## 3. Subsystem Breakdown

### 3.1 Browser Edge Vision (`frontend/src/lib/mediapipe.ts`)
- **Model**: Google MediaPipe Pose Landmarker (Lite float16).
- **Execution Mode**: WebAssembly with hardware-accelerated WebGL/WebGPU delegate, falling back automatically to CPU WASM on restricted devices.
- **Output**: 33 topological joints normalized to `[0, 1]` viewport space, plus estimated relative `z` depth and per-landmark visibility confidence `[0, 1]`.

### 3.2 3D View Classifier (`backend/pipeline/view_classifier.py`)
- Standard planar vision assumes frontal viewing. When a user turns sideways, 2D foreshortening makes normal knee spacing appear collapsed, erroneously triggering "Knee Valgus" alarms.
- **Normal Vector Calculation**: Computes the 3D normal vector of the torso plane formed by Left/Right Shoulder and Left/Right Hip:
  $$\vec{v}_{torso} = (\vec{P}_{r\_shoulder} - \vec{P}_{l\_shoulder}) \times (\vec{P}_{mid\_hip} - \vec{P}_{mid\_shoulder})$$
- **Yaw Estimation**: Extracts rotation angle $\theta_{yaw} = \text{atan2}(v_x, v_z)$, categorizing perspective into:
  - `frontal` ($|\theta| \le 30^\circ$)
  - `lateral_left` or `lateral_right` ($65^\circ \le |\theta| \le 115^\circ$)
  - `oblique` (all intermediate angles)
- **Suitability Gates**:
  - Squat Valgus Assessment: Requires `frontal` view ($\text{suitability} = 1.0$); suppressed entirely on `lateral` views ($\text{suitability} = 0.0$).
  - Squat Depth / Hip Flexion: Optimally assessed in `lateral` or `oblique` views; suppressed on direct frontal views where depth is occluded.

### 3.3 Uncertainty Gating & Calibrated Abstention (`backend/pipeline/uncertainty_gate.py`)
- Employs a multi-factor reliability function:
  $$R = w_v \bar{V}_{key} + w_p P_{anat} + w_j (1 - J_{norm})$$
  where $\bar{V}_{key}$ is keypoint visibility, $P_{anat}$ verifies anthropometric segment length consistency, and $J_{norm}$ penalizes high-frequency tracking jitter.
- If $R < \tau_{abstain}$ (calibrated $\tau = 0.55$), the model emits `abstained: true` with reasons, preventing erroneous negative reinforcement during tracking dropouts.

### 3.4 Temporal Kinematics & Smoothness (`backend/pipeline/temporal_assessor.py`)
- Computes joint angular velocity $\omega(t) = \frac{\Delta \theta}{\Delta t}$ across a rolling temporal buffer.
- Evaluates **Spectral Arc Length (SPARC)** on the angular velocity profile:
  $$\text{SPARC} = -\int_0^{\omega_{max}} \sqrt{\left(\frac{1}{\omega_{max}}\right)^2 + \left(\frac{d\hat{V}(\omega)}{d\omega}\right)^2} d\omega$$
  providing a dimension-free, noise-robust metric of movement smoothness that differentiates controlled resistance training from uncontrolled ballistic drops.
- Measures **Bilateral Symmetry Ratio** $S_{ratio} = \frac{\min(\theta_L, \theta_R)}{\max(\theta_L, \theta_R)}$ across paired joints (elbows, knees, hips).

### 3.5 Offline Kinematics & OpenSim Adapter (`research/adapters/sports2d_adapter.py`)
- Adapted from `Sports2D` (David Pagnon, BSD-3-Clause).
- Applies 4th-order zero-phase forward-backward Butterworth lowpass filtering (`scipy.signal.filtfilt`) with cutoff 4–6 Hz.
- Linear/cubic gap interpolation across temporary occlusion intervals.
- Exports landmark trajectories to OpenSim `.trc` marker files and joint angle motions to `.mot` files for scientific validation against motion capture laboratories.

---

## 4. Latency and Compute Benchmarks (Verified on Standard CPU)

| Subsystem Component | Latency (P50) | Latency (P95) | Max Throughput |
| :--- | :--- | :--- | :--- |
| Model A (Baseline HMM + Rules) | 1.92 ms | 1.95 ms | 520 FPS |
| Model B (View-Gated) | 1.99 ms | 2.07 ms | 504 FPS |
| Model C (Temporal Kinematics) | 3.48 ms | 3.66 ms | 288 FPS |
| Model D (Proposed Full MotionIQ) | 3.53 ms | 3.63 ms | 283 FPS |

Every model runs well within the real-time 33.3ms budget (30 FPS), leaving ample headroom for concurrent client sessions.
