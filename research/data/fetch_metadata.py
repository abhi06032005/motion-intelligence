"""Fetch metadata, README, and label files from the Vakanski UI-PRMD repository."""

import urllib.request

FILES = [
    "README.md",
    "Data/Prepare_Data_for_NN.m",
    "Data/Prepare_Labels_for_NN.m",
    "Data/Labels_Correct.csv",
    "Data/Labels_Incorrect.csv",
]

for fname in FILES:
    url = f"https://raw.githubusercontent.com/avakanski/A-Deep-Learning-Framework-for-Assessing-Physical-Rehabilitation-Exercises/master/{fname}"
    print(f"Fetching {fname}...")
    try:
        content = urllib.request.urlopen(url).read().decode("utf-8", errors="ignore")
        print(f"=== {fname} ({len(content)} chars) ===")
        print(content[:1500])
        print("\n" + "=" * 50 + "\n")
    except Exception as e:
        print(f"Error fetching {fname}: {e}")
