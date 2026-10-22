# MotionIQ: Literature Review & Academic Delineation (Phase 6)

## 1. Introduction & Context

In movement analysis and computer-vision-based exercise assessment, claiming research novelty requires careful delineation from existing literature. This review compares MotionIQ against seminal published systems (notably **ExeChecker**, **UI-PRMD baselines**, **AQA architectures**, and **selective prediction frameworks**), identifying precisely what prior works achieved and what MotionIQ contributes.

---

## 2. Comparison with Prior Published Research

### 2.1 UI-PRMD Baselines (Vakanski et al., 2018; Liao et al., 2020)
- **Prior Art**: Vakanski et al. (2018) established the UI-PRMD dataset and evaluated autoencoder architectures and Dynamic Time Warping (DTW) to compute trajectory similarity scores relative to an optimal reference template. Liao et al. (2020) trained deep Siamese neural networks to score physical therapy repetitions.
- **Limitations in Prior Work**:
  1. **Template Dependency**: Autoencoder and DTW methods require pre-recording individual reference templates per exercise variant.
  2. **View Orthogonality Assumption**: Evaluations assumed fixed, front-facing camera positioning. When the camera angle shifts, projected 2D distances warp, degrading DTW scores.
  3. **No Dynamic Rule Gating**: Prior works either scored whole-sequence similarity or evaluated static rules without view awareness.

### 2.2 ExeChecker (Fieraru et al., CVPR 2021)
- **Prior Art**: ExeChecker introduced a large-scale video dataset for exercise mistake detection, utilizing 3D SMPL mesh fitting and spatio-temporal self-attention networks to localize form errors in video clips.
- **Limitations in Prior Work**:
  1. **Heavyweight Computation**: SMPL mesh recovery and multi-frame 3D temporal transformers require high-end server GPUs ($>150\,\text{ms}$ per frame), making edge browser execution infeasible.
  2. **Post-Hoc Video Analysis**: ExeChecker was designed for offline batch video audit rather than low-latency live auditory/visual cueing during movement execution.
  3. **Lack of Selective Abstention**: When joint ambiguity or occlusions occur, the neural model outputs overconfident mistake probabilities rather than communicating unassessability to the trainee.

### 2.3 Action Quality Assessment (AQA) and ST-GCN (Yan et al., 2018; Parmar et al., 2019)
- **Prior Art**: Spatio-Temporal Graph Convolutional Networks (ST-GCN) and AQA regression models predict scalar quality scores for athletic actions (e.g. diving, gymnastics, figure skating).
- **Limitations in Prior Work**:
  1. **Black-Box Scoring**: A continuous score (e.g. 7.4/10) provides zero actionable guidance on *which specific joint* requires correction.
  2. **Uncalibrated Output**: AQA models lack conformal calibration or selective rejection options under out-of-distribution camera angles.

### 2.4 Movement Smoothness and Motor Control (Balasubramanian et al., 2015)
- **Prior Art**: Balasubramanian et al. demonstrated that Spectral Arc Length (SPARC) provides a dimensionless, noise-robust measure of movement smoothness in stroke rehabilitation.
- **Integration in MotionIQ**: We leverage SPARC not as an isolated offline metric, but as an active component in continuous temporal trajectory modeling, detecting hesitation and neuromuscular tremor during repetitions.

### 2.5 Selective Classification (Geifman & El-Yaniv, 2017)
- **Prior Art**: Formalized selective classification with a reject option, trading coverage $\phi$ to guarantee low risk $\mathcal{R}(f, g) \le \epsilon$.
- **Integration in MotionIQ**: MotionIQ applies selective classification to multi-view biomechanics. Rather than forcing continuous technique predictions under profile limb self-occlusion, the system abstains (`UNASSESSABLE`) and provides real-time user repositioning guidance.

---

## 3. Academic Delineation: What Exists vs. What MotionIQ Adds

The table below delineates existing open-source and published techniques from MotionIQ's specific contributions:

| Technique / Component | Existing Literature / Upstream Baseline | MotionIQ Contribution |
| :--- | :--- | :--- |
| **Monocular Pose Estimation** | MediaPipe BlazePose (Bazrev et al., 2020) provides 33 3D landmarks at 30 FPS. | **Reused as-is**: Integrated via client-side Web Worker / WebGL to preserve complete biometric privacy (zero video transmission). |
| **Exercise State Machine** | Peak-valley hysteresis rep counting in `exercise-form-correction` (Shahmir et al.). | **Audited and preserved**: Characterized physical inflection thresholds; demonstrated failure of synthetic sine waves on physical state machines. |
| **Camera View Handling** | Static planar rules assuming canonical frontal camera; collapse on lateral views (Model A FWR = 74.0%). | **Novel 3D Torso-Normal View Gating**: Dynamically calculates camera azimuth and selectively suppresses out-of-plane rules (cutting lateral FWR from 74.0% to 20.2%). |
| **Movement Quality Assessment** | Discrete static rules requiring completed rep triggers, or black-box autoencoders. | **Lightweight Supervised Temporal Modeling**: Supervised temporal model evaluated via strict Leave-One-Subject-Out (LOSO) cross-validation on 200 authentic Vicon recordings, achieving 80.6% Balanced Accuracy. |
| **Failure & Occlusion Handling** | Forced continuous predictions with phantom joint hallucinations. | **Calibrated Selective Abstention**: Rejection option based on prediction margin and joint visibility, cutting selective risk to 19.4% at 88.5% coverage. |
| **Latency Architecture** | Isolated Python array throughput claimed as "520 FPS". | **Decomposed Physical Benchmark**: Full measured round-trip breakdown (57.0 ms median, 17.5 FPS) validating real-time feasibility within human motor reaction thresholds. |

---

## 4. Methodological Non-Claims

In adherence to scientific integrity:
1. **We do not claim novelty for integrating MediaPipe or FastAPI**: These are industry-standard open-source engineering building blocks.
2. **We do not claim a medical diagnostic device**: MotionIQ provides biomechanical motion feedback for fitness and telerehabilitation assistance; it does not replace certified clinical or orthopedic evaluation.
3. **Virtual projections are explicitly acknowledged as simulated camera viewpoints**: They rotate genuine 3D optical trajectories analytically and are statistically analyzed as repeated observations, distinct from real webcam evaluations.
