#!/usr/bin/env python3
"""
Microfilm — Solver / Verification
Subtracts two images to reveal the hidden flag.
"""

from PIL import Image
import os

def solve():
    print("=" * 60)
    print("Microfilm — Solver")
    print("=" * 60)
    
    paths = [
        ('../player/cover_photo.jpg', '../player/recovered_film.jpg'),
        ('player/cover_photo.jpg', 'player/recovered_film.jpg'),
        ('cover_photo.jpg', 'recovered_film.jpg'),
    ]
    
    cover_path = None
    recovered_path = None
    for c, r in paths:
        if os.path.exists(c) and os.path.exists(r):
            cover_path, recovered_path = c, r
            break
            
    if not cover_path:
        print("[-] Could not find image files. Run build_microfilm.py first.")
        return
        
    print(f"[+] Cover: {cover_path}")
    print(f"[+] Recovered: {recovered_path}")
    
    cover = Image.open(cover_path)
    recovered = Image.open(recovered_path)
    
    print(f"[+] Image size: {cover.size}")
    
    cover_pixels = list(cover.getdata())
    recovered_pixels = list(recovered.getdata())
    
    diff_pixels = []
    for p1, p2 in zip(cover_pixels, recovered_pixels):
        r_diff = abs(p2[0] - p1[0]) * 30
        g_diff = abs(p2[1] - p1[1]) * 30
        b_diff = abs(p2[2] - p1[2]) * 30
        diff_pixels.append((
            min(255, r_diff),
            min(255, g_diff),
            min(255, b_diff)
        ))
        
    diff_img = Image.new('RGB', cover.size)
    diff_img.putdata(diff_pixels)
    diff_img.save('difference_result.png')
    print(f"[+] Difference image saved: difference_result.png")
    
    enhanced = diff_img.point(lambda x: 0 if x < 50 else 255)
    enhanced.save('difference_enhanced.png')
    print(f"[+] Enhanced version saved: difference_enhanced.png")
    
    print(f"\n{'=' * 60}")
    print(f"[*] The flag is visible as text in the difference image.")
    print(f"[*] Target Flag: TriHack26{{m1cr0d0ts_4r3_0ld_sk00l}}")
    print(f"{'=' * 60}")

if __name__ == '__main__':
    solve()