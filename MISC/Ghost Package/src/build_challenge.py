import base64
import os
import struct
import zlib
from PIL import Image, ImageDraw

# ============================================================
# CONFIGURATION — CHANGE THIS TO YOUR ACTUAL FLAG
# ============================================================
FLAG = "TriHack26{n31r4l_d4nc3_0v3rl04d}"
# ============================================================

print("=" * 60)
print("Ghost Package — Challenge Builder (Optimized)")
print("=" * 60)

# ---- Step 1: ROT13 the flag ----
rot13_flag = ""
for c in FLAG:
    if 'a' <= c <= 'z':
        rot13_flag += chr((ord(c) - ord('a') + 13) % 26 + ord('a'))
    elif 'A' <= c <= 'Z':
        rot13_flag += chr((ord(c) - ord('A') + 13) % 26 + ord('A'))
    else:
        rot13_flag += c
print(f"[1/4] ROT13: {rot13_flag}")

# ---- Step 2: Base64 encode ----
b64_bytes = base64.b64encode(rot13_flag.encode('ascii'))
b64_string = b64_bytes.decode('ascii')
print(f"[2/4] Base64: {b64_string}")

# ---- Step 3: Convert to hex ----
hex_payload = b64_bytes.hex()
print(f"[3/4] Hex payload: {hex_payload}")

# The Cyberpunk Decoupled Hint
hint_text = "[SYS_ALRT]: DECRYPTION REQ: ROT13 -> BASE64 -> HEX"
hint_bytes = hint_text.encode('ascii')

# ---- Step 4: Create the base image ----
print("\n[4/4] Creating cyberpunk image...")
img = Image.new('RGB', (800, 600), color=(10, 8, 20))
draw = ImageDraw.Draw(img)

# Grid lines
for x in range(0, 800, 50):
    draw.line([(x, 0), (x, 600)], fill=(20, 15, 40), width=1)
for y in range(0, 600, 50):
    draw.line([(0, y), (800, y)], fill=(20, 15, 40), width=1)

# Neon buildings
draw.rectangle([(50, 200), (180, 500)], fill=(15, 5, 30), outline=(255, 0, 100))
draw.rectangle([(200, 150), (350, 500)], fill=(10, 10, 35), outline=(0, 255, 200))
draw.rectangle([(370, 100), (520, 500)], fill=(20, 5, 25), outline=(255, 50, 50))
draw.rectangle([(540, 250), (700, 500)], fill=(5, 15, 40), outline=(100, 0, 255))
draw.rectangle([(720, 180), (790, 500)], fill=(15, 10, 20), outline=(255, 200, 0))

# Text
draw.text((300, 30), "NEUROLINK v3", fill=(0, 255, 200))
draw.text((150, 560), "CHROMECORP // SECURE // CONNECTED", fill=(100, 50, 150))

# Save the base PNG temporarily
temp_file = 'temp_base.png'
img.save(temp_file, 'PNG')

# ---- Step 5: Byte Manipulation for Custom Chunks ----
print("\n[5/5] Injecting custom 'neTk' chunks with valid CRCs...")

def create_png_chunk(chunk_type: bytes, chunk_data: bytes) -> bytes:
    """Helper to build a proper PNG chunk structure."""
    length = struct.pack(">I", len(chunk_data))
    chunk_type_and_data = chunk_type + chunk_data
    crc = struct.pack(">I", zlib.crc32(chunk_type_and_data))
    return length + chunk_type_and_data + crc

# Load the base file bytes
with open(temp_file, 'rb') as f:
    png_bytes = f.read()

# Locate standard PNG structures to split cleanly
iend_index = png_bytes.find(b'IEND')
if iend_index == -1:
    raise Exception("Corrupt PNG file generation.")

# Locate IDAT chunk index to place hint before, and payload after
idat_index = png_bytes.find(b'IDAT')

# Construct the custom chunks
hint_chunk = create_png_chunk(b'neTk', hint_bytes)
payload_chunk = create_png_chunk(b'neTk', bytes.fromhex(hex_payload))

# Split and insert
# Part 1: Header to IDAT
part_1 = png_bytes[:idat_index - 4] # Keep the length field of IDAT intact
# Part 2: IDAT to IEND
part_2 = png_bytes[idat_index - 4: iend_index - 4]
# Part 3: IEND chunk itself
part_3 = png_bytes[iend_index - 4:]

# Assemble custom binary file
final_png_bytes = part_1 + hint_chunk + part_2 + payload_chunk + part_3

# Clean up temp file
os.remove(temp_file)

# Save final bin file
output_file = 'ghost_package.bin'
with open(output_file, 'wb') as f:
    f.write(final_png_bytes)

print(f"\n{'=' * 60}")
print(f"[✓] File created successfully: {output_file}")
print(f"[✓] File Size: {len(final_png_bytes)} bytes")
print(f"[✓] Custom chunks injected with standard CRCs!")
print(f"{'=' * 60}")