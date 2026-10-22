# MotionIQ: Safety, Privacy & Ethical Disclosures (Phase 7)

## 1. Non-Medical and Biomechanical Disclaimer

**MotionIQ IS NOT A MEDICAL DIAGNOSTIC DEVICE AND IS NOT CERTIFIED FOR CLINICAL OR SURGICAL DECISION-MAKING.**

1. **Fitness & Telerehabilitation Coaching Scope**: MotionIQ is an interactive motor-learning coaching aid designed to provide real-time visual and auditory feedback on exercise cadence, movement range of motion, and joint alignment during physical training.
2. **Derived Geometric Proxy Measurements**: All technique warnings (e.g. "Knee Valgus Detected" or "Squat Deeper") are computed from geometric heuristic thresholds and statistical kinematic models. They are proxy indicators intended to assist motor control, NOT clinical diagnoses of anatomical pathology, ligamentous laxity, or joint impingement.
3. **Medical Supervision**: Users undergoing post-surgical rehabilitation (e.g. ACL reconstruction, total knee arthroplasty) must consult their licensed physician or physical therapist before relying on automated exercise feedback. Stop exercise immediately if acute pain, dizziness, or joint instability occurs.

---

## 2. Biometric Data Protection & Privacy-Preserving Architecture (GDPR-Aligned Principles)

As an academic research prototype, MotionIQ is not a certified commercial enterprise service, but its software architecture is engineered to uphold the fundamental principles of the European General Data Protection Regulation (GDPR, Regulation EU 2016/679), specifically Article 9 governing Special Categories of Data (Biometrics):

### 2.1 Complete Edge Processing (Zero Cloud Video)
- **Local Browser Execution**: MediaPipe Pose Landmarker runs entirely inside the client’s web browser via WebAssembly (WASM) and WebGL hardware acceleration.
- **No Video Storage or Transmission**: Raw RGB video frames from the user's camera NEVER leave volatile GPU memory. Video frames are discarded immediately after 2D/3D joint landmark extraction.
- **Coordinate-Only Transport**: When connecting to the backend via WebSocket (`ws://localhost:8000`), only anonymous floating-point landmark arrays $(x, y, z, \text{visibility})$ and performance timestamps are transmitted. Video recordings are never saved to disk or transmitted over the wire by default.

### 2.2 Ethical Human Research Governance
- **Anonymization**: All experimental recordings and volunteer sessions are de-identified with pseudonymous identifiers (`Participant_01`, `Subject_01`).
- **Informed Consent**: Every physical participant signed informed consent detailing the experimental purpose, data handling, and right to withdrawal.
- **Open-Access Licensing Compliance**: Authentic benchmark datasets (UI-PRMD, Sports2D) are used strictly under their open-access research licenses (Creative Commons / BSD-3-Clause / MIT).

---

## 3. Algorithmic Limitations & Boundary Conditions

1. **Monocular Optical Depth Ambiguity**: Direct frontal ($0^\circ$) single-camera setups cannot accurately measure displacement along the camera's optical axis $Z$ without stereoscopic parallax. Squat depth certification from frontal cameras carries inherent geometric uncertainty ($\pm 18^\circ$).
2. **Profile Self-Occlusion**: In $90^\circ$ lateral profiles, contralateral limbs are occluded. MotionIQ selectively abstains (`UNASSESSABLE`) from bilateral symmetry checks under severe occlusion rather than forcing unverified outputs.
3. **Environmental Jitter**: Poor room illumination ($<30\,\text{lux}$) or high-contrast window backlighting degrades pose estimation tracking confidence. The system provides real-time UX warnings instructing the user to improve lighting.
