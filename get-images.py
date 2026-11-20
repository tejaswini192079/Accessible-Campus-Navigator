#!/usr/bin/env python3
"""
Downloads the realistic photos used by the Accessible Campus Navigator site
into an "images" folder next to index-v3.html, so the site works offline
and never depends on an outside server.

Run (needs internet, Python 3):
    python get-images.py
Photos are free to use from Pexels (https://www.pexels.com).
"""
import os
import urllib.request

PHOTOS = {
    "wheel":   6194683,   # woman in a wheelchair
    "wheel2":  8524602,   # young woman in a wheelchair
    "cane":    8327658,   # person holding a white cane
    "cane2":   8327773,   # person holding a walking stick
    "campus":  7972518,   # friends walking inside a campus
    "campus2": 7972512,   # students walking in a campus
    "library": 33892136,  # modern library with students
    "lift":    3861787,   # person pressing a lift button
    "phone":   7362886,   # person checking GPS on a phone
    "phone2":  30403062,  # hand holding a phone with map
    "ramp":    26651561,  # accessibility ramp
}

folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), "images")
os.makedirs(folder, exist_ok=True)

ok = 0
for name, pid in PHOTOS.items():
    url = f"https://images.pexels.com/photos/{pid}/pexels-photo-{pid}.jpeg?auto=compress&cs=tinysrgb&w=1200"
    path = os.path.join(folder, name + ".jpg")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=30) as r, open(path, "wb") as f:
            f.write(r.read())
        print("downloaded", name + ".jpg")
        ok += 1
    except Exception as e:
        print("FAILED   ", name + ".jpg", "-", e)

print(f"\nDone: {ok}/{len(PHOTOS)} photos saved in {folder}")
print("Now upload the 'images' folder together with the website files.")
