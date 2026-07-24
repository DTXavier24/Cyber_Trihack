#!/usr/bin/env python3
"""
The Spy Who Typed Me — USB Keystroke Challenge Builder
Generates a true native Linux mmapped USB pcap file.
"""
import struct
import os

# ============================================================
# CONFIG — Target Submission Flag
# ============================================================
FLAG = "TriHack26{d3ad_dr0p_c0mpr0m1s3d}"

# USB HID keycode mapping (byte 2 of the 8-byte HID data report)
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
    0x28: ('\n', '\n'),  
    0x2d: ('-', '_'), 0x2e: ('=', '+'), 0x2f: ('[', '{'),
    0x30: (']', '}'), 0x31: ('\\', '|'), 0x33: (';', ':'),
    0x34: ("'", '"'), 0x35: ('`', '~'), 0x36: (',', '<'),
    0x37: ('.', '>'), 0x38: ('/', '?'), 0x2c: (' ', ' '),
}

CHAR_TO_HID = {}
for code, (normal, shifted) in HID_KEYCODES.items():
    if normal not in CHAR_TO_HID and len(normal) == 1:
        CHAR_TO_HID[normal] = (code, 0x00)
    if shifted not in CHAR_TO_HID and len(shifted) == 1:
        CHAR_TO_HID[shifted] = (code, 0x02)

def text_to_hid_reports(text):
    reports = []
    for char in text:
        if char in CHAR_TO_HID:
            keycode, modifier = CHAR_TO_HID[char]
            # KEY DOWN State
            reports.append(struct.pack('BBBBBBBB', modifier, 0x00, keycode, 0x00, 0x00, 0x00, 0x00, 0x00))
            # KEY UP State
            reports.append(struct.pack('BBBBBBBB', 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00))
    return reports

def generate_pcap(output_path, reports):
    # Global header (Linktype 220 specifies LINKTYPE_USB_LINUX_MMAPPED data tracking)
    pcap_header = struct.pack('<IHHiIII', 0xa1b2c3d4, 2, 4, 0, 0, 65535, 220)
    
    packets = []
    timestamp = 1468840000.0  # Epoch anchor reference
    
    for report in reports:
        # Linux USB URB Header initialization matrix (64 bytes total block)
        urb_header = struct.pack('<QBBHHQIHHIIII',
            0xffff88007aac1000, # Mock URB Address handle
            0x53,               # Event tag ('S' = Submit)
            0x01,               # Transfer mode (0x01 = Interrupt Endpoint)
            0x01,               # Endpoint Identifier
            0x01,               # Hardware Device Target
            0x0001,             # Internal Bus Number Allocation
            0x20,               # Setup indicator tag
            0x00,               # Data present flag (0 = capture includes payload)
            0, 0,               # Subsecond adjustments
            0,                  # Transfer return status
            len(report),        # Total URB Frame Size
            len(report)         # Effective Payload Length
        ) + b'\x00' * 28       # Standard padding buffer to align structure
        
        packet = urb_header + report
        ts_sec = int(timestamp)
        ts_usec = int((timestamp - ts_sec) * 1000000)
        pcap_rec = struct.pack('<IIII', ts_sec, ts_usec, len(packet), len(packet))
        
        packets.append(pcap_rec + packet)
        timestamp += 0.04       # Human typing delay offset simulation (40ms)

    with open(output_path, 'wb') as f:
        f.write(pcap_header)
        for p in packets:
            f.write(p)
    print(f"[✓] File successfully exported to: {output_path}")

if __name__ == '__main__':
    output_dir = '../player'
    os.makedirs(output_dir, exist_ok=True)
    # Adding a realistic spy credential prompt string before typing out the flag
    all_reports = text_to_hid_reports("AGENT_KEY:") + text_to_hid_reports(FLAG)
    generate_pcap(os.path.join(output_dir, 'dead_drop.pcap'), all_reports)