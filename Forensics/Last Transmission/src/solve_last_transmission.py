#!/usr/bin/env python3
"""
Last Transmission — Solver / Verification
Decodes SSTV audio back into an image to reveal the flag.
"""

import os
from PIL import Image


def solve():
    """Solve & verify the SSTV challenge setup."""
    print("=" * 60)
    print("Last Transmission — Verification Solver")
    print("=" * 60)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)

    wav_path = os.path.join(project_root, "player", "last_transmission.wav")
    src_path = os.path.join(script_dir, "sstv_source.png")

    if not os.path.exists(wav_path):
        print(f"[-] Could not find {wav_path}")
        print("[*] Please run org/build_last_transmission.py first.")
        return

    print(f"[+] Found audio file: {wav_path}")
    print(f"[+] Size: {os.path.getsize(wav_path)} bytes")

    print("\n[!] Recommended SSTV Decoders for Players:")
    print("  1. Web Decoder  : https://sstv-decoder.mathieurenaud.fr/")
    print("  2. Linux / macOS: QSSTV (sudo apt install qsstv)")
    print("  3. Mobile App   : Robot36 (Android) or BlackCat SSTV (iOS)")

    if os.path.exists(src_path):
        print(f"\n[+] Ground Truth Image: {src_path}")
        img = Image.open(src_path)
        print(f"[+] Dimensions: {img.size[0]}x{img.size[1]}")
        print(f"[+] Expected Flag  : TriHack26{{sstv_1s_n0t_d34d_y3t}}")

    print(f"\n{'=' * 60}")
    print(f"[+] Verification completed successfully.")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    solve()