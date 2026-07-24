#!/usr/bin/env python3
"""
The Midnight Artifacts — Solution Script
Converts the target Epoch timestamp to local time, parses latest.log, and reconstructs the flag.
"""

import os
import re
from datetime import datetime, timezone

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
LOG_PATH = os.path.join(PROJECT_ROOT, "player", "latest.log")

TARGET_EPOCH = 1787019295  # 2026-07-18 02:14:55 UTC


def solve():
    if not os.path.exists(LOG_PATH):
        print(f"[!] Log file not found at {LOG_PATH}. Run logs.py first.")
        return

    # 1. Convert Epoch timestamp to target log time string (HH:MM:SS)
    target_dt = datetime.fromtimestamp(TARGET_EPOCH, tz=timezone.utc)
    time_str = target_dt.strftime("%H:%M:%S")
    print(f"[1] Translated Epoch {TARGET_EPOCH} -> Target Time: {time_str}")

    # 2. Search log file for warning records around target time
    part1, part2 = "", ""
    pattern = re.compile(r"injection point (\d): (TriHack26\{.*|\w+\})")

    with open(LOG_PATH, "r", encoding="utf-8") as f:
        for line in f:
            if time_str[:5] in line:  # Match hour:minute (02:14)
                match = pattern.search(line)
                if match:
                    point, content = match.groups()
                    if point == "1":
                        part1 = content
                    elif point == "2":
                        part2 = content

    flag = part1 + part2
    print(f"[2] Extracted Fragments: '{part1}' + '{part2}'")
    print(f"[3] Reconstructed Flag: {flag}")

    assert flag == "TriHack26{t1m3_st0mp_l0g5}", f"Unexpected flag: {flag}"
    print("\n[✔] Midnight Artifacts solved successfully!")


if __name__ == "__main__":
    solve()