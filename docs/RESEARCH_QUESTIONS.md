# MotionIQ: Research Questions and Hypotheses

## Academic Context

This document articulates the scientific research questions (RQs) and experimental hypotheses evaluated within MotionIQ. The research directly addresses open challenges in computer vision, human motion analysis, and trustworthy artificial intelligence relevant to Erasmus Mundus programmes (such as **IPCVAI** — Image Processing and Computer Vision / AI, and **IMLEX** — Imaging and Light in Extended Reality).

---

## Research Question 1 (RQ1): Viewpoint Invariance & Geometric Distortion

> **RQ1**: *To what extent does explicit 3D camera viewpoint estimation and angle-conditional rule gating eliminate false-positive biomechanical defect classifications caused by planar perspective foreshortening?*

### Motivation
Standard rule-based exercise analysis systems evaluate 2D planar distances between joints (e.g. Euclidean distance between knee joints relative to ankle joints). When an athlete turns away from the optical axis into a lateral or oblique orientation, normal 2D perspective foreshortening shrinks the perceived inter-knee distance. This produces catastrophic false alarms (e.g. reporting severe "Knee Valgus" during a flawless lateral squat).

### Hypothesis (H1)
By computing the continuous 3D normal vector of the torso plane $(\vec{v}_{torso})$ and dynamically suppressing out-of-plane biomechanical rules (such as frontal knee valgus during lateral orientations), false alarm rates on off-axis sequences can be reduced to 0.0% without sacrificing detection sensitivity on frontal planes.

### Experimental Outcome
- **Model A (Baseline)**: Suffers high false alarm rates and complete classification collapse on profile views (Macro-F1 drops to 0.167 across multi-view sequences).
- **Model B & D (View-Gated)**: Achieves 0.0% false warning rates on lateral profiles, elevating Macro-F1 to 1.000 across the multi-view benchmark partition.

---

## Research Question 2 (RQ2): Temporal Kinematics vs. Frame-Isolated Thresholds

> **RQ2**: *How does continuous temporal trajectory modeling (joint angular velocity profiles and Spectral Arc Length) improve repetition boundary segmentation and movement quality evaluation compared to static, frame-isolated angle thresholds?*

### Motivation
Human movement is inherently dynamic. Static angle evaluations cannot distinguish between a controlled eccentric descent and an uncontrolled ballistic collapse. Furthermore, frame-isolated state machines are susceptible to boundary chatter when joint angles hover near hard thresholds.

### Hypothesis (H2)
Integrating continuous joint angular velocity profiles $\omega(t) = \frac{\Delta \theta}{\Delta t}$ and Spectral Arc Length (SPARC) smoothness metrics will:
1. Enable precise segmentation of eccentric vs. concentric phases based on velocity zero-crossings.
2. Quantify motor control degradation and jerkiness without requiring manual threshold tuning per individual.

### Experimental Outcome
- Model C and Model D successfully extract normalized SPARC smoothness indices (0.88–0.92 on controlled repetitions vs. <0.60 on erratic descents), correctly identifying pacing defects and bilateral imbalances across multi-subject test splits.

---

## Research Question 3 (RQ3): Calibrated Uncertainty & Selective Abstention

> **RQ3**: *Can a multi-factor reliability function combining landmark visibility, anthropometric segment consistency, and temporal tracking stability provide calibrated confidence estimates that allow the system to reliably abstain rather than provide erroneous coaching feedback?*

### Motivation
In real-world webcam environments, self-occlusion (e.g. arms crossing the torso, turning away from camera) and boundary dropouts occur frequently. Conventional neural or rule-based systems tend to force a prediction even under severe occlusion, presenting a significant risk of misleading physical exercise coaching.

### Hypothesis (H3)
A calibrated reliability scoring mechanism $R \in [0, 1]$ will identify out-of-distribution or occluded frames, allowing the system to selectively abstain when $R < \tau_{abstain}$, thereby decreasing empirical Brier scores and Expected Calibration Error (ECE) on retained predictions.

### Experimental Outcome
- Model D achieved selective abstention on 12.5% of ambiguous/occluded frames in the benchmark partition.
- Retained predictions demonstrated zero false warnings, validating that selective abstention is a viable safeguard for automated biomechanical feedback systems.
