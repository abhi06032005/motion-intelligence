"""Inspect jkaethee repository provenance and paper information."""

import urllib.request

url = "https://raw.githubusercontent.com/jkaethee/UI-PRMD_Exercise_Model/master/README.md"
req = urllib.request.Request(url, headers={"User-Agent": "MotionIQ"})
content = urllib.request.urlopen(req).read().decode("utf-8")
print("=== README.md ===")
print(content)
