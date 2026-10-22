"""Download and inspect an authentic UI-PRMD Vicon position file."""

import urllib.parse
import urllib.request
import numpy as np

fname = "m01_s01_e01_positions.txt"
subpath = f"Segmented Movements/Vicon/Positions/{fname}"
url = f"https://raw.githubusercontent.com/jkaethee/UI-PRMD_Exercise_Model/master/{urllib.parse.quote(subpath)}"

print(f"Downloading {url}...")
content = urllib.request.urlopen(url).read().decode("utf-8")
lines = [l.strip() for l in content.strip().split("\n") if l.strip()]

print(f"File: {fname}")
print(f"Total frames: {len(lines)}")
first_row = [float(x) for x in lines[0].split(",")]
print(f"Values per frame: {len(first_row)}")
print(f"Joint count (assuming 3D x,y,z): {len(first_row) / 3}")
print(f"First 6 values: {first_row[:6]}")
print(f"Last 6 values: {first_row[-6:]}")
