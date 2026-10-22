# MotionIQ: Empirical Benchmark Results (Phase 6 — Leave-One-Subject-Out)

> **Academic Reproducibility Notice (Phase 6 — October 2026)**: In accordance with Erasmus Mundus (IPCVAI / IMLEX) reproducibility standards, all metrics below are derived from **200 authentic human motion-capture recordings** from the University of Idaho Physical Rehabilitation Movement Dataset (UI-PRMD; 100 Hz Vicon optical mocap).
> Evaluation was conducted using strict **Leave-One-Subject-Out (LOSO) 10-Fold Cross-Validation** across all 10 human participants, with 95% Confidence Intervals computed via subject-level bootstrap resampling (1,000 rounds).

---

## 1. Overall Movement Quality Assessment Benchmark (LOSO Cross-Validation)

Evaluated across **600 projected streams** (200 authentic trials $\times$ 3 virtual camera viewpoints: $0^\circ$ frontal, $45^\circ$ oblique, $90^\circ$ lateral). Binary classification: Optimal (Class 0, $N=300$) vs Non-Optimal (Class 1, $N=300$).

| Model Architecture | Sensitivity (TPR %) | Specificity (%) | False Warning Rate (FWR %) | Precision (%) | Balanced Accuracy (%) | Macro-F1 | Coverage (%) | Selective Risk (%) | P50 Latency (ms) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Baseline Majority (Trivial Control)** | 0.0% | 100.0% | 0.0% | 0.0% | 50.0% [50.0, 50.0] | 0.333 | 100.0% | 50.0% | 0.00 ms |
| **Baseline Always-Abstain (Rejection Control)** | 0.0% | 0.0% | 0.0% | 0.0% | 0.0% [0.0, 0.0] | 0.000 | 0.0% | 0.0% | 0.00 ms |
| **Model A (Upstream Static Planar Rules)** | **89.0%** [83.0, 94.3] | 50.7% [36.0, 62.7] | **49.3%** [37.3, 64.0] | 64.3% | 69.8% [61.8, 76.3] | 0.687 | 100.0% | 30.2% | 0.00 ms |
| **Model B (Temporal / SPARC Rules)** | 100.0% | 0.0% | 100.0% | 50.0% | 50.0% [50.0, 50.0] | 0.333 | 100.0% | 50.0% | 0.00 ms |
| **Model C (Supervised Temporal Kinematics)** | 71.7% [54.3, 88.3] | 77.0% [52.7, 99.0] | **23.0%** [1.0, 47.3] | 75.7% | 74.3% [66.5, 82.7] | 0.743 | 100.0% | 25.7% | 0.01 ms |
| **Model D (View-Aware Supervised Temporal)** | 77.0% [64.7, 89.7] | 79.7% [58.7, 95.0] | **20.3%** [5.0, 41.3] | 79.1% | **78.3%** [70.7, 84.2] | **0.783** | 100.0% | 21.7% | 0.01 ms |
| **Model E (Uncertainty-Gated Selective Model)** | **81.3%** [70.1, 91.7] | **79.8%** [56.2, 96.9] | **20.2%** [3.1, 43.8] | **82.1%** | **80.6%** [71.8, 88.2] | **0.805** | **88.5%** | **19.4%** | 0.00 ms |

*Note: Brackets $[a, b]$ denote 95% Confidence Intervals computed via subject-level bootstrap resampling ($N=1,000$).*

---

## 2. Confusion Matrices (Raw Counts Across All 600 Streams)

| Model Architecture | True Positives (TP) | False Positives (FP) | True Negatives (TN) | False Negatives (FN) | Abstained Count |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Baseline Majority** | 0 | 0 | 300 | 300 | 0 |
| **Model A (Upstream Rules)** | 267 | 148 | 152 | 33 | 0 |
| **Model B (Temporal Rules)** | 300 | 300 | 0 | 0 | 0 |
| **Model C (Supervised Temporal)** | 215 | 69 | 231 | 85 | 0 |
| **Model D (View-Aware Supervised)** | 231 | 61 | 239 | 69 | 0 |
| **Model E (Uncertainty Calibrated)** | 230 | 50 | 198 | 53 | 69 (11.5%) |

---

## 3. Per-Camera-View Performance Breakdown

Evaluates whether view-aware rule suppression and selective abstention successfully eliminate false alarms induced by camera orientation:

