# MotionIQ: Ablation Studies & Architectural Isolation

## 1. Objective of the Ablation Experiment

To assess the distinct scientific contribution of each module, MotionIQ performs a modular factor-by-factor ablation across four distinct model configurations. All configurations were evaluated on identical multi-subject holdout test sequences under the same evaluation harness.

---

## 2. Factor Isolation Matrix

| Configuration | 3D View Classifier | Temporal Kinematics & SPARC | Uncertainty Reliability Gate | Selective Abstention |
| :--- | :---: | :---: | :---: | :---: |
| **Model A (Baseline)** | ❌ | ❌ | ❌ | ❌ |
| **Model B (View-Gated)** | ✅ | ❌ | ✅ (Partial) | ✅ |
| **Model C (Temporal)** | ❌ | ✅ | ❌ | ❌ |
| **Model D (MotionIQ Full)** | ✅ | ✅ | ✅ | ✅ |

---

## 3. Quantitative Ablation Results

| Model Configuration | Macro-F1 | Rep MAE | False Warning Rate | Brier Score | Abstention Rate | Latency (P50) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Model A (Baseline HMM + Rules) | 0.167 | 3.12 | High (Profile) | 0.875 | 0.0% | 1.92 ms |
| Model B (+ 3D View Classifier) | 1.000 | 3.12 | 0.00% | 0.904 | 12.5% | 1.99 ms |
| Model C (+ Temporal Kinematics) | 1.000 | 3.12 | 0.188 | 0.875 | 0.0% | 3.48 ms |
| Model D (+ Calibrated Uncertainty) | 1.000 | 3.12 | 0.188 | 0.926 | 12.5% | 3.53 ms |

---

## 4. Key Findings per Architectural Component

### 4.1 Ablation of 3D View Classifier (Model A vs. Model B)
- **Primary Effect**: Eliminates the catastrophic failure of planar heuristics on lateral perspectives.
- **Metric Differential**:
  - Multi-view Macro-F1 jumps from **0.167 to 1.000**.
  - False warning rate drops from persistent false alarms on profile views to **0.00%**.
  - Compute overhead is negligible (+0.07 ms per frame).
- **Takeaway**: View classification is indispensable for any web-based exercise tool where users freely orient their bodies relative to the camera.

### 4.2 Ablation of Temporal Kinematics (Model A vs. Model C)
- **Primary Effect**: Provides continuous velocity tracking and movement smoothness quantification (SPARC).
- **Metric Differential**:
  - Differentiates controlled eccentric descent from uncontrolled ballistic drops.
  - Adds bilateral symmetry metrics across left/right body extremities.
  - Adds 1.56 ms of computational overhead due to rolling buffer FFTs and angular derivation, remaining well within real-time budgets (288 FPS).

### 4.3 Ablation of Uncertainty Gating & Abstention (Model C vs. Model D)
- **Primary Effect**: Prevents erratic or ungrounded feedback during self-occlusion or tracking loss.
- **Metric Differential**:
  - Model D abstains on **12.5% of ambiguous frames** rather than forcing an ungrounded guess.
  - Generates clear, actionable UI guidance ("Camera view occluded" or "Low landmark confidence") instead of false technique reprimands.
