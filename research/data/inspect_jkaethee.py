"""Inspect jkaethee/UI-PRMD_Exercise_Model segmented movements."""

import json
import urllib.parse
import urllib.request

BASE = "https://api.github.com/repos/jkaethee/UI-PRMD_Exercise_Model/contents"

for subpath in [
    "Segmented Movements",
    "Segmented Movements/Vicon",
    "Segmented Movements/Vicon/Positions",
    "Incorrect Segmented Movements/Vicon/Positions",
]:
    print(f"=== {subpath} ===")
    try:
        quoted = urllib.parse.quote(subpath)
        url = f"{BASE}/{quoted}"
        req = urllib.request.Request(url, headers={"User-Agent": "MotionIQ"})
        items = json.loads(urllib.request.urlopen(req).read().decode())
        print(f"  Count: {len(items)}")
        for item in items[:10]:
            print(f"    {item['name']} ({item['type']}, {item.get('size', 0)} bytes)")
    except Exception as e:
        print(f"  Error: {e}")
    print()
