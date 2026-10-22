# MotionIQ: View-Aware and Uncertainty-Aware Real-Time Human Movement Assessment via Monocular Edge Computer Vision

> **Unpublished Research Manuscript**  
> Prepared as a reproducible scientific research artifact and portfolio project for the Erasmus Mundus Joint Master Degrees in Image Processing and Computer Vision (IPCVAI / IMLEX).

**Devdatta Patil**  
*Department of Computer Science & Engineering*  
*Repository: https://github.com/motioniq/motioniq*  
*Date: October 2026*

---

## Abstract

Automated movement quality assessment and real-time exercise coaching systems typically rely on single monocular RGB webcams. However, existing rule-based and deep-learning pipelines implicitly assume an orthogonal, canonical frontal camera orientation. When users rotate relative to the camera optical axis, perspective projection and monocular foreshortening cause planar angle rules to collapse, inducing catastrophic false-alarm rates (e.g., mistaking lateral leg overlap for severe knee valgus). Furthermore, uncalibrated systems exhibit extreme overconfidence under limb self-occlusion and motion blur.

In this work, we introduce **MotionIQ**, a view-aware, uncertainty-aware exercise assessment and coaching platform designed for edge browser deployment. MotionIQ couples lightweight monocular pose estimation (MediaPipe BlazePose) with:
1. A **3D Torso-Normal Viewpoint Classifier** that dynamically estimates camera azimuth relative to the body coordinate frame.
2. A **View-Aware Biomechanical Gating Engine** that selectively suppresses out-of-plane rules under oblique and lateral views.
3. A **Temporal Kinematic Modeling Pipeline** quantifying continuous movement dynamics, range of motion, and Spectral Arc Length (SPARC) smoothness.
4. An **Uncertainty Gate** implementing selective classification (abstention) when prediction margin or tracking visibility falls below reliability thresholds.

We evaluate MotionIQ on **200 authentic optoelectronic motion-capture recordings** from the University of Idaho Physical Rehabilitation Movement Dataset (UI-PRMD; 10 human participants, 100 optimal and 100 non-optimal deep squats at 100 Hz) projected across virtual camera viewpoints ($0^\circ$ frontal, $45^\circ$ oblique, and $90^\circ$ lateral = 600 streams total). Crucially, the 600 streams represent 200 physical human-motion trials across 10 participants, and camera viewpoints are evaluated as repeated projections rather than independent participants. Under strict **Leave-One-Subject-Out (LOSO) 10-fold cross-validation**, upstream planar rules (Model A) suffer a catastrophic **74.0% False Warning Rate (FWR)** on lateral squats due to perspective foreshortening. In contrast, MotionIQ’s view-aware supervised temporal model operating at $88.5\%$ coverage with selective uncertainty abstention (Model E) achieves **80.6% Balanced Accuracy** [95% CI: 71.8–88.2%], **81.3% Sensitivity**, **79.8% Specificity**, and **0.805 Macro-F1**, slashing selective risk to **19.4%** (compared to $30.2\%$ in Model A). At matched coverage ($\phi=0.885$), the underlying view-aware temporal model (Model D) achieves identical performance, confirming that selective risk decreases monotonically with coverage. Subject-level paired statistical tests ($N=10$, $df=9$) demonstrate a mean improvement of **$+8.48\%$ to $+9.66\%$ Balanced Accuracy** over planar rules ($p = 0.0758$ for Model D, $p = 0.0635$ for Model E). These p-values represent a strong positive trend across 8 out of 10 participants, while appropriately acknowledging that with $N=10$ human participants, the difference does not cross the conventional $\alpha=0.05$ threshold of statistical proof. End-to-end latency benchmarks on consumer hardware confirm a median round-trip feedback loop of **57.0 ms (~17.5 FPS)**, while protecting user biometric privacy by retaining and processing raw video frames exclusively in client-side volatile memory.

---

## 1. Introduction

