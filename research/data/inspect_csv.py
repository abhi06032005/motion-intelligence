"""Inspect Data_Correct.csv header and row structure."""

import urllib.request

url = "https://raw.githubusercontent.com/avakanski/A-Deep-Learning-Framework-for-Assessing-Physical-Rehabilitation-Exercises/master/Data/Data_Correct.csv"
req = urllib.request.Request(url, headers={"Range": "bytes=0-10000", "User-Agent": "MotionIQ"})

try:
    with urllib.request.urlopen(req) as r:
        chunk = r.read().decode("utf-8", errors="ignore")
        lines = chunk.strip().split("\n")
        print(f"Num lines preview: {len(lines)}")
        for i, l in enumerate(lines[:3]):
            vals = l.strip().split(",")
            print(f"Row {i}: {len(vals)} values. First 5: {vals[:5]}")
except Exception as e:
    print("Range request failed:", e)
