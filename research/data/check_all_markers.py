"""Print Z ranges of all 39 markers to identify anatomical landmarks."""

import numpy as np
from pathlib import Path

data = np.loadtxt("research/data/uiprmd/raw/m01_s01_e01_positions.txt", delimiter=",").reshape(-1, 39, 3)

for m in range(39):
    z_min = data[:, m, 2].min()
    z_max = data[:, m, 2].max()
    z_mean = data[:, m, 2].mean()
    y_mean = data[:, m, 1].mean()
    x_mean = data[:, m, 0].mean()
    print(f"Marker {m:02d}: Z=[{z_min:.0f}..{z_max:.0f}] (mean {z_mean:.0f}), Y_mean={y_mean:.0f}, X_mean={x_mean:.0f}")
