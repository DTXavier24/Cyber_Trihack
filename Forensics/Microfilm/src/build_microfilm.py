#!/usr/bin/env python3
"""
Microfilm — Image Difference Challenge Builder
Creates two near-identical images where the flag is invisible to the naked eye
on recovered_film.jpg, but pops out clearly upon image subtraction.
"""

from PIL import Image, ImageDraw, ImageFont
import os
import random

FLAG = "TriHack26{m1cr0d0ts_4r3_0ld_sk00l}"

def create_microfilm_challenge():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    player_dir = os.path.join(project_root, 'player')
    org_dir = os.path.join(project_root, 'org')
    
    os.makedirs(player_dir, exist_ok=True)
    os.makedirs(org_dir, exist_ok=True)
    
    print("=" * 60)
    print("Microfilm — Challenge Builder")
    print("=" * 60)
    print(f"[*] Flag: {FLAG}")
    
    # Try to load a truetype font, fallback to default
    try:
        font = ImageFont.truetype("arial.ttf", 22)
    except IOError:
        font = ImageFont.load_default()

    bg_color = (245, 240, 230)

    lines = [
        "  CONFIDENTIAL — EYES ONLY",
        "",
        "  From: Station Chief, Vienna",
        "  To: Deputy Director, Operations",
        "  Subject: Asset Recruitment",
        "",
        "  The operation in Sector 7 has been compromised.",
        "  Asset code-name 'Nightingale' is requesting",
        "  immediate extraction. We recommend denying",
        "  until the investigation is complete.",
        "",
        "  Surveillance teams report unusual activity",
        "  near the designated dead drop location.",
        "  Possible KGB counter-intelligence operation.",
        "",
        "  Awaiting further instructions.",
        "",
        "  — END OF REPORT —",
    ]

    # --- 1. COVER PHOTO ---
    img = Image.new('RGB', (800, 600), color=bg_color)
    draw = ImageDraw.Draw(img)
    
    y = 30
    for line in lines:
        draw.text((40, y), line, fill=(30, 30, 30))
        y += 24
        
    random.seed(12345)
    pixels = list(img.convert('RGB').getdata())
    noisy_pixels = []
    for r, g, b in pixels:
        noise = random.randint(-2, 2)
        noisy_pixels.append((
            max(0, min(255, r + noise)),
            max(0, min(255, g + noise)),
            max(0, min(255, b + noise))
        ))
    img.putdata(noisy_pixels)
    
    cover_path = os.path.join(player_dir, 'cover_photo.jpg')
    img.save(cover_path, 'JPEG', quality=98)
    print(f"[+] Cover image generated: {cover_path}")
    
    # --- 2. RECOVERED FILM (Invisible Flag) ---
    img2 = Image.new('RGB', (800, 600), color=bg_color)
    draw2 = ImageDraw.Draw(img2)
    
    y = 30
    for line in lines:
        draw2.text((40, y), line, fill=(30, 30, 30))
        y += 24
        
    # Microscopic RGB shift: (242, 237, 227) vs background (245, 240, 230)
    # Delta = 3 units per channel (100% invisible to human eyes)
    faint_flag_color = (242, 237, 227)
    draw2.text((40, 480), f"FLAG: {FLAG}", fill=faint_flag_color, font=font)
    
    random.seed(12345)
    pixels2 = list(img2.convert('RGB').getdata())
    noisy_pixels2 = []
    for r, g, b in pixels2:
        noise = random.randint(-2, 2)
        noisy_pixels2.append((
            max(0, min(255, r + noise)),
            max(0, min(255, g + noise)),
            max(0, min(255, b + noise))
        ))
    img2.putdata(noisy_pixels2)
    
    recovered_path = os.path.join(player_dir, 'recovered_film.jpg')
    img2.save(recovered_path, 'JPEG', quality=98)
    print(f"[+] Recovered film generated: {recovered_path}")
    
    print(f"\n{'=' * 60}")
    print(f"[✓] SUCCESS: Rebuilt images with stealth text in: {player_dir}")
    print(f"{'=' * 60}")

if __name__ == '__main__':
    create_microfilm_challenge()