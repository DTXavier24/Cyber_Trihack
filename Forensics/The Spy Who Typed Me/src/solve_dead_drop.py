#!/usr/bin/env python3
import struct
import os

HID_KEYCODES = {
    0x04: ('a', 'A'), 0x05: ('b', 'B'), 0x06: ('c', 'C'), 0x07: ('d', 'D'),
    0x08: ('e', 'E'), 0x09: ('f', 'F'), 0x0A: ('g', 'G'), 0x0B: ('h', 'H'),
    0x0C: ('i', 'I'), 0x0D: ('j', 'J'), 0x0E: ('k', 'K'), 0x0F: ('l', 'L'),
    0x10: ('m', 'M'), 0x11: ('n', 'N'), 0x12: ('o', 'O'), 0x13: ('p', 'P'),
    0x14: ('q', 'Q'), 0x15: ('r', 'R'), 0x16: ('s', 'S'), 0x17: ('t', 'T'),
    0x18: ('u', 'U'), 0x19: ('v', 'V'), 0x1a: ('w', 'W'), 0x1b: ('x', 'X'),
    0x1c: ('y', 'Y'), 0x1d: ('z', 'Z'),
    0x1e: ('1', '!'), 0x1f: ('2', '@'), 0x20: ('3', '#'), 0x21: ('4', '$'),
    0x22: ('5', '%'), 0x23: ('6', '^'), 0x24: ('7', '&'), 0x25: ('8', '*'),
    0x26: ('9', '('), 0x27: ('0', ')'),
    0x2d: ('-', '_'), 0x2e: ('=', '+'), 0x2f: ('[', '{'),
    0x30: (']', '}'), 0x31: ('\\', '|'), 0x33: (';', ':'),
    0x34: ("'", '"'), 0x35: ('`', '~'), 0x36: (',', '<'),
    0x37: ('.', '>'), 0x38: ('/', '?'), 0x2c: (' ', ' '),
}

def verify_challenge():
    # Automatically check local folder or adjacent player folder for the pcap
    possible_paths = ['dead_drop.pcap', 'player/dead_drop.pcap', '../player/dead_drop.pcap']
    pcap_path = None
    
    for path in possible_paths:
        if os.path.exists(path):
            pcap_path = path
            break
            
    if not pcap_path:
        print("[-] Error: 'dead_drop.pcap' payload target could not be found in any workspace directory.")
        return

    with open(pcap_path, 'rb') as f:
        data = f.read()

    idx = 24  # Skip the global PCAP header
    flag_output = ""
    
    while idx < len(data):
        if idx + 16 > len(data): 
            break
        
        # Read PCAP packet record header (16 bytes)
        _, _, incl_len, _ = struct.unpack('<IIII', data[idx:idx+16])
        idx += 16
        
        packet_data = data[idx:idx+incl_len]
        idx += incl_len
        
        # Dynamically extract the final 8 bytes of the packet data array
        if len(packet_data) >= 8:
            hid_payload = packet_data[-8:]  # Grabs the actual 8-byte HID report from the trailing edge
            modifier = hid_payload[0]
            keycode = hid_payload[2]
            
            if keycode != 0 and keycode in HID_KEYCODES:
                normal, shifted = HID_KEYCODES[keycode]
                flag_output += shifted if (modifier & 0x02) else normal

    print("[★] Reconstructed Output Validation Check:")
    if flag_output:
        print(f"\n{flag_output}\n")
    else:
        print("\n[-] Captured streams parsed, but no typed keyboard sequences were detected.")

if __name__ == '__main__':
    verify_challenge()