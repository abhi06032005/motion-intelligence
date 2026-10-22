# MotionIQ: Limitations, Ethical Boundaries & Future Work

## 1. Non-Medical and Ethical Scope

### 1.1 Strict Non-Clinical Scope
MotionIQ is a computer vision research prototype and fitness movement visualization platform. **It is not a medical device, diagnostic system, or clinical rehabilitation tool.**
- It does not diagnose musculoskeletal pathology, joint impingement, ligament tears, or spinal anomalies.
- Biomechanical rules represent geometric heuristics adapted from sports science guidelines, not medical prescriptions.
- Users must always consult certified physiotherapists or medical professionals before undertaking rehabilitation exercises.

### 1.2 Data Privacy & Biometric Sovereignty
- **Default Privacy Mode**: Live camera feeds are processed strictly client-side within the browser WebAssembly environment. Raw video frames are never transmitted to external servers.
- **Data Minimisation**: When WebSockets are engaged, only numeric 33-coordinate landmark arrays are streamed.
- **User Control**: Session history is stored in local browser storage (`localStorage`) and can be exported as raw JSON or permanently cleared at any time.

---

## 2. Technical and Biomechanical Limitations

### 2.1 Monocular 2D-to-3D Ambiguity
- MediaPipe Pose Landmarker predicts relative depth ($z$) from a single RGB camera view. Without calibrated stereoscopic cameras or structured light sensors, depth estimation is susceptible to scale ambiguity, especially when a user changes distance from the lens.
- Rotational yaw is accurately estimated for the torso, but rotational twists of the pelvis or femur remain ambiguous from single monocular perspectives.

### 2.2 Occlusion and Boundary Conditions
- **Self-Occlusion**: In standard profile push-ups, the far arm and leg are completely occluded by the torso. While Model B and D suppress evaluation of occluded limbs, full 3D reconstruction is not possible without multi-camera setups.
- **Clothing and Environment**: Loose-fitting or baggy clothing degrades surface landmark localization, shifting joint centers away from anatomical rotation axes.
- **Low Light and Motion Blur**: Rapid ballistic movements exceeding 30 Hz shutter speeds induce motion blur, causing landmark jitter that triggers the uncertainty gate to abstain.

### 2.3 Exercise Breadth
- The real-time evaluation engine currently supports:
  - Squat (frontal and lateral)
  - Push-up (lateral preferred)
  - Bicep Curl (bilateral and alternating)
  - 8 Static Yoga Poses
- Complex multi-planar compound movements (e.g., Olympic clean-and-jerk, kettlebell snatches) require higher frame-rate capture (>60 FPS) and validated 3D biomechanical datasets before they can be responsibly supported.

### 2.4 Domain Gap: Virtual Vicon Projection vs. Live Monocular Webcam MediaPipe Inference
- **Laboratory Optical Mocap vs. In-the-Wild RGB Estimation**:
  The academic benchmark results (80.6% Balanced Accuracy, 19.4% selective risk) were obtained using 200 authentic UI-PRMD recordings captured by a 100 Hz Vicon optical system with retro-reflective markers ($< 1\,\text{mm}$ error) projected into virtual camera perspectives.
- **Unverified Accuracy Transfer**:
  In physical deployment, the client browser estimates 3D skeletal landmarks from a single 2D RGB webcam at 30 FPS using MediaPipe BlazePose. While latency (57.0 ms) and view-classification accuracy (100% on 5 pilot sessions) have been verified, **the zero-shot transfer of the 80.6% movement-quality classification accuracy from Vicon data to live monocular webcams has NOT been clinically validated across a large patient population**. Monocular RGB inference introduces depth jitter, perspective foreshortening, clothing deformation, and lighting variations that are absent in optical laboratory data.
- **assistive Scope**:
  Live webcam outputs serve as assistive visual motor-learning aids, not gold-standard clinical measures. Users and clinicians must interpret live webcam indicators with appropriate caution.

---

## 3. Future Research Directions

1. **Multi-Camera WebRTC Synchronization**: Fusing two inexpensive smartphone or webcam streams using epipolar geometry to resolve monocular depth ambiguity.
2. **In-Browser ONNX Spatial-Temporal Graph Convolutional Networks (ST-GCN)**: Integrating lightweight graph neural networks for learned movement quality assessment alongside kinematic rules.
3. **OpenSim Biomechanical Muscle Force Estimation**: Feeding filtered `.trc` trajectories into OpenSim musculo-skeletal models to compute estimated joint contact forces and tendon moments.
