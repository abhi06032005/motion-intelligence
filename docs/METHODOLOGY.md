# MotionIQ: Experimental Methodology & Scientific Protocol

## 1. Experimental Setup & Benchmarking Design

To ensure scientific rigor, reproducibility, and compliance with academic standards, MotionIQ adopts a strictly subject-independent evaluation methodology. No synthetic, fabricated, or simulated training runs are reported.

### 1.1 Dataset Descriptions and Canonical Normalisation

All external datasets are ingested and normalized into the MotionIQ `CanonicalMovementSequence` schema (`research/datasets/canonical_schema.py`):

| Dataset ID | Movement Domain | Subjects & Modality | Reference Standard | Licence & Attribution |
| :--- | :--- | :--- | :--- | :--- |
| **UI-PRMD** | Physical Therapy & Rehab (Squats, Lunges, Trunk) | 10 subjects, 10 movements, 20,000+ frames | Vicon Optical Motion Capture (100 Hz) + Kinect | CC BY 4.0 (Vakanski et al., 2018) |
| **UL-RED** | Upper Limb Exercises (Curls, Presses, Reaches) | 10 subjects, 22 movements, 1,320 trials | Multi-camera RGB + Wearable IMUs | Academic Research (Univ. of Liverpool) |
| **RepCount** | Repetitive Gym Exercises (Squat, Push-up, Curl) | 1,000+ natural videos | Annotated Repetition Temporal Boundaries | Non-commercial Academic (SVIP Lab) |
| **KIMORE** | Motor Rehabilitation (Low-back pain clinical cohort) | 78 participants (healthy + clinical) | RGB-D Kinect skeleton + Clinical Scores | CC BY-NC-SA 4.0 (Capecci et al., 2019) |

### 1.2 Canonical Data Representation
Every movement sequence is converted to a normalized 4D array:
$$\mathbf{X} \in \mathbb{R}^{T \times 33 \times 4}$$
where $T$ is the number of temporal frames, 33 represents standard MediaPipe joint landmarks, and the 4 channels correspond to normalized $x \in [0, 1]$, normalized $y \in [0, 1]$, relative depth $z$, and visibility confidence $v \in [0, 1]$.

---

## 2. Subject-Independent Partitioning Protocol

Data leakage across subjects represents a major methodological flaw in human motion analysis literature. MotionIQ enforces an absolute separation:

- **Calibration & Reference Split (80%)**: Subjects `01` through `08`. Used strictly to establish baseline kinematic ranges and HMM emission probability distributions.
- **Unseen Test Split (20%)**: Subjects `09` and `10`. All benchmark metrics, tables, and ablation comparisons reported in MotionIQ derive solely from this holdout partition. No thresholds or parameters were fit or adjusted on Subjects 09 or 10.

---

## 3. Mathematical Metric Definitions

### 3.1 Exercise Classification Performance
- **Macro-Averaged F1-Score**:
  $$\text{Macro-F1} = \frac{1}{K} \sum_{k=1}^K \frac{2 \cdot \text{Precision}_k \cdot \text{Recall}_k}{\text{Precision}_k + \text{Recall}_k}$$
  where $K$ is the number of supported exercise classes.
- **Balanced Accuracy**: Arithmetic mean of sensitivity across all classes to prevent bias from unbalanced trial counts.

### 3.2 Repetition Counting Accuracy
- **Mean Absolute Error (MAE)**:
  $$\text{MAE}_{rep} = \frac{1}{N} \sum_{i=1}^N \left| \hat{y}_i^{rep} - y_i^{rep} \right|$$
- **Root Mean Squared Error (RMSE)**:
  $$\text{RMSE}_{rep} = \sqrt{\frac{1}{N} \sum_{i=1}^N (\hat{y}_i^{rep} - y_i^{rep})^2}$$

### 3.3 Movement Smoothness (SPARC)
Spectral Arc Length evaluates the complexity of the Fourier magnitude spectrum of the movement speed profile $v(t)$:
$$\text{SPARC} \triangleq -\int_0^{\omega_c} \sqrt{\left(\frac{1}{\omega_c}\right)^2 + \left(\frac{d\hat{V}(\omega)}{d\omega}\right)^2} d\omega$$
where $\hat{V}(\omega) = V(\omega)/V(0)$ is the normalized velocity spectrum and $\omega_c$ is the cutoff frequency capturing 99% of spectral power.

### 3.4 Calibration & Probabilistic Reliability
- **Brier Score**:
  $$\text{BS} = \frac{1}{N} \sum_{i=1}^N \sum_{k=1}^K (p_{ik} - o_{ik})^2$$
  where $p_{ik}$ is predicted confidence and $o_{ik} \in \{0, 1\}$ is actual ground-truth indicator.
- **Expected Calibration Error (ECE)**:
  $$\text{ECE} = \sum_{m=1}^M \frac{|B_m|}{N} \left| \text{acc}(B_m) - \text{conf}(B_m) \right|$$
  partitioning predictions into $M=10$ equally spaced confidence bins $B_m$.

### 3.5 Selective Prediction & Abstention Rate
- **Abstention Rate**:
  $$\alpha = \frac{N_{abstained}}{N_{total}}$$
- **Retained Accuracy**: Accuracy measured strictly on the subset of frames where the model elected to predict ($R \ge \tau_{abstain}$).
