# Data Licensing & Ethical Usage Compliance

MotionIQ enforces strict adherence to scientific data governance, non-commercial research licensing, and participant privacy.

---

## 1. Dataset Licenses

### UI-PRMD
- **Citation:** Vakanski et al., *A Data Set of Human Body Movements for Physical Rehabilitation Exercises*, Data 2018, 3(1), 2. https://doi.org/10.3390/data3010002
- **License:** Creative Commons Attribution 4.0 International (CC BY 4.0)
- **Usage:** Free to share and adapt for academic research with proper attribution.

### UL-RED (University of Liverpool Rehabilitation Dataset)
- **Citation:** University of Liverpool Research Data Catalogue, Item 2729. https://datacat.liverpool.ac.uk/2729/
- **License:** Creative Commons Attribution-NonCommercial 4.0 (CC BY-NC 4.0)
- **Usage:** Strictly non-commercial evaluation and comparative research.

### KIMORE
- **Citation:** Capecci et al., *The Kimore Dataset: Kinematic Assessment of Movement and Clinical Scores for Low Back Pain Rehabilitation*, IEEE TNSRE, 2019. https://doi.org/10.1109/TNSRE.2019.2923060
- **Usage:** Academic non-commercial research. RGB data is not redistributed. Skeletons only.

### RepCount
- **Citation:** Gao et al., *A Large-Scale Benchmark for Repetition Counting in Extreme Videos*, CVPR 2022.
- **License:** Academic use only.
- **Usage:** Source video rights remain with original content creators. MotionIQ distributes only normalized joint coordinates and temporal rep boundary annotations, never re-hosting raw third-party video streams.

---

## 2. Participant Privacy & Webcam Video Retention

MotionIQ operates on a strict **zero-retention camera policy** by default:
1. **Live Camera Frames:** Processed entirely in the client's browser memory using MediaPipe WebAssembly / WebGPU. No raw camera frames or pixel arrays are transmitted to the server.
2. **WebSocket Landmark Streams:** Only 33 normalized floating-point coordinate tuples $(x, y, z, v)$ are sent over encrypted WebSockets (`wss://`).
3. **Session Histories:** Stored locally in browser `localStorage` / `IndexedDB` unless the user explicitly logs in and grants consent for cloud persistence.
4. **Export & Right to Erasure:** Complete one-click data deletion (`DELETE /api/sessions/{id}`) and JSON export (`GET /api/sessions/export`) are provided in the UI.