Musculoskeletal rehabilitation, athletic training, and physical therapy depend fundamentally on exercise technique. Performing movements with biomechanical deviations—such as knee valgus (inward collapse) or inadequate depth during deep squats—increases the risk of anterior cruciate ligament (ACL) tears, patellofemoral pain syndrome, and lumbar spinal disc degeneration [1]. In-person coaching by physical therapists provides gold-standard kinematic guidance, but high cost, geographic disparity, and scheduling barriers severely limit accessibility.

The emergence of lightweight markerless human pose estimation networks (such as MediaPipe BlazePose [2] and RTMPose [3]) has enabled digital health applications that assess human movement in real time via standard laptop and smartphone webcams.

### 1.1 The Geometric Flaw of Monocular Planar Rules
Despite commercial proliferation, monocular exercise coaching algorithms suffer from fundamental geometric vulnerabilities:
1. **The Planar Perspective Collapse**: Standard rule engines evaluate joint angles using 2D image-plane dot products:
   $$\cos \theta_{2D} = \frac{\mathbf{u}_{2D} \cdot \mathbf{v}_{2D}}{\|\mathbf{u}_{2D}\| \|\mathbf{v}_{2D}\|}$$
   Because perspective projection compresses out-of-plane distances along the optical axis $Z$, any user rotation induces non-linear foreshortening. When a deep squat is viewed from a $90^\circ$ profile, the projected medial-lateral distance between left and right knees approaches zero. Planar rules evaluating the inter-knee to inter-ankle ratio ($R = \Delta x_{\text{knee}} / \Delta x_{\text{ankle}}$) trigger severe knee valgus alarms on **74% of optimal human squats**, frustrating users and undermining coaching adherence.
2. **Forced Predictions Under Limb Occlusion**: Profile views inevitably occlude contralateral limbs (MediaPipe visibility drops below 0.25). Uncalibrated systems extrapolate noisy or hallucinated coordinates, generating spurious asymmetry warnings rather than abstaining.
3. **Disregard for Continuous Temporal Dynamics**: Most engines evaluate instantaneous per-frame joint angles, ignoring movement smoothness, velocity reversals, and dynamic deceleration.
4. **Reproducibility Deficits in Prior Literature**: As identified in our evaluation audit, prior academic systems frequently evaluate on synthetic sinusoidal trajectories, suffer from ground-truth label leakage (passing test exercise labels into feature extractors), or misrepresent isolated CPU array operations (e.g. "520 FPS") as true end-to-end latency.

### 1.2 Scientific Contributions
To address these challenges, we present **MotionIQ**:
- **Independent Dataset Audit & Projection Geometry**: We catalog 200 authentic 100 Hz Vicon recordings from UI-PRMD [4] with SHA-256 hashes, correct prior geometric projection clipping, and clarify the clinical semantics of non-optimal rehabilitation labels.
- **3D Torso-Normal View Gating**: We compute the human anatomical coordinate frame directly from 3D shoulder-hip vectors ($\approx 0.01\,\text{ms}$ latency), dynamically suppressing out-of-plane rules.
- **Supervised Temporal Modeling under Strict LOSO**: We replace rigid static rule heuristics with a lightweight supervised temporal model evaluated via Leave-One-Subject-Out 10-fold cross-validation with zero subject leakage.
- **Calibrated Selective Abstention & Matched-Coverage Analysis**: Grounded in selective classification theory [5], our Uncertainty Gate rejects ambiguous predictions, elevating Balanced Accuracy to $80.6\%$ and cutting selective risk to $19.4\%$ at matched coverage.
- **Empirical Latency Profile & Volunteer Testing**: We decompose the end-to-end feedback loop into its hardware components, confirming a 57.0 ms median round-trip on desktop GPU without raw video transmission.

---

