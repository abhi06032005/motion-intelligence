"""Check availability of original UI-PRMD website and mirrors."""

import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

URLS = [
    "https://www.webpages.uidaho.edu/ui-prmd/",
    "http://www.webpages.uidaho.edu/ui-prmd/",
    "https://webpages.uidaho.edu/ui-prmd/download.html",
    "https://github.com/tejas1904/UI-PRMD-Visualize-python-port",
]

for url in URLS:
    print(f"Checking {url}...")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, context=ctx, timeout=10) as resp:
            print(f"  Status: {resp.status}, Content-Length: {resp.headers.get('Content-Length')}, Final URL: {resp.url}")
            body = resp.read(1000).decode('utf-8', errors='ignore')
            print(f"  Preview: {body[:300].strip()}\n")
    except Exception as e:
        print(f"  Failed: {e}\n")
