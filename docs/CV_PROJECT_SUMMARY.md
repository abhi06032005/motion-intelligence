# MotionIQ — CV Evidence and Portfolio Description

**Stack:** Next.js, React, TypeScript, Tailwind CSS, MediaPipe, FastAPI, Python, WebSockets, NumPy, SciPy.

## Suggested CV entry

**MotionIQ — View-Aware Exercise Assessment** | Next.js, TypeScript, Python, FastAPI, MediaPipe, WebSockets

- Engineered browser-side 33-landmark pose tracking with WebSocket feedback, repetition counting, guided yoga, local video analysis and persistent session analytics.
- Implemented subject-disjoint LOSO evaluation on 200 UI-PRMD optical motion-capture recordings (10 participants, 600 virtual camera streams); committed research artifacts report 80.6% balanced accuracy at 88.5% coverage for uncertainty-gated classification.

## Evidence boundaries

- 600 viewpoint projections are **not** 600 independent human recordings.
- 80.6% is a **laboratory mocap offline result**, not real-webcam, clinical or medical validation.
- Subject-level paired improvement had p = 0.0635; improvement is **not significant at the conventional 0.05 threshold**.
- Source recordings are not committed. Full benchmark reproduction requires independently obtaining and checking their SHA-256 manifests.
- The draft research paper in this repository does **not** count as a peer-reviewed publication.
- Upstream works and source licenses are documented in docs/UPSTREAM_ATTRIBUTION.md; do not claim others' contributions as original.

## Final hands-on demonstration checklist

- Workout webcam: allow/deny permission, exercise transitions, rep counters and session persistence.
- Yoga webcam: live hold feedback and switching poses with the camera kept on.
- Video analysis: upload a squat video and rerun analysis on a second file.
- Sessions: correct real data, empty state, export and delete.
- Research: benchmark API, offline message, provenance and export.
- Mobile layout and production deployment on a real device.

CI verifies code/tests/build and benchmark artifact structure. A physical webcam acceptance test and independent replication of the research are **not** supplied by CI.
