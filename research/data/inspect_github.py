"""Inspect Vakanski UI-PRMD GitHub repository contents and download files directly."""

import json
import urllib.request
from pathlib import Path

BASE_API = "https://api.github.com/repos/avakanski/A-Deep-Learning-Framework-for-Assessing-Physical-Rehabilitation-Exercises/contents"


def fetch_contents(path=""):
    url = f"{BASE_API}/{path}".rstrip("/")
    req = urllib.request.Request(url, headers={"User-Agent": "MotionIQ-Audit"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())


if __name__ == "__main__":
    print("=== ROOT CONTENTS ===")
    root_items = fetch_contents("")
    for item in root_items:
        print(f"  {item['name']} ({item['type']}, {item.get('size', 0)} bytes)")

    print("\n=== DATA FOLDER CONTENTS ===")
    data_items = fetch_contents("Data")
    for item in data_items:
        print(f"  {item['name']} ({item['type']}, {item.get('size', 0)} bytes)")
        print(f"    download_url: {item.get('download_url')}")
