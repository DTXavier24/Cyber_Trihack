# Solution — Last Transmission

## 1. Challenge Overview
* **Category:** Forensics / Audio
* **Difficulty:** Medium
* **Artifacts Provided:** `last_transmission.wav`
* **Flag:** `TriHack26{sstv_1s_n0t_d34d_y3t}`

---

## 2. Analysis & Identification

1. **Acoustic / Spectrogram Analysis:**
   Opening `last_transmission.wav` in an audio editor like Audacity or viewing its spectrogram reveals structured, repeating line-by-line audio tones and sync pulses typical of an analog image transmission.

2. **Protocol Identification:**
   The distinctive screeching audio pattern corresponds to **SSTV (Slow Scan Television)**, specifically encoded using the **Martin M1** transmission mode on a 145.800 MHz amateur radio band simulation.

---

## 3. Step-by-Step Resolution

### Method 1: Online Decoder (Easiest)
1. Go to an online SSTV decoder (e.g., [https://sstv-decoder.mathieurenaud.fr/](https://sstv-decoder.mathieurenaud.fr/)).
2. Upload `last_transmission.wav`.
3. Set the mode to **Auto-detect** (or manually select **Martin 1**) and click **Decode**.
4. The decoded image will display space graphics with the flag clearly visible at the bottom.

### Method 2: Command Line / Python Script (`pysstv`)
Alternatively, decode or verify using Python audio processing tools or run `org/solve_last_transmission.py`:

```bash
python3 org/solve_last_transmission.py