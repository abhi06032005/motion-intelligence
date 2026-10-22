"""Inspect joint naming and mapping in uiprmd_data.py."""

import urllib.request

url = "https://raw.githubusercontent.com/jkaethee/UI-PRMD_Exercise_Model/master/uiprmd_data.py"
content = urllib.request.urlopen(url).read().decode("utf-8")
print(content[:2500])