## 2. Methodology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CLIENT BROWSER (EDGE / WEBGPU)                        │
│                                                                             │
│  [Webcam RGB] ──> [MediaPipe Pose] ──> [33 3D Landmarks] ──> [WebSocket]   │
│      30 FPS           WASM/WebGL              (x,y,z,v)             Client  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ JSON Stream (~1.2 ms)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                    FASTAPI ASYNC BACKEND (LOCAL / EDGE)                     │
│                                                                             │
│  ┌───────────────────────┐   ┌───────────────────────────────────────────┐  │
│  │ Kalman Pose Filter    │   │ 3D Torso-Normal Viewpoint Classifier      │  │
│  │ 33-Joint 4D Tracking  │   │ Computes Azimuth & Elevation Angles       │  │
│  └──────────┬────────────┘   └─────────────────────┬─────────────────────┘  │
│             │                                      │                        │
│             ▼                                      ▼                        │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ View-Aware Rule Gating & Temporal Kinematic Assessor (SPARC / Jerk)   │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
│                                     │                                       │
│                                     ▼                                       │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Uncertainty Gate (Kalman Covariance + Visibility + View Suitability)  │  │
│  │ Decision: ASSESSABLE (with filtered issues) vs UNASSESSABLE (Abstain) │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │ JSON Payload (~1.1 ms)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                       FRONTEND USER INTERFACE & HUD                         │
│                                                                             │
│  [Skeleton Canvas] <── [Live Feedback HUD] <── [Rep Phase State Indicator]  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 3D Torso-Normal Coordinate System
To establish viewpoint invariance, we define an intrinsic anatomical reference frame centered at the mid-pelvis. Given 3D landmark coordinates for left/right shoulders ($\mathbf{p}_{ls}, \mathbf{p}_{rs}$) and left/right hips ($\mathbf{p}_{lh}, \mathbf{p}_{rh}$):
1. **Transverse Torso Vector**: $\mathbf{v}_{\text{torso}} = \mathbf{p}_{ls} - \mathbf{p}_{rs}$
2. **Longitudinal Spine Vector**: $\mathbf{v}_{\text{spine}} = \frac{\mathbf{p}_{ls} + \mathbf{p}_{rs}}{2} - \frac{\mathbf{p}_{lh} + \mathbf{p}_{rh}}{2}$
3. **Anterior-Posterior Chest Normal**:
   $$\mathbf{n}_{\text{torso}} = \frac{\mathbf{v}_{\text{torso}} \times \mathbf{v}_{\text{spine}}}{\|\mathbf{v}_{\text{torso}} \times \mathbf{v}_{\text{spine}}\|}$$

The camera azimuth angle $\psi$ relative to the chest normal is computed as:
$$\psi = \arctan2\left(n_{\text{torso}, x}, n_{\text{torso}, z}\right)$$
We categorize operational regimes:
- **Frontal ($|\psi| \le 25^\circ$)**: Valid for bilateral symmetry, hip shift, and knee valgus.
- **Oblique ($25^\circ < |\psi| < 65^\circ$)**: Intermediate visibility; partial valgus discounting.
- **Lateral ($|\psi| \ge 65^\circ$)**: Valid for sagittal squat depth, trunk forward inclination, and lumbar curvature; out-of-plane coronal rules are suppressed.

### 2.2 Temporal Kinematic Features & Smoothness (SPARC)
From continuous landmark streams, we extract 11 core biomechanical trajectory features:
- $\min \theta_{\text{knee}}, \Delta \theta_{\text{knee}}, \bar{\theta}_{\text{knee}}$: Minimum, range, and mean knee flexion angles.
- $R_{\text{valgus}} = \min \frac{\|\mathbf{p}_{lkne} - \mathbf{p}_{rkne}\|}{\|\mathbf{p}_{lank} - \mathbf{p}_{rank}\|}$: Coronal knee-to-ankle ratio.
- $\Delta y_{\text{pelvis}}$: Pelvis vertical descent displacement normalized by limb length.
- $\theta_{\text{trunk}}$: Maximum torso inclination angle from vertical.
- $\omega_{\text{knee}}, \alpha_{\text{knee}}$: Peak knee angular velocity and acceleration.
- $\operatorname{SPARC}$: Spectral Arc Length movement smoothness on the speed profile $v(t)$:
  $$\operatorname{SPARC} \triangleq -\int_0^{\omega_c} \sqrt{\left(\frac{1}{\omega_c}\right)^2 + \left(\frac{d\hat{V}(\omega)}{d\omega}\right)^2} d\omega$$
  where $\hat{V}(\omega)$ is the normalized Fourier spectrum and $\omega_c = 10\,\text{Hz}$ [8].

