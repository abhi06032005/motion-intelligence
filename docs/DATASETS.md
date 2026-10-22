# MotionIQ Dataset Specifications & Canonical Schema

This document details the datasets evaluated, their anatomical modalities, coordinate schemas, joint topologies, and ethical access constraints.

---

## 1. Supported Datasets

| Dataset | Modality | Subjects / Trials | Exercises / Movements | Access & Licensing |
| :--- | :--- | :--- | :--- | :--- |
| **UI-PRMD** | Vicon Optical Mocap + Kinect v2 Skeletons | 10 healthy subjects, 10 reps each | 10 rehabilitation movements (Deep Squat, Hurdle Step, Lunge, Shoulder Flexion, etc.) | Open Access (Creative Commons Attribution 4.0 International) |
| **UL-RED** | RGB Video, Vicon Mocap, Depth | 10 subjects, 1,320 recordings | 22 upper-limb movements | University of Liverpool Research Data (CC BY-NC 4.0) |
| **KIMORE** | Kinect RGB-D + Skeletons | 78 subjects (healthy & back pain) | 5 rehabilitation exercises | IEEE / Academic Research (Non-commercial research use only) |
| **RepCount** | Diverse in-the-wild RGB videos | Multi-subject, thousands of reps | Squats, pull-ups, push-ups, lunges, etc. | Academic research use; annotations open, source video rights retained by creators |
| **FitAQA** | Video QA & Error Localisation | In-the-wild YouTube exercise videos | Fitness form assessment & error intervals | Annotations open on HuggingFace; source videos accessed strictly via streaming URLs |

---

## 2. Anatomical Skeletal Differences & Joint Mappings

A critical scientific pitfall in motion analysis is treating Kinect (25 joints), Vicon (39 markers), and MediaPipe (33 landmarks) as interchangeable. MotionIQ implements rigorous explicit joint mapping matrices:

### MediaPipe vs. Kinect v2 vs. Vicon Plug-in Gait
| Canonical Joint Name | MediaPipe Index | Kinect v2 Index | Vicon Marker Pair |
| :--- | :--- | :--- | :--- |
| **Nose / Head** | 0 | 3 (Head) | RFHD, LFHD |
| **Neck / Cervical Spine**| Inter-shoulder midpoint | 2 (Neck) | C7 |
| **Left Shoulder** | 11 | 4 | LSHO |
| **Right Shoulder** | 12 | 8 | RSHO |
| **Left Elbow** | 13 | 5 | LELB |
| **Right Elbow** | 14 | 9 | RELB |
| **Left Wrist** | 15 | 6 | LWRA, LWRB |
| **Right Wrist** | 16 | 10 | RWRA, RWRB |
| **Mid-Hip / Sacrum** | Midpoint(23, 24) | 0 (SpineBase) | SACR, LPSI, RPSI |
| **Left Hip** | 23 | 12 | LASI |
| **Right Hip** | 24 | 16 | RASI |
| **Left Knee** | 25 | 13 | LKNE |
| **Right Knee** | 26 | 17 | RKNE |
| **Left Ankle** | 27 | 14 | LANK |
| **Right Ankle** | 28 | 18 | RANK |

*Note: Joints not captured by a modality are masked as `NaN` with `visibility=0.0`, rather than zero-filled or hallucinated.*

---

## 3. Canonical Parquet Schema

All raw dataset formats are ingested through adapters into a canonical Parquet schema:

```text
canonical_movement_sequence:
  dataset_id: string          (e.g., "UI-PRMD-v1")
  subject_id: string          (e.g., "Subject_04")
  session_id: string          (e.g., "Trial_02")
  exercise_label: string      (e.g., "deep_squat")
  movement_protocol: string   (e.g., "optimal" vs "non_optimal")
  timestamps_sec: list[float] (monotonically increasing)
  joint_coords_3d: tensor[T, 33, 3] (normalized body frame)
  joint_visibility: tensor[T, 33]   (confidence [0..1])
  coordinate_system: string   ("camera_relative" | "hip_centered_metric")
  camera_view: string         ("frontal" | "lateral" | "oblique" | "unknown")
  repetition_boundaries: list[tuple[int, int]] (start_frame, end_frame)
  movement_quality_score: float (clinician score where available)
  provenance_hash: string     (SHA-256 of source file)
```

---

## 4. Subject-Independent Split Protocol

To strictly prevent data leakage across frames:
- **Train Set:** Subjects 01 through 06 (60%)
- **Validation Set:** Subjects 07 and 08 (20%)
- **Test Set:** Subjects 09 and 10 (20%)
No frames or temporal windows from test subjects ever appear in training or validation folds.
