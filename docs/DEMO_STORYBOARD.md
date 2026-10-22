# MotionIQ: Video Demonstration Storyboard & Walkthrough (Phase 7)

## 1. Overview and Pitch (Duration: ~3 Minutes)

This demonstration storyboard outlines a structured video presentation designed for Erasmus Mundus (IPCVAI / IMLEX) selection committees, highlighting:
1. The real-world problem (monocular perspective collapse and false form alarms).
2. Live privacy-preserving edge execution (57 ms round-trip feedback).
3. 3D Torso-Normal View Gating in action (frontal vs lateral profiles).
4. Independent scientific validation on 200 authentic UI-PRMD Vicon recordings.

---

## 2. Scene-by-Scene Storyboard

### Scene 1: The Problem — Monocular Perspective Flaw (0:00 – 0:35)
- **Visual**: Screen split showing a lifter performing a deep squat from a side camera ($90^\circ$ profile).
- **Overlay**: Standard 2D planar baseline (`Model A`) flagging **"CRITICAL: Severe Knee Valgus Detected"** in bright red.
- **Voiceover**: *"Digital fitness apps rely on single webcams. But planar angle rules assume the camera is directly in front of you. When you turn sideways, your knees overlap in perspective projection. Conventional AI mistakes this normal lateral view for severe knee injury—generating false warnings on over 74% of perfect squats."*

### Scene 2: The Solution — MotionIQ Hybrid Architecture (0:35 – 1:10)
- **Visual**: Cut to MotionIQ live UI (`http://localhost:3000/workout`). Camera initializes.
- **Graphic**: Clean architectural diagram showing MediaPipe WebGL running in the browser, transmitting only 33 coordinates $(x,y,z,v)$ over WebSocket to the FastAPI engine.
- **HUD Indicator**: `Edge Privacy: Active (Zero Cloud Video) | Latency: 56.4 ms (~17.5 FPS)`.
- **Voiceover**: *"Enter MotionIQ: a view-aware, uncertainty-aware motion analysis platform. Raw video stays entirely inside the user's browser, protecting user biometric privacy, while streaming lightweight landmarks to an async kinematic engine with sub-60 ms round-trip feedback."*

### Scene 3: Live View Gating in Action (1:10 – 1:50)
- **Visual**: Volunteer performs squats while rotating from Frontal ($0^\circ$) to Lateral ($90^\circ$).
- **HUD Reaction**:
  - At $0^\circ$: Camera View classified as `Frontal (Azimuth: 4.2°)`. Bilateral symmetry and knee alignment are evaluated.
  - At $90^\circ$: View dynamically updates to `Lateral (Azimuth: 86.8°)`. The valgus rule is automatically suppressed (`Rule Gated: Coronal Valgus Suppressed`). The system switches to sagittal depth and trunk lean.
- **Voiceover**: *"MotionIQ computes a 3D torso-normal vector directly from shoulder and hip vectors. It continuously tracks camera azimuth, dynamically suppressing out-of-plane rules. False lateral alarms drop from 74% to zero, while genuine depth and spinal posture are reliably assessed."*

### Scene 4: Selective Uncertainty Gating & Repositioning Guidance (1:50 – 2:20)
- **Visual**: Volunteer partially occludes lower legs with a bench or steps too close to the camera.
- **HUD Reaction**: System transitions to `Status: UNASSESSABLE`. Instead of hallucinating joint angles or issuing misleading form penalties, an amber prompt appears: *"Step back 0.5m: Feet partially occluded"*.
- **Voiceover**: *"Grounded in selective classification theory, MotionIQ incorporates an Uncertainty Gate. When visual ambiguity or occlusions occur, it has the confidence to abstain, guiding the user rather than guessing."*

### Scene 5: Independent Scientific Validation (2:20 – 3:00)
- **Visual**: Transition to the Research Evidence Dashboard (`http://localhost:3000/research`).
- **Dashboard Walkthrough**: Clicking between the **LOSO 10-Fold Benchmark**, **View-Aware Breakdown**, **Per-Subject Generalization**, and **Latency Decomposition** tabs.
- **Closing Graphic**: Summary card showing 80.6% Balanced Accuracy, 19.4% selective risk, and paired statistical validation across 200 authentic UI-PRMD Vicon trials.
- **Voiceover**: *"Every claim in MotionIQ is backed by rigorous Leave-One-Subject-Out evaluation on 200 authentic optical motion-capture trials from UI-PRMD. MotionIQ bridges the gap between laboratory biomechanics and trustworthy, real-time edge computer vision."*