### 2.3 Supervised Classification & View Gating
We formulate movement quality assessment as regularized logistic modeling:
$$p = P(y = 1 \mid \mathbf{x}) = \frac{1}{1 + e^{-(\mathbf{w}^T \mathbf{x} + b)}}$$
where $\mathbf{x}$ is the standardized kinematic feature vector.
In **Model D**, when $|\psi| \ge 65^\circ$ (lateral view), the coronal valgus feature is suppressed ($x_{\text{valgus}} \leftarrow \mu_{\text{valgus}}$), forcing the model to rely solely on view-appropriate sagittal and temporal indicators.

### 2.4 Calibrated Selective Abstention
In **Model E**, we incorporate selective classification with a reject option [5]. The system evaluates the prediction confidence margin $M = |p - 0.5|$ and mean landmark tracking visibility $\bar{v}$:
$$\text{Decision} = \begin{cases} \text{ABSTAIN (UNASSESSABLE)}, & \text{if } M < \gamma \text{ or } \bar{v} < \tau_v \\ \text{NON-OPTIMAL}, & \text{if } p \ge \tau^* \\ \text{OPTIMAL}, & \text{if } p < \tau^* \end{cases}$$
where $\gamma = 0.12, \tau_v = 0.45$, and $\tau^*$ is calibrated on inner validation folds without test leakage.

---

## 3. Leave-One-Subject-Out (LOSO) Experimental Results

### 3.1 Overall Benchmark Performance
Evaluated across all **600 projected streams** (200 trials $\times$ 3 viewpoints). 95% Confidence Intervals were computed via subject-level bootstrap resampling ($B=1,000$):

| Model Architecture | Sensitivity (TPR %) | Specificity (%) | FWR (%) | Precision (%) | Balanced Accuracy (%) | Macro-F1 | Coverage (%) | Selective Risk (%) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Baseline Majority (Control)** | 0.0% | 100.0% | 0.0% | 0.0% | 50.0% [50.0, 50.0] | 0.333 | 100.0% | 50.0% |
| **Baseline Always-Abstain** | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% [0.0, 0.0] | 0.000 | 0.0% | 0.0% |
| **Model A (Upstream Rules)** | **89.0%** [83.0, 94.3] | 50.7% [36.0, 62.7] | **49.3%** [37.3, 64.0] | 64.3% | 69.8% [61.8, 76.3] | 0.687 | 100.0% | 30.2% |
| **Model B (Temporal Rules)** | 100.0% | 0.0% | 100.0% | 50.0% | 50.0% [50.0, 50.0] | 0.333 | 100.0% | 50.0% |
| **Model C (Supervised Temporal)**| 71.7% [54.3, 88.3] | 77.0% [52.7, 99.0] | **23.0%** [1.0, 47.3] | 75.7% | 74.3% [66.5, 82.7] | 0.743 | 100.0% | 25.7% |
| **Model D (View-Aware Supervised)**| 77.0% [64.7, 89.7] | 79.7% [58.7, 95.0] | **20.3%** [5.0, 41.3] | 79.1% | **78.3%** [70.7, 84.2] | **0.783** | 100.0% | 21.7% |
| **Model E (Uncertainty-Gated)** | **81.3%** [70.1, 91.7] | **79.8%** [56.2, 96.9] | **20.2%** [3.1, 43.8] | **82.1%** | **80.6%** [71.8, 88.2] | **0.805** | **88.5%** | **19.4%** |

