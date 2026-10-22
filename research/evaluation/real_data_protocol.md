# MotionIQ: Real Human Motion Evaluation Protocol

**Protocol Version**: 2.0 (Peer-Review Defensible)  
**Date**: October 22, 2026  
**Target Context**: Erasmus Mundus IPCVAI & IMLEX Scientific Portfolio

---

## 1. Research Question & Hypotheses

> **Primary Research Question**: *Can camera-view-aware reliability gating reduce false exercise-technique warnings caused by perspective foreshortening without sacrificing the sensitivity to identify genuine movement deviations?*

### Formal Hypotheses
- **Hypothesis 1 (False Warning Reduction)**: Planar 2D heuristic rules (Model A) exhibit a severe false warning rate ($\text{FWR} > 80\%$) when evaluating optimal squats from a profile perspective ($90^\circ$ yaw) due to perspective foreshortening of inter-knee Euclidean distances. 3D torso-normal view gating (Model B/D) will reduce lateral FWR to $<5\%$.
- **Hypothesis 2 (Defect Sensitivity Preservation)**: On assessable viewing angles ($0^\circ$ frontal for knee valgus, $90^\circ$ lateral for squat depth), view-aware rule suppression will maintain true-defect detection sensitivity ($\text{TPR} \ge 85\%$), matching or exceeding planar baselines without indiscriminate warning suppression.
- **Hypothesis 3 (Selective Abstention Tradeoff)**: Uncertainty-gated abstention (Model D) under low landmark visibility or severe out-of-plane angles will improve retained diagnostic precision at the cost of bounded coverage reduction ($\text{Coverage} \ge 80\%$).

---

## 2. Strict Separation of Tasks

To eliminate the ground-truth label leakage identified in the October 2026 audit:

### Task A: Exercise Recognition (Blind Multi-View)
- **Input**: Landmark coordinate stream $\mathbf{X} \in \mathbb{R}^{T \times 33 \times 4}$ with **zero** exercise hint (`exercise = None`).
- **Target**: Predicted exercise class $\hat{y} \in \{\text{squat}, \text{pushup}, \text{bicep\_curl}, \text{unknown}\}$.
- **Evaluation Metric**: Blind Macro-F1 and per-viewpoint recognition accuracy across $0^\circ, 45^\circ, 90^\circ$.

### Task B: Exercise Technique Assessment (Conditioned Coaching)
- **Input**: Landmark coordinate stream $\mathbf{X}$ and user session declaration $\text{exercise} = \text{squat}$.
- **Target**: Form defect flags $\hat{\mathbf{d}} \in \{\text{knee\_valgus}, \text{insufficient\_depth}, \text{clean}\}$.
- **Ground Truth**: Derived directly from pristine 3D Vicon optical markers:
  - 3D Minimum Knee Flexion: $\theta_{\text{knee}} = \angle(\text{LASI}, \text{LKNE}, \text{LANK})$ (Depth defect if $\theta > 105^\circ$).
  - 3D Knee-to-Ankle Width Ratio: $R_{valgus} = \frac{\|\text{LKNE} - \text{RKNE}\|}{\|\text{LANK} - \text{RANK}\|}$ (Valgus defect if $R < 0.72$).
  - Primary Protocol: Binary `optimal` vs `non_optimal` trial labels from UI-PRMD clinical protocol.
- **Constraints**: Test ground truth is **never** passed into features, rule routing, or reliability gates.

---

## 3. Evaluated Models & Control Baselines

1. **Baseline 0 (`no_warning`)**: Control baseline that always predicts clean technique (FWR = 0%, Sensitivity = 0%).
2. **Baseline 1 (`orientation_gating`)**: Naive binary cutoff based solely on coarse bounding-box width ratio without 3D normal vector tracking.
3. **Model A (`model_a_baseline`)**: Upstream unmodified pipeline (HMM + 2D planar Euclidean rules).
4. **Model B (`model_b_view_gated`)**: Continuous 3D torso-normal vector tracking with dynamic angle-gated rule suppression.
5. **Model C (`model_c_temporal`)**: 3D view gating combined with temporal angular velocity tracking and SPARC jerk filtering.
6. **Model D (`model_d_calibrated`)**: Full proposed MotionIQ platform: 3D view gating + temporal kinematics + multi-factor reliability gate with selective abstention.

---

## 4. Subject-Disjoint Partitioning & Validation

To prevent data leakage across human anatomies:
- **Partition A: Holdout Protocol (80/20)**
  - Calibration / Train: `Subject_01` through `Subject_06` (120 recordings)
  - Validation: `Subject_07` and `Subject_08` (40 recordings)
  - Test: `Subject_09` and `Subject_10` (40 recordings, strictly untouched during thresholding)
- **Partition B: Leave-One-Subject-Out (LOSO) Cross-Validation**
  - Iterates 10 folds: Each subject $S_k$ ($k \in \{1..10\}$) is held out as test data while the remaining 9 subjects are used for reference baselines.

---

## 5. Statistical & Performance Metrics

For each model $m \in \{M\}$, viewpoint $\theta \in \{0^\circ, 45^\circ, 90^\circ\}$, and subject $s$:
- **False Warning Rate (FWR)**: $\frac{\text{FP}}{\text{FP} + \text{TN}}$ (evaluated on optimal trials).
- **True Defect Sensitivity (Recall / TPR)**: $\frac{\text{TP}}{\text{TP} + \text{FN}}$ (evaluated on non-optimal trials).
- **Specificity (TNR)**: $1 - \text{FWR} = \frac{\text{TN}}{\text{TN} + \text{FP}}$.
- **Precision**: $\frac{\text{TP}}{\text{TP} + \text{FP}}$ (where $\text{TP} + \text{FP} > 0$).
- **Balanced Accuracy**: $\frac{\text{TPR} + \text{TNR}}{2}$.
- **Coverage**: $\frac{N_{\text{accepted}}}{N_{\text{total}}}$.
- **Abstention Rate**: $\frac{N_{\text{abstained}}}{N_{\text{total}}} = 1 - \text{Coverage}$.
- **Camera View Angle Estimation Error**: Mean absolute angular error $|\hat{\theta}_{\text{yaw}} - \theta_{\text{true}}|$.
- **End-to-End Latency**: Measured millisecond response time across individual pipeline stages.
