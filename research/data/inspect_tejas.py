"""Inspect tejas1904 repo contents."""

import json
import urllib.request

req = urllib.request.Request(
    "https://api.github.com/repos/tejas1904/UI-PRMD-Visualize-python-port/contents/data",
    headers={"User-Agent": "MotionIQ"}
)
items = json.loads(urllib.request.urlopen(req).read().decode())
for item in items:
    print(f"{item['name']} ({item['type']}, {item.get('size', 0)} bytes)")
