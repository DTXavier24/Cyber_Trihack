# Ghost Package — Challenge Walkthrough

This document contains the official step-by-step solution to solve the **Ghost Package** CTF challenge.

---

## Challenge Summary
* **Name:** Ghost Package
* **Difficulty:** Hard

---

## Solution Steps

| Step | Action | Tools & Methods |
| :---: | :--- | :--- |
| **1** | Check the file header to discover it is actually a PNG. | `file` utility, Python `open()`, or a Hex Editor |
| **2** | Rename the extension from `.bin` to `.png` to view the image. | Basic OS file renaming |
| **3** | Extract LSB stego from the blue channel and identify the decoy. | Python (PIL/Pillow library) |
| **4** | Scan the file's raw bytes for custom PNG chunks to find `neTk`. | Python `struct` module / custom parser |
| **5** | Extract the data stored inside the `neTk` chunks (Hint + Payload). | Python file reading |
| **6** | Reverse the encoding layers: **Hex → Base64 → ROT13** to get the flag. | Python script or CyberChef |
| **7** | Submit the recovered flag to the scoring platform. | CTF Dashboard |

---
