# MotionIQ: Independent Webcam Evaluation & Volunteer Protocol (Phase 7)

## 1. Protocol Objective & Ethical Boundaries

The goal of this evaluation is to empirically characterize the real-time performance, tracking stability, viewpoint classification robustness, and sensorimotor latency of MotionIQ on live consumer webcams under genuine physical variations (lighting, camera elevations, distances, and clothing).

### Critical Ethical & Methodological Safeguards
1. **Zero Video Storage (Privacy-Preserving Edge Architecture)**: All MediaPipe Pose Landmarker models execute locally in the client browser (WASM/WebGL). No raw video, RGB frames, or facial imagery are ever recorded, saved to disk, or transmitted over the network.
2. **Informed Consent**: Every volunteer provided informed written consent acknowledging:
   - The non-diagnostic, non-medical nature of the automated motion feedback.
   - Complete anonymization of extracted kinematic parameters (`Participant_01`, `Participant_02`, etc.).
   - The absolute right to pause or terminate participation at any moment without penalty.
3. **No Clinical Technique Overclaiming**: While the software detects kinematic deviations (e.g. knee valgus or depth thresholds), volunteer sessions are reported strictly for **tracking stability, latency, and view classification accuracy**; we do not claim clinically validated diagnostic accuracy on volunteers without independent board-certified physical therapist video reviews.

---

## 2. Experimental Setup & Hardware Matrix

- **Camera Sensor**: Logitech C920 Pro HD Webcam (1080p RGB, 30 FPS, rolling shutter).
- **Capture Environment**: Tripod-mounted at $0.95\,\text{m}$ height, $2.4\,\text{m}$ stand-off distance from the volunteer.
- **Client Device**: Windows 11 Pro 64-bit, Intel Core i7-13700H, NVIDIA RTX 4060 Laptop GPU, Google Chrome 129 (V8 12.9, WebGL 2.0).
- **Lighting Conditions**:
  - *Well-Lit Fluorescent*: $\sim 520\,\text{lux}$ ambient illumination.
  - *Low-Light Single Lamp*: $\sim 48\,\text{lux}$ localized illuminance.
  - *Backlit*: Natural window backlighting producing silhouette contrast.

---

## 3. Volunteer Usability Observations (3 Participants, 5 Sessions)

| Participant | Exercise | Camera View | Lighting | Reps Physical | Reps Detected | View Accuracy | Latency P50 | Tracking Quality & Usability Observations |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| **Participant 01** | Squat | $0^\circ$ (Frontal) | Well-lit ($520\,\text{lux}$) | 5 | 5 | Correct | 56.4 ms | Stable landmarking; squat depth and rep cadence detected cleanly. |
| **Participant 01** | Squat | $90^\circ$ (Lateral) | Well-lit ($520\,\text{lux}$) | 5 | 5 | Correct | 57.8 ms | Contralateral leg occluded; view gating appropriately suppressed valgus rule. |
| **Participant 02** | Squat | $45^\circ$ (Oblique) | Low-light ($48\,\text{lux}$) | 4 | 4 | Correct | 59.2 ms | Mild ankle landmark jitter in shadow; Kalman pose filter maintained tracking. |
| **Participant 03** | Bicep Curl | $0^\circ$ (Frontal) | Well-lit ($520\,\text{lux}$) | 6 | 6 | Correct | 55.1 ms | Bilateral arm velocity profiles smooth; clear inflection phase transitions. |
| **Participant 03** | Push-Up | $90^\circ$ (Lateral) | Backlit Window | 5 | 4 | Correct | 58.7 ms | Silhouette contrast caused 1 rep to miss inflection threshold; otherwise stable. |

### Aggregate Summary
- **Viewpoint Classification Accuracy**: **100.0%** (5 out of 5 sessions correctly classified).
- **Repetition Cadence Accuracy**: **96.0%** (24 out of 25 physical repetitions detected).
- **Measured Round-Trip Feedback Latency**: **57.4 ms** median (sub-100 ms P95: 89.7 ms, $\approx 17.5\,\text{FPS}$).

---

## 4. Disagreement Analysis: Physical Webcams vs. Virtual-Camera Projections

| Factor | Virtual Camera Projections (UI-PRMD Mocap) | Physical Monocular Webcams | Biomechanical Impact |
| :--- | :--- | :--- | :--- |
| **Limb Coordinates** | Optical retroreflective markers ($\pm 1.0\,\text{mm}$ error). | Neural pseudo-3D landmark regression ($\pm 15\text{--}25\,\text{mm}$ error). | Webcams exhibit high-frequency coordinate noise requiring Kalman filtering. |
| **Occlusion** | Analytically attenuated visibility for far joints. | Dynamic self-occlusion with neural boundary hallucination. | Physical webcams require uncertainty-aware selective abstention (Model E). |
| **Motion Blur** | Instantaneous stroboscopic optical capture (100 Hz). | Rolling shutter motion blur at 30 FPS. | Fast concentric reps ($<0.8\,\text{s}$) require velocity smoothing to prevent SPARC degradation. |
| **Clothing** | Form-fitting Plug-in Gait suit. | Loose street clothing and sweatpants. | Loose clothing induces lateral condyle drift ($3\text{--}5\,\text{cm}$); mitigated by view-aware gating. |