### 3.2 Viewpoint Breakdown: Elimination of Lateral False Alarms

| Model | Viewpoint | Sensitivity (%) | Specificity (%) | False Warning Rate (FWR %) | Balanced Accuracy (%) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Model A (Planar Rules)** | Frontal ($0^\circ$) | 92.0% | 55.0% | 45.0% | 73.5% |
| | Oblique ($45^\circ$) | 82.0% | 71.0% | 29.0% | 76.5% |
| | Lateral ($90^\circ$) | 93.0% | 26.0% | **74.0%** | **59.5%** |
| **Model D (View-Aware)** | Frontal ($0^\circ$) | 82.0% | 85.0% | 15.0% | 83.5% |
| | Oblique ($45^\circ$) | 84.0% | 79.0% | 21.0% | 81.5% |
| | Lateral ($90^\circ$) | 65.0% | 75.0% | **25.0%** | **70.0%** |
| **Model E (Selective Gate)** | Frontal ($0^\circ$) | **84.5%** | **87.5%** | **12.5%** | **86.0%** |
| | Oblique ($45^\circ$) | **88.3%** | 75.3% | 24.7% | 81.8% |
| | Lateral ($90^\circ$) | **70.7%** | **76.9%** | **23.1%** | **73.8%** |

**Empirical Finding**: In Model A, lateral camera orientation induces a **74.0% False Warning Rate** due to perspective foreshortening. In Model D/E, view-aware feature gating and selective abstention slash lateral FWR to **23.1%**, while preserving $>84\%$ sensitivity on frontal views.

### 3.3 Subject-Level Paired Significance Analysis ($N=10$)

Accounting for the fact that 600 projections represent 200 original recordings from 10 participants, we conducted a rigorous paired statistical analysis:

| Model Comparison | Mean $\Delta$ Balanced Accuracy | Paired 95% Confidence Interval | Paired $t$-test ($p$-value) | Wilcoxon Signed-Rank ($p$-value) | Improved / Tied / Regressed |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Model A vs Model C** | $+4.50\%$ | $[-7.6\%, +16.6\%]$ | $p = 0.4209$ | $p = 0.5076$ | 5 / 0 / 5 |
| **Model A vs Model D** | **$+8.48\%$** | $[-1.1\%, +18.0\%]$ | $p = 0.0758$ (trend) | $p = 0.0742$ (trend) | 7 / 1 / 2 |
| **Model A vs Model E** | **$+9.66\%$** | $[-0.7\%, +20.0\%]$ | $p = 0.0635$ (trend) | $p = 0.0840$ (trend) | 8 / 0 / 2 |
| **Model C vs Model D** | $+3.98\%$ | $[-1.7\%, +9.7\%]$ | $p = 0.1488$ | $p = 0.1230$ | 8 / 0 / 2 |
| **Model D vs Model E** | $+1.18\%$ | $[-1.0\%, +3.4\%]$ | $p = 0.2495$ | $p = 0.3125$ | 6 / 1 / 3 |

*Scientific Interpretation*: Model D improved or maintained Balanced Accuracy on 8 out of 10 participants (7 improved, 1 tied, 2 regressed), while Model E strictly improved on 8 out of 10 participants (8 improved, 0 tied, 2 regressed). With $N=10$ independent human subjects ($df=9$), the paired $p$-values ($p = 0.0758$ and $p = 0.0635$) indicate a strong positive trend on the margin of conventional $\alpha = 0.05$ significance, truthfully reflecting sample size limits without overclaiming statistical proof.

### 3.4 Fair Matched-Coverage Comparison & Risk-Coverage Curves

Evaluating models at matched coverage levels ($\phi \in [0.50, 1.00]$) confirms the selective classification advantage:

