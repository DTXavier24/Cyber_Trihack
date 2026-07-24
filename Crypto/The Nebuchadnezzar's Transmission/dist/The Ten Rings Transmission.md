**Title:** The Ten Rings Transmission
**Category:** Cryptography
**Difficulty:** Hard

**Description:**
> We intercepted a secured communications channel used by the Ten Rings. They are not using standard AES or RSA; they have developed their own custom byte-level encryption algorithm.
> 
> Luckily, our operatives managed to capture a test transmission where both the plaintext and the resulting ciphertext were logged. 
> 
> **Captured Test Transmission:**
> *   **Sample Plaintext:** `STARK_WEAPONS_MANIFEST`
> *   **Sample Ciphertext:** `3934473a513d354347384d4e393d4b474e4f46433934`
> 
> **The Target:**
> Moments later, they transmitted a high-priority encrypted payload. We need you to analyze the test transmission, reverse-engineer their custom encryption algorithm, and decrypt the target payload.
> 
> *   **Target Ciphertext:** `345a6f506769719a9661716e98556e3d586c94976e549960543d5a9956995a5999645b`
> 
> **Flag Format:** `TriHack26{...}`