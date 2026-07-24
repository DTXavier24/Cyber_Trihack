from flask import Flask, request, render_template_string
import sqlite3
import webbrowser
from threading import Timer

app = Flask(__name__)

def init_db():
    conn = sqlite3.connect('anbu_archive.db')
    cursor = conn.cursor()
    cursor.execute('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, secret_scroll TEXT)')
    
    cursor.execute('SELECT COUNT(*) FROM users')
    if cursor.fetchone()[0] == 0:
        # Secret flag stored in the admin record with the requested TriHack26 format
        cursor.execute("INSERT INTO users (username, password, secret_scroll) VALUES ('hokage_admin', 'S3cr3t_R4s3ng4n_2026!', 'TriHack26{1nst4nt_th3_f1r3_sh1n0b1_sqli}')")
        cursor.execute("INSERT INTO users (username, password, secret_scroll) VALUES ('genin_user', 'konoha123', 'Keep training!')")
    
    conn.commit()
    conn.close()

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ANBU Archives // Leaf Village Terminal</title>
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&family=Rajdhani:wght@500;600&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Rajdhani', sans-serif;
            background: radial-gradient(circle at center, #1a0808 0%, #050202 100%);
            color: #f0f0f0;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        .container {
            background: rgba(20, 10, 10, 0.75);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 68, 68, 0.2);
            box-shadow: 0 0 30px rgba(230, 0, 0, 0.2);
            border-radius: 12px;
            padding: 40px;
            width: 380px;
            text-align: center;
        }
        .logo {
            font-family: 'Orbitron', sans-serif;
            font-size: 1.5rem;
            color: #ff3333;
            letter-spacing: 2px;
            margin-bottom: 8px;
            text-shadow: 0 0 10px rgba(255, 51, 51, 0.5);
        }
        .subtitle {
            font-size: 0.9rem;
            color: #888;
            margin-bottom: 25px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .input-group {
            margin-bottom: 18px;
            text-align: left;
        }
        label {
            display: block;
            font-size: 0.85rem;
            color: #aaa;
            margin-bottom: 6px;
        }
        input {
            width: 100%;
            padding: 12px;
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            color: #fff;
            font-size: 1rem;
            outline: none;
            transition: 0.3s;
        }
        input:focus {
            border-color: #ff3333;
            box-shadow: 0 0 8px rgba(255, 51, 51, 0.4);
        }
        button {
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #cc0000, #800000);
            border: none;
            border-radius: 6px;
            color: #fff;
            font-family: 'Orbitron', sans-serif;
            font-weight: 700;
            cursor: pointer;
            transition: 0.3s;
            margin-top: 10px;
        }
        button:hover {
            background: linear-gradient(135deg, #ff1a1a, #990000);
            box-shadow: 0 0 15px rgba(255, 0, 0, 0.5);
        }
        .error {
            color: #ff4d4d;
            margin-top: 15px;
            font-size: 0.95rem;
            font-weight: 600;
        }
        .scroll-card {
            background: rgba(40, 10, 10, 0.6);
            border: 1px dashed #ff3333;
            padding: 20px;
            border-radius: 8px;
            word-break: break-all;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">ANBU // ARCHIVE</div>
        <div class="subtitle">Classified Shinobi Terminal</div>

        {% if scroll %}
            <div class="scroll-card">
                <h3 style="color:#ff3333; margin-bottom:10px;">ACCESS GRANTED</h3>
                <p style="font-size: 0.85rem; color:#ccc; margin-bottom: 12px;">Retrieved Intelligence Scroll:</p>
                <code style="color: #00ffcc; font-size: 1.1rem;">{{ scroll }}</code>
            </div>
        {% else %}
            <form method="POST" action="/login">
                <div class="input-group">
                    <label>SHINOBI ID (USERNAME)</label>
                    <input type="text" name="username"required>
                </div>
                <div class="input-group">
                    <label>PASSCODE</label>
                    <input type="password" name="password">
                </div>
                <button type="submit">AUTHENTICATE</button>
            </form>
            {% if error %}
                <div class="error">{{ error }}</div>
            {% endif %}
        {% endif %}
    </div>
</body>
</html>
"""

@app.route('/')
def home():
    return render_template_string(HTML_TEMPLATE)

@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username', '')
    password = request.form.get('password', '')

    conn = sqlite3.connect('anbu_archive.db')
    cursor = conn.cursor()

    # Intentional raw SQL string query
    query = f"SELECT username, secret_scroll FROM users WHERE username = '{username}' AND password = '{password}'"
    
    try:
        cursor.execute(query)
        user = cursor.fetchone()
        conn.close()

        if user:
            return render_template_string(HTML_TEMPLATE, scroll=user[1])
        else:
            return render_template_string(HTML_TEMPLATE, error="Keep training!")
    except sqlite3.Error:
        conn.close()
        # Returns the same prompt on query execution errors
        return render_template_string(HTML_TEMPLATE, error="Keep training!")

def open_browser():
    webbrowser.open_new('http://127.0.0.1:5000/')

if __name__ == '__main__':
    init_db()
    Timer(1, open_browser).start()
    app.run(port=5000)