| Coverage Level ($\phi$) | Retained Samples | Model C Risk (%) | Model C Balanced Acc (%) | Model D Risk (%) | Model D Balanced Acc (%) |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **1.00 (Full)** | 600 | 25.7% | 74.3% | 21.7% | 78.3% |
| **0.95** | 570 | 23.9% | 76.2% | 21.6% | 78.4% |
| **0.90** | 540 | 21.1% | 78.9% | 19.8% | 80.1% |
| **0.885 (Matched to Model E)**| 531 | **20.5%** | **79.5%** | **19.4%** | **80.6%** |
| **0.80** | 480 | 19.2% | 80.8% | 17.7% | 82.2% |
| **0.70** | 420 | 16.9% | 83.0% | 15.2% | 84.8% |
| **0.50** | 300 | **9.7%** | **90.4%** | **9.3%** | **90.7%** |

*Verification of Abstention Quality*: Forced classification on Model E's 69 abstained samples yielded only **75.4% accuracy** (substantially worse than the 80.6% achieved on retained samples), confirming that the uncertainty gate selectively isolates genuine boundary and ambiguous cases.

### 3.5 Probability Calibration Analysis

| Model | Brier Score (Lower is Better) | Expected Calibration Error (ECE) | Maximum Calibration Error (MCE) |
| :--- | :---: | :---: | :---: |
| **Model C (Supervised Temporal)** | 0.1632 | **0.0615** | 0.1805 |
| **Model D (View-Aware Supervised)**| **0.1515** | 0.0827 | 0.2518 |
| **Model E (Uncertainty-Calibrated)**| **0.1515** | 0.0827 | 0.2518 |

---

## 4. End-to-End Latency Profile & Volunteer Testing

### 4.1 Latency Decomposition
Measured across 1,800 frames on Windows 11 (Google Chrome 129, RTX 4060 Laptop GPU, Intel Core i7-13700H):

| Subsystem Stage | Median (P50) | 95th Percentile (P95) | Hardware Mechanism |
| :--- | :---: | :---: | :--- |
| **Webcam Hardware Buffer** | 16.7 ms | 21.3 ms | 30/60 Hz sensor exposure |
| **MediaPipe Pose (Browser GPU)**| 21.5 ms | 31.0 ms | Web Worker WebGL shader dispatch |
| **Client-to-Backend WebSocket** | 1.2 ms | 3.5 ms | Loopback TCP JSON transit |
| **FastAPI Kinematic Processing**| 28.4 ms | 44.2 ms | Kalman filter & feature extraction |
| **Backend-to-Client WebSocket** | 1.1 ms | 2.8 ms | AssessmentResult transmission |
| **Canvas HUD Rendering** | 4.8 ms | 8.2 ms | requestAnimationFrame dispatch |
| **Total Round-Trip Latency** | **57.0 ms** | **89.7 ms** | **Effective Rate: ~17.5 FPS** |

*Note: Offline mathematical inference of Model E requires only 0.01 ms; the true physical user feedback loop is bounded by camera shutter intervals, WebGL shader execution, and WebSocket transport.*

### 4.2 Preliminary Consent-Based Volunteer Usability Trials (Pilot Study)
Preliminary testing with 3 human volunteers performing squats, bicep curls, and push-ups under diverse lighting ($48\text{--}520\,\text{lux}$) and orientations ($0^\circ, 45^\circ, 90^\circ$) demonstrated **100% viewpoint classification accuracy** (5/5 sessions), **96.0% repetition cadence accuracy** (24/25 physical reps), and stable sub-60 ms interactive coaching. Given the pilot nature ($N=3$), these trials provide usability and latency verification rather than statistical normative claims.

---

## 5. Discussion & Future Outlook for IPCVAI / IMLEX

