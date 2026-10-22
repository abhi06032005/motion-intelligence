"""Inspect lower body in visualize.py."""

import urllib.request

url = "https://raw.githubusercontent.com/tejas1904/UI-PRMD-Visualize-python-port/master/visualize.py"
content = urllib.request.urlopen(url).read().decode("utf-8")
print(content[2500:5000])
