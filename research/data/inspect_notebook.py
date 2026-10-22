"""Inspect UI-PRMD pre-processing notebook."""

import json
import urllib.request

url = "https://raw.githubusercontent.com/jkaethee/UI-PRMD_Exercise_Model/master/UI-PRMD%20pre-processing.ipynb"
req = urllib.request.Request(url, headers={"User-Agent": "MotionIQ"})
nb = json.loads(urllib.request.urlopen(req).read().decode("utf-8"))

print(f"Total cells: {len(nb['cells'])}")
for i, cell in enumerate(nb["cells"]):
    if cell["cell_type"] == "code":
        src = "".join(cell["source"])
        if "pos" in src or "ang" in src or "Vicon" in src or "Kinect" in src:
            print(f"=== Cell {i} ===")
            print(src[:800])
            print()
