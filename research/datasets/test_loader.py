"""Quick verification of uiprmd_loader."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from research.datasets.uiprmd_loader import load_all_uiprmd_squats

trials = load_all_uiprmd_squats()
print(f"Loaded {len(trials)} authentic trials.")
t0 = trials[0]
print("Trial 0:", t0.subject_id, t0.trial_id, t0.protocol)
print("Biomechanics:", t0.compute_ground_truth_biomechanics())
lms = t0.project_to_virtual_camera(45.0)
print(f"Virtual camera (45 deg): {len(lms)} frames, {len(lms[0])} landmarks/frame")
