# Local Setup

To run the challenge container locally with the exact production environment:

```bash
docker compose up --build
```

You can then interact with the local instance via: nc localhost 5000

⚠️ CRITICAL NOTE FOR APPLE SILICON (M1/M2/M3/M4) USERS

If you are running this Docker container on an ARM64 host, the default QEMU emulator will likely crash with a SIGSEGV even if your exploit is perfect.

To fix this on macOS:
1. Open Docker Desktop.
2. Go to Settings -> General (or "Features in development" depending on your Docker version).
3. Check the box for: "Use Rosetta for x86/amd64 emulation on Apple Silicon".
4. Apply & Restart Docker.

If you are on an ARM Linux/Windows machine and experience random crashes inside the VM, please test your exploit directly against the remote production server, or spin up an x86_64 cloud instance.
