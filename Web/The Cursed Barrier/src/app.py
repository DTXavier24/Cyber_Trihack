import base64
import json
from flask import Flask, request, render_template_string, make_response
import webbrowser
from threading import Timer

app = Flask(__name__)

# Modern Jujutsu High Cyberpunk UI
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JUJUTSU HIGH // BARRIER CONTROL</title>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800;900&family=Share+Tech+Mono&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Share Tech Mono', monospace;
            background: #020105;
            color: #d8cbf5;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            position: relative;
        }

        /* ---- ambient layer: quiet, slow, stays out of the way ---- */
        .orb {
            position: fixed;
            border-radius: 50%;
            filter: blur(60px);
            opacity: 0.3;
            pointer-events: none;
            animation: drift 24s ease-in-out infinite;
        }
        .orb1 { width: 380px; height: 380px; background: #a855f7; top: -12%; left: -8%; }
        .orb2 { width: 320px; height: 320px; background: #3b82f6; bottom: -14%; right: -6%; animation-duration: 28s; animation-delay: -8s; }
        .orb3 { width: 220px; height: 220px; background: #38bdf8; top: 55%; left: 62%; animation-duration: 32s; animation-delay: -16s; }
        @keyframes drift {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(40px, -30px) scale(1.15); }
            66% { transform: translate(-30px, 25px) scale(0.9); }
        }

        .grid-overlay {
            position: fixed; inset: 0; top: 0; left: 0; right: 0; bottom: 0;
            background-image:
                linear-gradient(rgba(168,85,247,0.06) 1px, transparent 1px),
                linear-gradient(90deg, rgba(168,85,247,0.06) 1px, transparent 1px);
            background-size: 42px 42px;
            animation: gridpulse 7s ease-in-out infinite;
            pointer-events: none;
        }
        @keyframes gridpulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.85; } }

        .scanline {
            position: fixed; inset: 0; top: 0; left: 0; right: 0; bottom: 0;
            background: linear-gradient(rgba(255,255,255,0) 50%, rgba(168,85,247,0.025) 50%);
            background-size: 100% 4px;
            pointer-events: none;
        }

        /* ---- the card ---- */
        .terminal-box {
            background: rgba(15, 8, 25, 0.85);
            backdrop-filter: blur(16px);
            border: 1px solid rgba(168, 85, 247, 0.3);
            box-shadow: 0 0 35px rgba(147, 51, 234, 0.25);
            border-radius: 12px;
            padding: 40px;
            width: 420px;
            max-width: 90vw;
            text-align: center;
            position: relative;
            z-index: 10;
        }
        .terminal-box::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; height: 3px;
            background: linear-gradient(90deg, #a855f7, #3b82f6, #a855f7);
            background-size: 200% 100%;
            border-radius: 12px 12px 0 0;
            animation: shimmer 3s linear infinite;
        }
        @keyframes shimmer { to { background-position: -200% 0; } }

        /* brief boot log, pure-CSS timed crossfade into the real content -- no JS needed */
        .boot-log {
            position: absolute; inset: 0; top: 0; left: 0; right: 0; bottom: 0;
            display: flex; flex-direction: column; justify-content: center;
            padding: 40px; text-align: left; font-size: 0.76rem; color: #9d7fd6;
            background: rgba(15,8,25,0.96);
            border-radius: 12px;
            animation: bootOut 0.35s ease forwards 1.15s;
        }
        .boot-log div { opacity: 0; animation: lineIn 0.2s ease forwards; }
        .boot-log div:nth-child(1) { animation-delay: .05s; }
        .boot-log div:nth-child(2) { animation-delay: .32s; }
        .boot-log div:nth-child(3) { animation-delay: .60s; }
        .boot-log div:nth-child(4) { animation-delay: .88s; }
        @keyframes lineIn { to { opacity: 1; } }
        @keyframes bootOut { to { opacity: 0; visibility: hidden; } }

        .real-content { opacity: 0; animation: contentIn 0.4s ease forwards 1.25s; }
        @keyframes contentIn { to { opacity: 1; } }

        .title {
            font-family: 'Orbitron', sans-serif;
            font-size: 1.5rem; font-weight: 800;
            color: #c084fc; letter-spacing: 3px;
            margin-bottom: 6px;
            text-shadow: 0 0 12px rgba(192, 132, 252, 0.6);
        }
        .subtitle { font-size: 0.78rem; color: #7e22ce; margin-bottom: 22px; letter-spacing: 2px; }
        .status-badge {
            display: inline-block;
            padding: 6px 14px;
            background: rgba(88, 28, 135, 0.4);
            border: 1px solid #9333ea;
            border-radius: 20px;
            font-size: 0.85rem;
            color: #e9d5ff;
            margin-bottom: 20px;
            letter-spacing: 1px;
        }

        .card-vault {
            background: rgba(30, 11, 48, 0.6);
            border: 1px dashed #a855f7;
            padding: 20px;
            border-radius: 8px;
            word-break: break-all;
            margin-top: 15px;
        }
        .card-vault.unlocked {
            border: 1px solid #38bdf8;
            animation: unlockedGlow 2.4s ease-in-out infinite;
        }
        @keyframes unlockedGlow {
            0%, 100% { box-shadow: 0 0 26px rgba(56,189,248,0.3), inset 0 0 16px rgba(56,189,248,0.06); }
            50%      { box-shadow: 0 0 46px rgba(56,189,248,0.55), inset 0 0 26px rgba(56,189,248,0.14); }
        }
        .flag-text { color: #38bdf8; font-size: 1.05rem; font-weight: bold; text-shadow: 0 0 8px rgba(56, 189, 248, 0.5); }

        .denied { color: #f43f5e; font-size: 0.9rem; margin-top: 10px; }
        .card-vault.denied-card { animation: shake 0.4s ease 1.8s 1; }
        @keyframes shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }

        .btn-refresh {
            display: inline-block;
            margin-top: 18px;
            padding: 10px 20px;
            background: linear-gradient(135deg, #7e22ce, #581c87);
            border: none; border-radius: 6px;
            color: #fff;
            font-family: 'Orbitron', sans-serif;
            font-size: 0.8rem;
            cursor: pointer;
            text-decoration: none;
            letter-spacing: 1px;
            transition: 0.3s;
        }
        .btn-refresh:hover { box-shadow: 0 0 15px rgba(168, 85, 247, 0.6); transform: translateY(-1px); }
        .btn-refresh:focus-visible { outline: 2px solid #38bdf8; outline-offset: 3px; }

        /* ---- the signature moment: only rendered when the barrier is actually breached ---- */
        #domain-overlay {
            position: fixed; inset: 0; top: 0; left: 0; right: 0; bottom: 0;
            background: radial-gradient(circle at center, #0a1830 0%, #020105 72%);
            z-index: 100;
            display: flex; align-items: center; justify-content: center;
            animation: domainIn 0.4s ease forwards, domainOut 0.5s ease forwards 3.3s;
        }
        @keyframes domainIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes domainOut { to { opacity: 0; visibility: hidden; pointer-events: none; } }

        .void-ring {
            position: absolute; top: 50%; left: 50%;
            width: 0; height: 0;
            transform: translate(-50%, -50%);
            border: 2px solid rgba(56, 189, 248, 0.55);
            border-radius: 50%;
            animation: ringExpand 1.9s ease-out infinite;
        }
        @keyframes ringExpand { 0% { width: 0; height: 0; opacity: 0.9; } 100% { width: 1500px; height: 1500px; opacity: 0; } }

        .domain-text { text-align: center; font-family: 'Orbitron', sans-serif; letter-spacing: 6px; z-index: 2; }
        .domain-title {
            font-size: 2.1rem; font-weight: 900; color: #e0f2fe;
            text-shadow: 0 0 20px #38bdf8, 0 0 55px #3b82f6;
            opacity: 0; animation: textIn 0.6s ease forwards 0.55s;
        }
        .domain-sub {
            font-size: 1rem; color: #93c5fd; margin-top: 10px; letter-spacing: 4px;
            opacity: 0; animation: textIn 0.6s ease forwards 1.15s;
        }
        @keyframes textIn { to { opacity: 1; } }

        @media (max-width: 480px) {
            .terminal-box { padding: 30px 22px; }
            .domain-title { font-size: 1.4rem; letter-spacing: 3px; }
            .domain-sub { font-size: 0.8rem; letter-spacing: 2px; }
        }
        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
        }
    </style>
</head>
<body>
    <div class="orb orb1"></div>
    <div class="orb orb2"></div>
    <div class="orb orb3"></div>
    <div class="grid-overlay"></div>
    <div class="scanline"></div>

    {% if is_special_grade %}
    <div id="domain-overlay">
        <div class="void-ring"></div>
        <div class="void-ring" style="animation-delay:0.55s"></div>
        <div class="void-ring" style="animation-delay:1.1s"></div>
        <div class="domain-text">
            <div class="domain-title">DOMAIN EXPANSION</div>
            <div class="domain-sub">UNLIMITED VOID</div>
        </div>
    </div>
    {% endif %}

    <div class="terminal-box">
        <div class="boot-log">
            <div>&gt; INITIALIZING BARRIER SCAN...</div>
            <div>&gt; CROSS-REFERENCING SORCERER REGISTRY...</div>
            <div>&gt; VERIFYING CURSED ENERGY SIGNATURE...</div>
            <div>&gt; ACCESS LEVEL: {{ sorcerer.rank|upper }}</div>
        </div>

        <div class="real-content">
            <div class="title">JUJUTSU HIGH</div>
            <div class="subtitle">BARRIER ACCESS TERMINAL</div>

            <div class="status-badge">SORCERER RANK: {{ sorcerer.rank|upper }}</div>

            {% if is_special_grade %}
                <div class="card-vault unlocked">
                    <h4 style="color:#c084fc; margin-bottom:8px;">SPECIAL GRADE VAULT UNLOCKED</h4>
                    <p style="font-size: 0.8rem; color:#a7f3d0; margin-bottom: 10px;">Retrieved Special Cursed Tool:</p>
                    <div class="flag-text">{{ flag }}</div>
                </div>
            {% else %}
                <div class="card-vault denied-card">
                    <p style="font-size: 0.85rem; color:#bbb;">Accessing Vault Parameters...</p>
                    <div class="denied">PERMISSIONS DENIED: {{ sorcerer.rank|replace('_',' ')|upper }} sorcerers cannot inspect Special Grade artifacts.</div>
                </div>
            {% endif %}

            <a href="/" class="btn-refresh">SCAN BARRIER PERIMETER</a>
        </div>
    </div>
</body>
</html>
"""

DEFAULT_USER = {
    "username": "sorcerer_apprentice",
    "rank": "grade_4",
    "is_admin": False
}

@app.route('/')
def home():
    # Retrieve auth cookie or issue a default base64 encoded session cookie
    auth_cookie = request.cookies.get('sorcerer_session')
    
    if not auth_cookie:
        # Initial user session encoded in base64
        cookie_json = json.dumps(DEFAULT_USER)
        encoded_cookie = base64.b64encode(cookie_json.encode()).decode()
        
        resp = make_response(render_template_string(
            HTML_TEMPLATE, 
            sorcerer=DEFAULT_USER, 
            is_special_grade=False,
            flag=""
        ))
        resp.set_cookie('sorcerer_session', encoded_cookie)
        return resp

    try:
        # Decode user-supplied session cookie
        decoded_bytes = base64.b64decode(auth_cookie)
        user_data = json.loads(decoded_bytes.decode())
        
        # Check if the player elevated their rank to "special_grade" or set is_admin to True
        is_special = (user_data.get("rank") == "special_grade") or (user_data.get("is_admin") is True)
        flag_val = "TriHack26{b4rr13r_cl4ss_s3ss10n_t4mp3r_s4t0ru}" if is_special else ""

        resp = make_response(render_template_string(
            HTML_TEMPLATE, 
            sorcerer=user_data, 
            is_special_grade=is_special,
            flag=flag_val
        ))
        return resp

    except Exception:
        # Reset on invalid payload
        resp = make_response(render_template_string(
            HTML_TEMPLATE, 
            sorcerer=DEFAULT_USER, 
            is_special_grade=False,
            flag=""
        ))
        return resp

def open_browser():
    webbrowser.open_new('http://127.0.0.1:5001/')

if __name__ == '__main__':
    Timer(1, open_browser).start()
    app.run(port=5001)