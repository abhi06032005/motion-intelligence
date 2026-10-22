"""Check UI-PRMD repositories on GitHub."""

import json
import urllib.request

REPOS = [
    "fokhruli/STGCN-rehab",
    "jkaethee/UI-PRMD_Exercise_Model",
    "aakash2016/ui-prmd-python",
]

for repo in REPOS:
    print(f"=== {repo} ===")
    try:
        url = f"https://api.github.com/repos/{repo}/contents"
        req = urllib.request.Request(url, headers={"User-Agent": "MotionIQ"})
        items = json.loads(urllib.request.urlopen(req).read().decode())
        for item in items:
            print(f"  {item['name']} ({item['type']}, {item.get('size', 0)} bytes)")
    except Exception as e:
        print(f"  Error: {e}")
    print()
