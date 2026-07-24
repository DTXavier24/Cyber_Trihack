#!/usr/bin/env python3
"""
Last Transmission — SSTV Audio Challenge Builder
Generates a WAV file containing an SSTV-encoded image with the flag.
"""

import os
import random
import sys
from PIL import Image, ImageDraw, ImageFont

# Install pysstv if not available
try:
    from pysstv.color import MartinM1
except ImportError:
    print("[!] pysstv not installed. Installing...")
    os.system(f"{sys.executable} -m pip install pysstv")
    from pysstv.color import MartinM1

# ============================================================
# CONFIG
# ============================================================
FLAG = "TriHack26{sstv_1s_n0t_d34d_y3t}"
# ============================================================


def create_sstv_image(image_path, flag_text):
    """Create a 320x256 space-themed image containing the flag."""
    img = Image.new("RGB", (320, 256), color=(0, 5, 20))
    draw = ImageDraw.Draw(img)

    # Starfield background
    random.seed(42)
    for _ in range(300):
        x = random.randint(0, 319)
        y = random.randint(0, 255)
        brightness = random.randint(100, 255)
        draw.point((x, y), fill=(brightness, brightness, brightness))

    # Draw planet & satellite graphics
    draw.ellipse([(80, 60), (220, 200)], fill=(30, 60, 120), outline=(60, 120, 220))
    draw.rectangle([(240, 50), (260, 80)], fill=(200, 200, 200))
    draw.polygon([(250, 50), (240, 30), (260, 30)], fill=(150, 150, 150))
    draw.rectangle([(235, 70), (240, 95)], fill=(100, 100, 100))
    draw.rectangle([(260, 70), (265, 95)], fill=(100, 100, 100))

    # Load default font
    font = ImageFont.load_default()

    # Draw telemetry & challenge metadata
    draw.text((10, 10), "SSTV: MARTIN M1", fill=(160, 160, 160), font=font)
    draw.text((10, 25), "FREQ: 145.800 MHz", fill=(120, 120, 120), font=font)
    draw.text((200, 240), "CHROMECORP", fill=(80, 80, 100), font=font)

    # Prominent flag display
    draw.text((20, 200), "SIGNAL DECODED:", fill=(0, 255, 200), font=font)
    draw.text((20, 218), flag_text, fill=(0, 255, 200), font=font)

    img.save(image_path)
    print(f"[+] SSTV source image created: {image_path}")
    return img


def build():
    """Build the SSTV audio challenge."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)

    player_dir = os.path.join(project_root, "player")
    org_dir = os.path.join(project_root, "org")

    os.makedirs(player_dir, exist_ok=True)
    os.makedirs(org_dir, exist_ok=True)

    print("=" * 60)
    print("Last Transmission — Challenge Builder")
    print("=" * 60)
    print(f"[*] Flag: {FLAG}")

    # Step 1: Generate source image
    img_path = os.path.join(org_dir, "sstv_source.png")
    img = create_sstv_image(img_path, FLAG)

    # Step 2: Encode to SSTV WAV Audio
    print("\n[1/2] Encoding image to SSTV audio (Martin M1)...")
    wav_path = os.path.join(player_dir, "last_transmission.wav")

    sstv = MartinM1(img, 44100, 16)
    sstv.write_wav(wav_path)

    file_size = os.path.getsize(wav_path)
    print(f"[2/2] SSTV audio generated: {wav_path}")
    print(f"[+] File size: {file_size} bytes ({file_size / 1024:.1f} KB)")

    print(f"\n{'=' * 60}")
    print(f"[+] SUCCESS: Generated player file -> player/last_transmission.wav")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    build()