#!/usr/bin/env python3
"""
Build Script for Hogwarts Library Portal
Compiles org/app.py into player/Hogwarts_Library_Portal.exe
"""
import os
import subprocess
import sys

def build():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    app_script = os.path.join(script_dir, "app.py")
    player_dir = os.path.join(project_root, "player")

    os.makedirs(player_dir, exist_ok=True)

    print("[*] Building standalone executable via PyInstaller...")
    
    cmd = [
        sys.executable, "-m", "PyInstaller",
        "--onefile",
        "--name", "Hogwarts_Library_Portal",
        "--distpath", player_dir,
        "--workpath", os.path.join(script_dir, "build"),
        "--specpath", script_dir,
        app_script
    ]

    try:
        subprocess.run(cmd, check=True)
        print(f"\n[✓] SUCCESS: Executable generated in -> {player_dir}\\Hogwarts_Library_Portal.exe")
    except subprocess.CalledProcessError as e:
        print(f"\n[-] ERROR: Build failed. Make sure PyInstaller is installed (`pip install pyinstaller`).")

if __name__ == "__main__":
    build()