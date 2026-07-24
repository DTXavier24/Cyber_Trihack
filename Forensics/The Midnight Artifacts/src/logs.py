import os
import random
from datetime import datetime, timedelta

FLAG_PART1 = "TriHack26{t1m3_"
FLAG_PART2 = "st0mp_l0g5}"

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
PLAYER_DIR = os.path.join(PROJECT_ROOT, "player")

PLAYERS = ["Steve", "Alex", "Notch", "Miner49er", "DiamondGuy", "CreeperHunter", "Xiphos", "FizzaB"]

# Anchor: July 18, 2026 @ 02:14:55 AM (Epoch 1787019295 UTC)
START_TIME = datetime(2026, 7, 18, 1, 0, 0)
TARGET_TIME = datetime(2026, 7, 18, 2, 14, 55)


def log_line(timestamp, level, text):
    return f"[{timestamp.strftime('%H:%M:%S')}] [Server thread/{level}]: {text}\n"


def main():
    os.makedirs(PLAYER_DIR, exist_ok=True)
    output_filepath = os.path.join(PLAYER_DIR, "latest.log")

    with open(output_filepath, "w", encoding="utf-8") as f:
        current_time = START_TIME

        # Phase 1: Background noise logs prior to incident
        while current_time < TARGET_TIME - timedelta(seconds=10):
            current_time += timedelta(milliseconds=random.randint(500, 3000))
            p = random.choice(PLAYERS)
            noise_events = [
                f"<{p}> mined 1 block of minecraft:deepslate",
                f"<{p}> text chat: anyone trading diamonds for iron?",
                f"<{p}> has made the advancement [Acquiring Hardware]",
                f"<{p}> swam in lava to try to swim",
                f"[{p}: Set own game mode to Survival Mode]",
                f"<{p}> text chat: heading down to coordinate Y= -52"
            ]
            f.write(log_line(current_time, "INFO", random.choice(noise_events)))

        # Phase 2: Injected Payload Window (02:14:55 AM)
        current_time = TARGET_TIME
        f.write(log_line(current_time, "INFO", "Syncing ender_chest_payload data layers..."))
        f.write(log_line(current_time, "WARN", f"Sector ender_chest_payload modified injection point 1: {FLAG_PART1}"))
        f.write(log_line(current_time + timedelta(seconds=1), "WARN", f"Sector ender_chest_payload modified injection point 2: {FLAG_PART2}"))
        f.write(log_line(current_time + timedelta(seconds=3), "INFO", "Ender Chest spatial data matrix compression complete."))

        # Phase 3: Trailing post-incident logs
        current_time += timedelta(seconds=5)
        for _ in range(1500):
            current_time += timedelta(milliseconds=random.randint(500, 4000))
            p = random.choice(PLAYERS)
            post_noise = [
                f"<{p}> mined 1 block of minecraft:gold_ore",
                f"<{p}> text chat: server felt laggy for a second there",
                f"<{p}> reached experience level {random.randint(5, 15)}",
                f"<{p}> clear weather state initialized",
                f"Player {p} left the game"
            ]
            f.write(log_line(current_time, "INFO", random.choice(post_noise)))

    print(f"[+] Successfully generated log file at: {output_filepath}")


if __name__ == "__main__":
    main()