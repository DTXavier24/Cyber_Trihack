#!/usr/bin/env python3
import base64
import webbrowser
from threading import Timer
from flask import Flask, render_template_string, request, make_response

app = Flask(__name__)

FLAG = "TriHack26{4l0h0m0r4_byp455_5ucc355}"
DEFAULT_COOKIE = base64.b64encode(b"role=student").decode('utf-8')

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hogwarts Library Portal</title>
    <style>
        body { font-family: 'Georgia', serif; background-color: #121212; color: #e0e0e0; text-align: center; padding: 50px; }
        .container { background-color: #1e1e1e; padding: 30px; border-radius: 10px; display: inline-block; border: 1px solid #333; max-width: 600px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
        h1 { color: #d4af37; margin-bottom: 5px; }
        p.subtitle { font-style: italic; color: #aaa; margin-top: 0; }
        .status { margin: 25px 0; padding: 20px; border-radius: 6px; }
        .denied { background-color: #3b1313; color: #ff8888; border: 1px solid #721c24; }
        .granted { background-color: #133b19; color: #88ff9e; border: 1px solid #1e7e34; }
        .flag { font-family: monospace; font-size: 1.25em; color: #ffeb3b; background: #000; padding: 12px; border-radius: 5px; margin-top: 15px; border: 1px dashed #d4af37; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏰 Hogwarts Library Portal</h1>
        <p class="subtitle">Restricted Section Access Gateway</p>
        <hr style="border-color: #333;">
        
        {% if is_headmaster %}
            <div class="status granted">
                <h3>[✓] Welcome, Headmaster!</h3>
                <p>Identity verification successful. Archival access granted.</p>
                <div class="flag">{{ flag }}</div>
            </div>
        {% else %}
            <div class="status denied">
                <h3>[✗] Access Denied</h3>
                <p>Current Role: <b>Student</b></p>
                <p>Only the Headmaster is authorized to view the Restricted Section.</p>
            </div>
        {% endif %}
    </div>
</body>
</html>
"""

@app.route('/')
def index():
    session_cookie = request.cookies.get('session')
    
    # If no cookie exists, assign default base64 role=student
    if not session_cookie:
        resp = make_response(render_template_string(HTML_TEMPLATE, is_headmaster=False))
        resp.set_cookie('session', DEFAULT_COOKIE)
        return resp
    
    # Evaluate cookie contents after decoding
    try:
        decoded_bytes = base64.b64decode(session_cookie)
        decoded_str = decoded_bytes.decode('utf-8', errors='ignore')
        
        if "role=headmaster" in decoded_str.lower():
            return render_template_string(HTML_TEMPLATE, is_headmaster=True, flag=FLAG)
    except Exception:
        pass
        
    return render_template_string(HTML_TEMPLATE, is_headmaster=False)

def open_browser():
    webbrowser.open_new('http://127.0.0.1:5000/')

if __name__ == '__main__':
    print("==================================================================")
    print(" 🏰 Hogwarts Library Portal local server starting...")
    print(" Opening browser at http://127.0.0.1:5000")
    print(" Press Ctrl+C in this terminal to stop the portal.")
    print("==================================================================")
    Timer(1, open_browser).start()
    app.run(host='127.0.0.1', port=5000)