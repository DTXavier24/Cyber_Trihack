import struct
import base64

print("=" * 60)
print("Ghost Package — Automated Exploit & Solution")
print("=" * 60)

with open('ghost_package.bin', 'rb') as f:
    data = f.read()

# Verify file starts with PNG magic bytes (allowing for .bin rename)
if data[:4] == b'\x89PNG':
    print("[+] File starts with PNG magic bytes. Moving to chunk extraction.")
else:
    print("[-] Error: Invalid file format.")
    exit()

idx = 8  # Skip PNG header
chunks_found = []

# Parse chunks cleanly
while idx < len(data):
    if idx + 8 > len(data):
        break
    length = struct.unpack('>I', data[idx:idx+4])[0]
    chunk_type = data[idx+4:idx+8]
    
    if idx + 8 + length > len(data):
        break
    
    chunk_data = data[idx+8:idx+8+length]
    chunks_found.append((chunk_type, chunk_data))
    
    idx += 12 + length

# Decouple and print target chunks
hint_str = ""
payload_str = ""

for c_type, c_data in chunks_found:
    if c_type == b'neTk':
        try:
            decoded_try = c_data.decode('ascii', errors='ignore')
            if "[SYS_ALRT]" in decoded_try:
                hint_str = decoded_try
                print(f"[!] Extracted Hint Chunk: {hint_str}")
            else:
                payload_str = c_data.hex()
                print(f"[!] Extracted Payload Chunk (Hex format): {payload_str[:40]}...")
        except Exception:
            pass

# Process payloads based on hint instructions
if payload_str:
    print("\n[+] Reversing Cipher Sequence (HEX -> B64 -> ROT13):")
    # Step 1: Hex Decode
    raw_payload = bytes.fromhex(payload_str).decode('ascii')
    print(f"    [Step 1 - Hex Decoded]: {raw_payload}")
    
    # Step 2: Base64 Decode
    b64_decoded = base64.b64decode(raw_payload).decode('ascii')
    print(f"    [Step 2 - Base64 Decoded]: {b64_decoded}")
    
    # Step 3: ROT13 Decryption
    final_flag = ""
    for c in b64_decoded:
        if 'a' <= c <= 'z':
            final_flag += chr((ord(c) - ord('a') + 13) % 26 + ord('a'))
        elif 'A' <= c <= 'Z':
            final_flag += chr((ord(c) - ord('A') + 13) % 26 + ord('A'))
        else:
            final_flag += c
            
    print(f"\n[★] SYSTEM BACKDOOR KEY FOUND: {final_flag}\n")
else:
    print("[-] Custom payload chunk 'neTk' not successfully parsed.")