| Model | Viewpoint | Sensitivity (%) | Specificity (%) | False Warning Rate (FWR %) | Balanced Accuracy (%) | Coverage (%) |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Model A (Planar Rules)** | Frontal ($0^\circ$) | 92.0% | 55.0% | 45.0% | 73.5% | 100.0% |
| | Oblique ($45^\circ$) | 82.0% | 71.0% | 29.0% | 76.5% | 100.0% |
| | Lateral ($90^\circ$) | 93.0% | 26.0% | **74.0%** | **59.5%** | 100.0% |
| **Model C (Supervised Temporal)** | Frontal ($0^\circ$) | 81.0% | 86.0% | 14.0% | 83.5% | 100.0% |
| | Oblique ($45^\circ$) | 68.0% | 74.0% | 26.0% | 71.0% | 100.0% |
| | Lateral ($90^\circ$) | 66.0% | 71.0% | 29.0% | 68.5% | 100.0% |
| **Model D (View-Aware Supervised)**| Frontal ($0^\circ$) | 82.0% | 85.0% | 15.0% | 83.5% | 100.0% |
| | Oblique ($45^\circ$) | 84.0% | 79.0% | 21.0% | 81.5% | 100.0% |
| | Lateral ($90^\circ$) | 65.0% | 75.0% | **25.0%** | **70.0%** | 100.0% |
| **Model E (Uncertainty Calibrated)**| Frontal ($0^\circ$) | **84.5%** | **87.5%** | **12.5%** | **86.0%** | 88.5% |
| | Oblique ($45^\circ$) | **88.3%** | 75.3% | 24.7% | 81.8% | 85.5% |
| | Lateral ($90^\circ$) | **70.7%** | **76.9%** | **23.1%** | **73.8%** | 91.5% |

### Key Scientific Insight on View Awareness
- In **Model A**, rotating the camera to a lateral profile ($90^\circ$) causes the False Warning Rate to skyrocket to **74.0%** (Balanced Accuracy collapses to 59.5%) because 2D perspective projection collapses knee distance into near zero.
- In **Model D**, view-aware feature gating suppresses out-of-plane coronal valgus features, **slashing lateral FWR from 74.0% to 25.0%**.
- In **Model E**, selective abstention under optical ambiguity increases lateral Balanced Accuracy to **73.8%** with a selective risk of only **19.4%**.

---

## 4. Per-Subject Performance (Independent Generalization)

Balanced Accuracy across all 10 held-out human participants under strict Leave-One-Subject-Out evaluation:

| Subject ID | Model A Rules | Model C (Supervised) | Model D (View-Aware) | Model E (Uncertainty-Gated) |
| :--- | :---: | :---: | :---: | :---: |
| **Subject_01** | 76.7% | 78.3% | 85.0% | **85.0%** |
| **Subject_02** | 70.0% | 66.7% | 73.3% | **75.9%** |
| **Subject_03** | 60.0% | **98.3%** | 86.7% | 86.8% |
| **Subject_04** | 78.3% | 76.7% | 78.3% | **84.0%** |
| **Subject_05** | 41.7% | 70.0% | 73.3% | **75.4%** |
| **Subject_06** | 75.0% | 65.0% | 71.7% | 67.4% |
| **Subject_07** | 66.7% | 51.7% | 53.3% | 51.8% |
| **Subject_08** | 68.3% | 71.7% | 78.3% | **77.6%** |
| **Subject_09** | 85.0% | 95.0% | 93.3% | **96.4%** |
| **Subject_10** | 76.7% | 70.0% | 90.0% | **94.7%** |
| **Mean $\pm$ SD** | **69.8 $\pm$ 12.3%** | **74.3 $\pm$ 14.6%** | **78.3 $\pm$ 11.2%** | **80.6 $\pm$ 12.8%** |

---

## 5. End-to-End Latency vs. Offline Inference Latency

| Benchmark Type | Stage / Measurement | Median (P50) | 95th Percentile (P95) | Scope & Environment |
| :--- | :--- | :---: | :---: | :--- |
| **Offline Model Inference** | Feature extraction + Logistic scoring | **0.01 ms** | 0.02 ms | In-memory CPU array evaluation |
| **Live Browser Feedback Loop** | 1. Webcam Frame Capture | 16.7 ms | 21.3 ms | 30/60 Hz hardware sensor buffer |
| | 2. MediaPipe Pose (WebGL GPU) | 21.5 ms | 31.0 ms | Chrome Web Worker tensor inference |
| | 3. Client-Backend WebSocket Transit | 1.2 ms | 3.5 ms | Local loopback TCP socket |
| | 4. Backend Kinematics & Gating | 28.4 ms | 44.2 ms | FastAPI async pipeline |
| | 5. Backend-Client WebSocket Transit | 1.1 ms | 2.8 ms | JSON serialization |
| | 6. Canvas HUD Re-render | 4.8 ms | 8.2 ms | requestAnimationFrame dispatch |
| **Total Physical Round-Trip** | **End-to-End User Feedback** | **57.0 ms** | **89.7 ms** | **Effective Live Rate: ~17.5 FPS** |