### 5.1 Empirical Evaluation of the Hypothesis
Our findings provide strong empirical support for the research hypothesis:
1. Conventional 2D planar rules exhibit severe viewpoint degradation (**74.0% FWR** on lateral squats due to perspective foreshortening).
2. 3D torso-normal view gating slashes false warnings by over $50\%$ on lateral angles without requiring multi-camera setups.
3. Selective uncertainty abstention isolates difficult boundary samples (on which forced classification accuracy drops to $75.4\%$), elevating retained Balanced Accuracy to **80.6%** and reducing selective risk to **19.4%** at matched coverage.
4. Paired subject-level statistical tests demonstrate a positive performance trend (+9.66% Balanced Accuracy, $p = 0.0635$), with 8 out of 10 participants benefiting from view-aware modeling. While this approaches significance, we explicitly note that conventional statistical significance ($\alpha = 0.05$) is not crossed due to the sample size of $N=10$ independent human participants.
5. In addition, aggregate movement-quality classification (predicting general physical therapy exercise deviation) must be distinguished from specific orthopedic defect diagnoses (e.g., knee valgus angle $> 12^\circ$ or hip asymmetry), which function as assistive visual coaching proxies rather than clinical diagnoses.
6. **Domain Gap & Unverified Accuracy Transfer**: Crucially, the reported 80.6% balanced accuracy and selective risk profile were established using 200 authentic UI-PRMD recordings captured via 100 Hz laboratory Vicon infrared optical motion capture with sub-millimeter precision. In physical production, the system ingests 2D monocular RGB webcam frames at 30 FPS using MediaPipe BlazePose, which is subject to lens distortion, perspective foreshortening, clothing deformation, and depth estimation noise. While live physical latency (57.0 ms) and viewpoint classification (100% across 5 pilot sessions) have been verified, **the direct zero-shot transfer of the 80.6% classification accuracy from Vicon-derived projections to live monocular webcams remains unverified** and constitutes a key scientific limitation.

### 5.2 Research Roadmap for Erasmus Mundus Master's Theses
The defensible foundation established by MotionIQ provides immediate avenues for European master's research (IPCVAI, IMLEX, and Erasmus Mundus consortia):
1. **Multi-Camera WebRTC Spatial Fusion**: Fusing asynchronous landmark streams from phone and laptop cameras using extended Kalman filtering.
2. **Conformal Prediction on Skeletal Graphs**: Formulating movement quality assessment with finite-sample distribution-free coverage guarantees.
3. **Larger Clinical Telerehabilitation Cohorts**: Partnering with physical therapy clinics to evaluate patient recovery trajectories following knee arthroplasty across larger diverse patient populations ($N > 50$).

---

## References

[1] Hewett, T. E., et al. "Biomechanical measures of neuromuscular control and valgus loading of the knee predict anterior cruciate ligament injury risk in female athletes." *The American Journal of Sports Medicine*, 33(4):492–501, 2005.  
[2] Bazrev, V., et al. "BlazePose: On-device Real-time Body Pose tracking." *arXiv preprint arXiv:2006.10204*, 2020.  
[3] Jiang, T., et al. "RTMPose: Real-Time Multi-Person Pose Estimation based on MMPose." *arXiv preprint arXiv:2303.07399*, 2023.  
[4] Vakanski, A., et al. "A data set of human body movements for physical rehabilitation exercises." *Data*, 3(1):2, 2018.  
[5] Geifman, Y., and El-Yaniv, R. "Selective classification for deep neural networks." *Advances in Neural Information Processing Systems (NeurIPS)*, 30, 2017.  
[6] Fieraru, M., et al. "Learning to evaluate exercise form from videos." *IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR)*, 2021.  
[7] Yan, S., Xiong, Y., and Lin, D. "Spatial temporal graph convolutional networks for skeleton-based action recognition." *AAAI*, 32(1), 2018.  
[8] Balasubramanian, S., et al. "Quantifying movement smoothness in physical therapy: A review and evaluation of spectral arc length." *IEEE TNSRE*, 23(5):913–922, 2015.  
[9] Liao, R., et al. "A deep learning framework for assessing physical rehabilitation exercises." *IEEE TNSRE*, 28(2):468–477, 2020.  
[10] Pagnon, D., et al. "Sports2D: An open-source Python package for automated markerless 2D kinematics." *JOSS*, 8(89):5519, 2023.
