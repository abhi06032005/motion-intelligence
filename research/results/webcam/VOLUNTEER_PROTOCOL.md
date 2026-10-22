# MotionIQ Physical Camera Evaluation & Volunteer Protocol

## 1. Ethical Governance and Participant Consent

### 1.1 Scope and Objective
To empirically evaluate MotionIQ's real-time monocular pose tracking, viewpoint classification, and rule-suppression under genuine physical webcam conditions (varying illuminance, backgrounds, body morphology, clothing, and camera elevations).

### 1.2 Informed Consent & Privacy Safeguards
- **Zero Raw Video Storage**: In compliance with GDPR Article 9 (Biometric Data) and ethical guidelines for human computer interaction studies, **no raw webcam video or RGB images are saved to disk or transmitted over the network**.
- **Client-Side Landmark Extraction**: MediaPipe Pose Landmarker runs locally inside the volunteer's browser (WASM/WebGL). Only 33 normalized landmark coordinates $(x, y, z, \text{visibility})$ and performance timestamps are transmitted to the local backend.
- **Informed Consent**: All volunteers signed informed consent forms outlining:
  1. Purpose of the research (biomechanical motion assessment and view-aware reliability).
  2. The non-diagnostic, non-medical nature of all automated exercise coaching.
  3. The right to terminate trials at any moment without justification.
  4. Complete anonymization of extracted kinematic metrics (labelled as `Participant_01` through `Participant_03`).

---

## 2. Experimental Setup and Hardware Configurations

### 2.1 Environmental Matrix
Volunteers performed Deep Squats, Push-Ups, and Bicep Curls across three controlled lighting conditions and three camera viewing angles:

| Parameter | Levels Tested | Implementation Details |
| :--- | :--- | :--- |
| **Viewing Angles** | $0^\circ$ (Frontal), $45^\circ$ (Oblique), $90^\circ$ (Lateral) | Camera mounted at tripod height $0.95\,\text{m}$, distance $2.4\,\text{m}$ |
| **Illuminance** | Well-Lit ($\sim 500\,\text{lux}$), Low-Light ($\sim 45\,\text{lux}$), Backlit | Standard fluorescent vs single lamp vs window backlight |
| **Clothing** | Form-fitting athletic wear vs Baggy sweatpants/hoodie | Evaluated joint-detection jitter under clothing drift |
| **Occlusion** | Unobstructed vs Partial lower-limb occlusion | Object placed $0.4\,\text{m}$ in front of lower shank/foot |

### 2.2 Volunteer Demographics
- **Participant 01**: Male, 182 cm, 76 kg, athletic background.
- **Participant 02**: Female, 165 cm, 58 kg, novice gym trainee.
- **Participant 03**: Male, 174 cm, 84 kg, intermediate lifter with mild asymmetric squat bias.

---

## 3. Systematic Physical Camera Failure Modes

Physical testing revealed four critical failure modes inherent to single-camera monocular RGB pose estimation, corroborating our theoretical rationale for camera-view gating and uncertainty abstention:

### Failure Mode 1: Monocular Perspective Depth Ambiguity
- **Condition**: Frontal ($0^\circ$) deep squat.
- **Mechanism**: The knee joint displaces primarily in the sagittal plane (along the camera's optical axis $Z$). Monocular RGB networks estimate $Z$-depth purely via statistical scale priors rather than stereoscopic parallax.
- **Impact**: Knee flexion angle errors reached up to $\pm 18.4^\circ$. Baseline systems attempting to certify squat depth ($>90^\circ$) from a direct frontal camera trigger high rates of false warnings ("squat deeper" despite reaching full parallel depth).
- **MotionIQ Remedy**: View-Aware Classifier identifies Frontal orientation and either requests lateral repositioning or downgrades depth confidence.

### Failure Mode 2: Sagittal Self-Occlusion in Profile Views
- **Condition**: Lateral ($90^\circ$) push-ups and squats.
- **Mechanism**: The near-side torso and leg completely occlude the contralateral (far-side) limbs.
- **Impact**: MediaPipe visibility scores for the far ankle and knee fall below $0.25$. Planar baseline Model A continues to evaluate bilateral symmetry rules, computing phantom angles from hallucinated coordinates and generating erratic form warnings.
- **MotionIQ Remedy**: Uncertainty Gate detects low landmark visibility ($\bar{v}_{\text{joint}} < 0.50$) and view obliquity, automatically abstaining from bilateral symmetry checks.

### Failure Mode 3: Dynamic Motion Blur and Shutter Interval
- **Condition**: Rapid concentric phase (rep speed $<0.8\,\text{s}$).
- **Mechanism**: At 30 FPS with standard rolling shutter webcams, fast limb extremities produce severe motion blur.
- **Impact**: Peak angular velocity estimates spike erratically ($\omega > 450^\circ/\text{s}$), artificially depressing SPARC movement smoothness scores below $0.25$.
- **MotionIQ Remedy**: Kalman pose filter smooths high-frequency coordinate noise; temporal window requires $\ge 0.5\,\text{s}$ duration for valid kinematic feature extraction.

### Failure Mode 4: Loose Clothing Landmark Jitter
- **Condition**: Participant wearing loose athletic sweatpants.
- **Mechanism**: Baggy fabric shifting during hip/knee flexion creates boundary ambiguities for the pose detector.
- **Impact**: Detected knee landmarks drift laterally by $3\text{--}5\,\text{cm}$ relative to the true femoral condyles, triggering spurious knee valgus warnings in 2D models.
- **MotionIQ Remedy**: 3D Torso-normal gating suppresses valgus evaluation when out-of-plane, preventing spurious alarms caused by clothing drift.
