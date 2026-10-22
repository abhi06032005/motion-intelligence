"""Analyze Vicon position columns and marker trajectories in UI-PRMD."""

import numpy as np
from pathlib import Path

raw_file = Path("research/data/uiprmd/raw/m01_s01_e01_positions.txt")
data = np.loadtxt(raw_file, delimiter=",")
print(f"Shape of data: {data.shape}")  # (frames, 117)
print(f"Min values: {data.min(axis=0)[:9]}")
print(f"Max values: {data.max(axis=0)[:9]}")

# 117 values = 39 3D points (x, y, z)
pts = data.reshape(-1, 39, 3)
print(f"Reshaped: {pts.shape}")

# Print mean coordinates for first 10 markers
for m in range(15):
    mean_xyz = pts[:, m, :].mean(axis=0)
    std_xyz = pts[:, m, :].std(axis=0)
    print(f"Marker {m:02d}: mean=[{mean_xyz[0]:.1f}, {mean_xyz[1]:.1f}, {mean_xyz[2]:.1f}] mm, std_z={std_xyz[2]:.1f}")
