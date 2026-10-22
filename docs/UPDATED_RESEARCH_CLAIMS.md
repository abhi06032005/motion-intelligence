# MotionIQ: Updated Research Claims & Verified Findings (Phase 6)

## 1. Executive Summary

This document formalizes the updated scientific claims of **MotionIQ** following the completion of **Phase 6: Real-Data Model Improvement and Independent Evaluation**.

All claims are supported by **Leave-One-Subject-Out (LOSO) 10-fold cross-validation** on **200 authentic 100 Hz Vicon motion-capture recordings** from the University of Idaho Physical Rehabilitation Movement Dataset (UI-PRMD), evaluated across 3 virtual camera projections ($0^\circ, 45^\circ, 90^\circ = 600$ streams total), and live volunteer webcam sessions.

---

## 2. Delineation of Claims Across Project Phases

| Evaluation Dimension | Legacy Diagnostic (Phase 1–4) | Phase 5 Audit Baseline | Phase 6 Verified Finding (LOSO 10-Fold) | Scientific Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **Data Integrity** | 16 synthetic sine waves labeled as "UI-PRMD". | 200 authentic Vicon files ingested. | **200 authentic Vicon files with unified metric perspective projection**. | Corrected projection flaw where knees/ankles were clipped to $y=0.950$. |
| **Evaluation Protocol** | Fixed train/test split with identical subjects. | Holdout split on Subjects 09 & 10 only. | **Strict Leave-One-Subject-Out (LOSO) across all 10 subjects**. | Zero subject leakage; threshold tuning strictly within training folds. |
| **Movement Quality Assessment** | Claimed 1.000 F1 (ground-truth leakage). | Weak generalization (FWR 50%, TPR 25%). | **Model E achieves 80.6% Balanced Accuracy (Macro-F1 0.805, Sensitivity 81.3%, Specificity 79.8%)**. | Supervised temporal kinematics + view-aware gating + selective abstention. |
| **Camera View Invariance** | Unmeasured. | Model A planar rules failed on side view. | **Model A exhibits 74.0% FWR on lateral views. Model D/E view gating slashes lateral FWR to 20.2%--23.1%**. | Dynamic 3D torso normal suppresses out-of-plane coronal valgus checks under lateral orientation. |
| **Selective Classification** | Distorted Brier score (0.926). | Abstention rate uncalibrated. | **Selective abstention at 88.5% coverage drops selective risk to 19.4%** (vs 30.2% in Model A). | Margin-based uncertainty gating rejects ambiguous predictions. |
| **System Latency** | Claimed "520 FPS (1.92 ms)". | Decomposed benchmark measured. | **57.0 ms median round-trip (~17.5 FPS)** on desktop GPU; **0.01 ms** offline model inference. | Browser MediaPipe WebGL and WebSocket transport account for the majority of the real-world feedback loop. |

---

## 3. Core Defensible Research Claims

### Claim 1: Geometric Vulnerability of Monocular Planar Rules Across Orientations
**Finding:** Static 2D planar rules evaluating joint alignment collapse under camera viewpoint shifts.
- On authentic UI-PRMD deep squats viewed from a lateral profile ($90^\circ$), upstream planar rules (Model A) exhibit a **74.0% False Warning Rate** because perspective foreshortening brings the projected 2D coordinates of the left and right knees into near coincidence.
- MotionIQ's 3D Torso-Normal View Gating automatically identifies camera azimuth and suppresses coronal valgus evaluation on lateral views, reducing lateral false warnings to **23.1%** while maintaining **84.5% sensitivity** on frontal views.

### Claim 2: Supervised Temporal Kinematics Outperforms Discrete Static Rules
**Finding:** Evaluating multi-frame temporal kinematic trajectories (range of motion, velocity profiles, vertical pelvis displacement, and SPARC smoothness) yields substantially superior generalization across unseen human participants compared to discrete per-frame angle thresholds.
- Under strict Leave-One-Subject-Out cross-validation across 10 human subjects, supervised temporal modeling (Model D) achieves **78.3% Balanced Accuracy** (Macro-F1 = 0.783, FWR = 20.3%), outperforming upstream planar rules (Balanced Accuracy = 69.8%, FWR = 49.3%).

### Claim 3: Selective Classification Reduces Risk Under Visual Ambiguity
**Finding:** Allowing the movement assessment system to selectively abstain (`UNASSESSABLE`) on ambiguous predictions or occluded landmarks significantly enhances decision reliability.
- Model E’s uncertainty gate abstains on $11.5\%$ of ambiguous streams ($88.5\%$ coverage), elevating Balanced Accuracy to **80.6%**, Precision to **82.1%**, and slashing selective error risk from **30.2% down to 19.4%**. Matched-coverage analysis confirms that selective risk decreases monotonically as coverage is swept from 1.00 down to 0.50 (reaching 9.3% risk).

### Claim 4: Real-Time Edge Feasibility with Privacy-Preserving Architecture
**Finding:** High-quality, view-aware movement coaching runs in real time on standard consumer hardware without transmitting raw video to remote cloud servers.
- The platform delivers interactive visual/auditory feedback with a measured median round-trip latency of **57.0 ms (P95: 89.7 ms, ~17.5 FPS)**.
- Local client-side landmark extraction (MediaPipe WebGL) protects user biometric privacy by keeping raw camera RGB frames entirely in client volatile memory.

---

## 4. Boundaries and Limitations

1. **Virtual Camera Projections**: Projections are mathematically exact 3D rotations of authentic laboratory motion capture (200 trials from 10 participants, 600 streams total); they do not simulate physical optical lens flare, rolling shutter sensor blur, or complex non-rigid clothing folds.
2. **Subject Sample Size & Statistical Power**: Paired subject-level testing ($N=10$, $df=9$) demonstrates a mean balanced accuracy improvement of $+8.48\%$ to $+9.66\%$ across 8 out of 10 participants ($p=0.0758$ and $p=0.0635$). This is reported honestly as a strong positive trend rather than proven statistical significance at $\alpha=0.05$.
3. **Clinical Label Granularity**: UI-PRMD provides binary clinical protocol labels ("optimal" vs "non-optimal") assigned by physical therapists. Specific kinematic deviations (e.g. shallow squat depth vs knee valgus) are derived via biomechanical trajectory analysis and serve as visual coaching proxies rather than medical diagnoses.
4. **Non-Medical Disclaimer**: MotionIQ is an interactive motor-learning coaching aid for exercise adherence and telerehabilitation assistance, not an automated orthopedic or medical diagnostic device.
