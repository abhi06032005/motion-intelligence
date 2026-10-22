# Upstream Attribution & Open-Source Licenses

MotionIQ acknowledges and builds upon foundational work from the open-source computer vision, biomechanics, and web development communities.

---

## 1. Primary Upstream: exercise-form-correction

- **Source:** [https://github.com/shahmir2004/exercise-form-correction](https://github.com/shahmir2004/exercise-form-correction)
- **Author:** Muhammad Shahmir Ahmed (2026)
- **License:** MIT License
- **Commit:** `b1e56f009f4db193514216914ddb4b69c49c684a`
- **Reused Components:**
  - MediaPipe 33-landmark coordinate validation logic (`pipeline/validator.py`)
  - 3D landmark Kalman filter state tracking (`pipeline/kalman.py`)
  - HMM state transition models (`pipeline/hmm.py`)
  - Base repetition counting state machine (`pipeline/rep_counter.py`)
  - Squat, pushup, bicep curl, and yoga pose geometric criteria (`exercises/`)
  - WebSocket protocol and session management architecture (`state_machine/manager.py`)

### Full License Text:
```text
MIT License

Copyright (c) 2026 Muhammad Shahmir Ahmed

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 2. Secondary Upstream: Sports2D

- **Source:** [https://github.com/davidpagnon/Sports2D](https://github.com/davidpagnon/Sports2D)
- **Author:** David Pagnon (2023)
- **License:** BSD 3-Clause License
- **Commit:** `e3b15be162182abbfe5d2084ac6b0d3f3d6099ed`
- **Reused Components:**
  - Kinematic Butterworth filtering and segment-length anthropometric ratios adapted for the offline scientific evaluation module (`research/adapters/sports2d_adapter.py`).

### Full License Text:
```text
BSD 3-Clause License

Copyright (c) 2023, David Pagnon
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this
   list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice,
   this list of conditions and the following disclaimer in the documentation
   and/or other materials provided with the distribution.

3. Neither the name of the copyright holder nor the names of its
   contributors may be used to endorse or promote products derived from
   this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
```

---

## 3. Pose Estimation: Google MediaPipe

- **Source:** [https://github.com/google-ai-edge/mediapipe](https://github.com/google-ai-edge/mediapipe)
- **License:** Apache License 2.0
- **Model Topology:** BlazePose 33 3D Pose Landmarks
- **Usage:** Browser-side WebAssembly / WebGPU pose landmarker model (`@mediapipe/tasks-vision`).