---

## 6. Statistical Significance & Model D/E Reconciliation

### 6.1 Subject-Level Paired Significance Tests ($N=10, df=9$)
Because the 600 evaluation streams represent 200 physical human trials from 10 participants across 3 virtual viewpoints ($0^\circ, 45^\circ, 90^\circ$), statistical tests are conducted at the subject level ($N=10$) rather than assuming 600 independent samples:
- **Model A vs Model D (View-Aware)**: Mean $\Delta$ Balanced Accuracy = **$+8.48\%$** [95% CI: $-1.1\%$ to $+18.0\%$], paired $t$-test $p = 0.0758$, Wilcoxon $p = 0.0742$. Exactly **7 improved, 1 tied, 2 regressed** across the 10 participants.
- **Model A vs Model E (Selective Gate)**: Mean $\Delta$ Balanced Accuracy = **$+9.66\%$** [95% CI: $-0.7\%$ to $+20.0\%$], paired $t$-test $p = 0.0635$, Wilcoxon $p = 0.0840$. Exactly **8 improved, 0 tied, 2 regressed** across the 10 participants.
- *Scientific Interpretation*: The p-values ($p \approx 0.06\text{--}0.08$) indicate a strong positive trend on the margin of conventional $\alpha = 0.05$ significance. With a small clinical cohort of 10 participants, this represents promising empirical support rather than definitive statistical proof.

### 6.2 Reconciliation of Model D and Model E (Matched Coverage)
- **Model D** is the view-aware supervised model evaluated at full coverage ($\phi = 1.0$, Balanced Accuracy = $78.3\%$, Selective Risk = $21.7\%$).
- **Model E** is Model D equipped with confidence/uncertainty-based selective classification operating at threshold $\tau = 0.35$, yielding $88.5\%$ coverage (retaining 531 samples).
- Sweeping Model D across coverage levels $\phi \in [0.50, 1.00]$ shows that at matched coverage $\phi = 0.885$, Model D's balanced accuracy reaches **80.6%** and selective risk drops to **19.4%** (matching Model E). At $\phi = 0.50$, selective risk drops to **9.3%** ($90.7\%$ balanced accuracy).
- Forced evaluation on Model E's 69 abstained samples yields only $75.4\%$ accuracy, verifying that abstention isolates difficult boundary samples.

### 6.3 Movement Quality Classification vs Defect Coaching Proxies
UI-PRMD provides binary clinical protocol labels ("optimal" vs "non-optimal") across entire exercise bouts. MotionIQ explicitly distinguishes aggregate quality classification from specific biomechanical defect alerts (e.g. knee valgus angle $> 12^\circ$ or torso inclination), which serve as assistive motor-coaching proxies rather than clinical diagnoses.

### 6.4 Domain Gap Disclosure: Virtual Vicon Projection vs. Live Webcam MediaPipe Inference
- **Virtual Vicon Benchmark**: The reported 80.6% balanced accuracy and selective risk curves are derived from 200 authentic optical motion capture recordings (UI-PRMD) captured at 100 Hz with sub-millimeter multi-camera infrared marker tracking. Synthetic pinhole projection models ($0^\circ, 45^\circ, 90^\circ$) preserve clean coordinate geometry.
- **Live Monocular Webcam MediaPipe Inference**: In production, the system ingests 2D RGB frames from a single webcam at 30 FPS, predicting 3D landmarks via a lightweight neural network (MediaPipe BlazePose). Monocular tracking introduces depth jitter, perspective distortion, motion blur, and limb self-occlusion.
- **Unverified Accuracy Transfer**: While real-time latency (57.0 ms) and viewpoint classification (100%) were validated on physical volunteer webcams, **the direct transfer of the 80.6% movement-quality classification accuracy to live monocular webcams remains unverified** without in-the-wild video annotations. Live webcam outputs serve as assistive motor-learning feedback, not gold-standard clinical measures.
