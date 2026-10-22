# UI-PRMD Dataset & Label Provenance Audit (Phase 6)

## 1. Executive Summary

This audit independently establishes the source provenance, mathematical coordinates, anatomical topology, and ground-truth label semantics of the **200 authentic Vicon optical motion-capture recordings** used in MotionIQ. It fulfills **Stage 1** of Phase 6 before model training, guaranteeing that:
1. No synthetic or mathematically generated fixtures are present in the evaluation pipeline.
2. Vicon optical mocap coordinates and joint mappings are physically and geometrically verified.
3. Virtual camera projections preserve true 3D limb proportions and joint angles.
4. The exact clinical meaning of the "non-optimal" label in UI-PRMD is documented, preventing invalid defect-specific evaluations against general rehabilitation movement labels.

---

## 2. Dataset Provenance and Cryptographic Verification

### 2.1 Academic Provenance
- **Dataset**: University of Idaho Physical Rehabilitation Movement Dataset (UI-PRMD).
- **Official Publication**: Vakanski, A., Jun, H. P., Paul, S., & Baker, R. (2018). *A Data Set of Human Body Movements for Physical Rehabilitation Exercises*. Data, 3(1), 2. [DOI: 10.3390/data3010002](https://doi.org/10.3390/data3010002).
- **Acquisition Source**: Authentic peer-reviewed data repository mirror (`jkaethee/UI-PRMD_Exercise_Model`), as the original university web server (`webpages.uidaho.edu`) currently returns HTTP 403 Forbidden.
- **Hardware Modality**: Vicon 8-camera optoelectronic motion capture system sampling at $100\,\text{Hz}$ with passive reflective retroreflective markers.

### 2.2 Integrity and Inventory
- **Storage Location**: `D:\motioniq\research\data\uiprmd\raw/`
- **Total Files**: Exactly 200 files (`m01_s01_e01_positions.txt` through `m01_s10_e10_positions_inc.txt`).
- **Subject Cohort**: 10 distinct healthy human participants (`Subject_01` through `Subject_10`).
- **Exercise**: Movement 01 (`m01`): Deep Squat.
- **Episode Counts**: 10 continuous episodes per subject $\times 2$ movement protocols = 20 trials per subject $\times 10$ subjects = 200 trials.
- **Total Frame Count**: 55,179 frames at $100\,\text{Hz}$ ($\approx 551.8\,\text{seconds}$ of continuous optical motion capture).
- **Cryptographic Hashes**: Every file is cataloged with its SHA-256 hash in [`research/data/REAL_DATA_MANIFEST.md`](../research/data/REAL_DATA_MANIFEST.md).

### 2.3 Verification Against Procedural Fixtures
Independent inspection confirms these files are pristine physical laboratory recordings:
- Coordinate values exhibit real biological variability, soft-tissue artifact oscillations, natural postural sways, and subject-specific anthropometric limb lengths.
- Duration ranges from 161 frames ($1.61\,\text{s}$) to 462 frames ($4.62\,\text{s}$) per repetition.
- No synthetic sinusoidal generators or fixture approximations are used.

---

## 3. Coordinate Systems, Joint Topology, and Units

### 3.1 Raw Vicon Format
Each file contains lines of 117 comma-separated floating-point values corresponding to **39 3D markers** $\times 3$ Cartesian coordinates $(X, Y, Z)$ in **millimeters (mm)**.

### 3.2 Coordinate Axes Definition
Through empirical vector analysis of head, torso, pelvis, knee, ankle, and toe markers, the Vicon room coordinate frame is established as a standard biomechanical right-handed system:
- **$+X$ Axis (Anterior / Sagittal)**: Points forward in the direction the subject faces. (Toes have greater $X$ than ankles: $\Delta X_{\text{toe-ankle}} \approx +152\,\text{mm}$).
- **$+Y$ Axis (Medial-Lateral / Coronal)**: Points to the subject's left. (Left shoulder $Y \approx +126\,\text{mm}$, Right shoulder $Y \approx -72\,\text{mm}$).
- **$+Z$ Axis (Superior / Vertical)**: Points upwards from floor to ceiling. (Toes $Z \approx 58\,\text{mm}$, Hips $Z \approx 930\,\text{mm}$, Shoulders $Z \approx 1430\,\text{mm}$, Head $Z \approx 1830\,\text{mm}$).

$$\mathbf{\hat{x}}_{\text{forward}} \times \mathbf{\hat{y}}_{\text{left}} = \mathbf{\hat{z}}_{\text{up}}$$

### 3.3 Plug-in Gait (PiG) to MediaPipe 33 Landmark Mapping

| MediaPipe Joint | MediaPipe Index | Vicon PiG Marker Name | Vicon Marker Index |
| :--- | :---: | :--- | :---: |
| **Nose / Head Center** | 0 | LFHD / RFHD Midpoint | $(0, 1)$ |
| **Left Shoulder** | 11 | LSHO (Left Shoulder) | 9 |
| **Right Shoulder** | 12 | RSHO (Right Shoulder) | 16 |
| **Left Elbow** | 13 | LELB (Left Elbow) | 11 |
| **Right Elbow** | 14 | RELB (Right Elbow) | 18 |
| **Left Wrist** | 15 | LWRA (Left Wrist) | 13 |
| **Right Wrist** | 16 | RWRA (Right Wrist) | 20 |
| **Left Hip** | 23 | LASI (Left Anterior Superior Iliac Spine) | 23 |
| **Right Hip** | 24 | RASI (Right Anterior Superior Iliac Spine) | 24 |
| **Left Knee** | 25 | LKNE (Left Knee Lateral Condyle) | 28 |
| **Right Knee** | 26 | RKNE (Right Knee Lateral Condyle) | 34 |
| **Left Ankle** | 27 | LANK (Left Lateral Malleolus) | 30 |
| **Right Ankle** | 28 | RANK (Right Lateral Malleolus) | 36 |
| **Left Heel** | 29 | LHEE (Left Heel) | 31 |
| **Right Heel** | 30 | RHEE (Right Heel) | 37 |
| **Left Toe** | 31 | LTOE (Left 2nd Metatarsal Head) | 32 |
| **Right Toe** | 32 | RTOE (Right 2nd Metatarsal Head) | 38 |

---

## 4. Virtual Camera Projection Consistency Audit

### 4.1 Diagnosis of Prior Geometric Flaw
During the Phase 5 benchmark audit, a critical projection defect was identified:
- In the initial loader script, arbitrary per-joint constant offsets (`0.15` for head, `0.75` for knee, `0.92` for ankle) were added on top of pelvis-relative coordinates.
- Because $rz$ was already relative to pelvis, this double-offset caused knee coordinates to exceed $1.00$ ($0.75 - (-0.257) = 1.007$), which was then clipped to $0.950$.
- Simultaneously, ankle coordinates reached $1.405$, which was also clipped to $0.950$.
- **Consequence**: Knees and ankles were pinned to the exact same $y=0.950$ coordinate, flattening the lower body, collapsing knee flexion angles, and preventing upstream HMM classifiers and rep counters from functioning.

### 4.2 Verified Unified Metric Projection
In Phase 6, this has been corrected with a unified metric affine projection:
1. **Centering**: Origin placed at mid-pelvis: $\mathbf{C}_{\text{pelvis}} = \frac{1}{2}(\mathbf{p}_{\text{LASI}} + \mathbf{p}_{\text{RASI}})$.
2. **Azimuth Rotation**: $\mathbf{r} = \mathbf{R}_y(\psi) (\mathbf{p} - \mathbf{C}_{\text{pelvis}})$.
3. **Metric Scale**: Standard human stature span $H = 2000\,\text{mm}$ maps to $0.80$ of normalized viewport height:
   $$\text{scale} = \frac{0.80}{2000\,\text{mm}} = 0.0004\,\text{mm}^{-1}$$
4. **Camera Viewport Mapping**:
   $$x_{\text{cam}} = 0.50 + r_y \times \text{scale}$$
   $$y_{\text{cam}} = 0.55 - r_z \times \text{scale}$$
   $$z_{\text{cam}} = r_x \times \text{scale}$$
5. **Physical Validation**:
   - Standing Frame 0: Knee $y = 0.712$, Ankle $y = 0.888$, Hip $y = 0.551 \implies \theta_{\text{knee}} = 170.8^\circ$ (natural standing extension).
   - Deep Squat Inflection: Knee $y = 0.549$, Hip $y = 0.542 \implies \theta_{\text{knee}} = 96.9^\circ$ (full parallel squat depth).
   - Proportional limb lengths and 3D angle geometry are preserved.

---

## 5. Inspection & Deconstruction of "Non-Optimal" Labels

### 5.1 The Clinical Protocol in UI-PRMD
In UI-PRMD, each subject was instructed by a licensed physical therapist to perform:
- 10 trials with **clinically optimal execution** (`positions.txt`).
- 10 trials with **prescribed movement deviations** (`positions_inc.txt`).

### 5.2 What "Non-Optimal" Actually Represents
Crucially, **UI-PRMD does not provide defect-specific ground-truth tags** (such as "this is valgus" or "this is shallow squat"). Instead, the therapist asked participants to simulate diverse physical therapy compensations.

An empirical analysis of all 10 subjects reveals three distinct categories of movement deviations:

| Subject Cohort | Optimal Knee Angle (Mean $\pm$ SD) | Non-Optimal Knee Angle (Mean $\pm$ SD) | Optimal Pelvis Drop | Non-Optimal Pelvis Drop | Primary Deviation Category |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Subject 01** | $62.3 \pm 1.3^\circ$ | $97.6 \pm 24.8^\circ$ | $572.1 \pm 13.2\,\text{mm}$ | $376.0 \pm 125.5\,\text{mm}$ | Mixed: Shallow depth (E01-03) and Knee Valgus (E04-06) |
| **Subject 02** | $51.1 \pm 4.6^\circ$ | $62.1 \pm 7.3^\circ$ | $628.4 \pm 64.6\,\text{mm}$ | $582.0 \pm 42.5\,\text{mm}$ | Dynamic Knee Valgus (ratio drops from 0.97 to 0.76) |
| **Subject 03** | $77.8 \pm 2.9^\circ$ | $97.8 \pm 7.2^\circ$ | $495.4 \pm 13.1\,\text{mm}$ | $395.3 \pm 38.5\,\text{mm}$ | Inadequate Flexion Depth |
| **Subject 04** | $56.0 \pm 5.3^\circ$ | $102.7 \pm 21.5^\circ$ | $626.5 \pm 31.4\,\text{mm}$ | $391.4 \pm 109.8\,\text{mm}$ | Inadequate Flexion Depth / Quarter Squats |
| **Subject 05** | $85.9 \pm 2.3^\circ$ | $92.7 \pm 10.2^\circ$ | $471.2 \pm 13.6\,\text{mm}$ | $426.4 \pm 37.2\,\text{mm}$ | Mild Depth Reduction & Speed Hesitation |
| **Subject 06** | $66.0 \pm 2.7^\circ$ | $87.5 \pm 10.5^\circ$ | $553.5 \pm 15.3\,\text{mm}$ | $456.3 \pm 43.0\,\text{mm}$ | Knee Valgus Collapse (ratio drops from 0.98 to 0.71) |
| **Subject 07** | $94.2 \pm 6.1^\circ$ | $121.7 \pm 10.4^\circ$ | $427.9 \pm 25.6\,\text{mm}$ | $249.6 \pm 53.8\,\text{mm}$ | Severe Inadequate Depth ($121.7^\circ$) |
| **Subject 08** | $72.8 \pm 2.4^\circ$ | $91.5 \pm 31.5^\circ$ | $466.1 \pm 15.2\,\text{mm}$ | $375.0 \pm 155.0\,\text{mm}$ | Mixed Depth & Trunk Compensation |
| **Subject 09** | $59.8 \pm 1.8^\circ$ | $116.6 \pm 19.5^\circ$ | $542.8 \pm 11.1\,\text{mm}$ | $269.8 \pm 72.9\,\text{mm}$ | Severe Inadequate Depth ($116.6^\circ$, drop $270\,\text{mm}$) |
| **Subject 10** | $74.9 \pm 4.3^\circ$ | $111.1 \pm 12.5^\circ$ | $494.3 \pm 24.5\,\text{mm}$ | $275.1 \pm 55.6\,\text{mm}$ | Severe Inadequate Depth ($111.1^\circ$, drop $275\,\text{mm}$) |

### 5.3 Essential Evaluation Safeguards
Based on these findings, we establish strict rules for Phase 6 evaluation:
1. **Binary Movement Quality Classification**: The target task is classifying **Optimal (Class 0)** vs **Non-Optimal (Class 1)** movement quality based on the therapist's reference label.
2. **Defect-Specific Disambiguation**: A model that specifically detects "knee valgus" must **NOT** be penalized as a false negative if evaluated against Subject 09, whose non-optimal deviation was inadequate squat depth.
3. **No Clinical Overclaiming**: The platform assesses observable kinematic movement deviations relative to reference biomechanical criteria; it does not issue medical or orthopedic diagnoses.
