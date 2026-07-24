import sqlite3
import time
import os
from flask import Flask, request, render_template, send_file, render_template_string

app = Flask(__name__)


UPLOAD_FOLDER = os.path.join(app.root_path, 'static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


SECRET_FILE_NAME = "backup_key_v28.txt"
SECRET_FILE_PATH = os.path.join(app.root_path, SECRET_FILE_NAME)

with open(SECRET_FILE_PATH, "w", encoding="utf-8") as f:
    f.write(os.getenv("GZCTF_FLAG", "TriHack{12345678_87654321}"))  # not the flag


def sqlite_sleep(seconds):
    time.sleep(seconds)
    return 1
#Blind SQL
@app.route("/robots.txt")
def robots():
    return "User-agent: *\nDisallow: /admin/view_log", 200, {'Content-Type': 'text/plain'}
@app.route("/", methods=["GET", "POST"])
@app.route("/login", methods=["GET", "POST"])
def search():
    status = None
    two_factor_required = False
    current_username = ""

    if request.method == "POST":
        username = request.form.get('username', '')
        password = request.form.get('password', '')
        
        honeypot = request.form.get('website_url', '')
        if honeypot != "":
            return "Robot détecté.", 403
            
        conn = sqlite3.connect('ctf.db')
        conn.create_function("sleep", 1, sqlite_sleep)
        cursor = conn.cursor()

        query = f"SELECT * FROM users WHERE username = '{username}'"
        
        try:
            cursor.execute(query)
            row = cursor.fetchone()
            
            if row and username == 'admin' and password == 'Trihack26{B1ind_SQL_Part_1}':
                two_factor_required = True
                current_username = username
            else:
                status = "Nom d'utilisateur ou mot de passe incorrect."
        except Exception:
            status = "Nom d'utilisateur ou mot de passe incorrect."
        finally:
            conn.close()
            
        if two_factor_required:
            return render_template("login.html", two_factor_required=True, username=current_username)
        else:
            return render_template("login.html", status=status)
            
    return render_template("login.html")
#Path Traversal
@app.route("/admin/view_log")
def view_log():
    filename = request.args.get('file', '')
    if not filename:
        return "Veuillez spécifier un fichier de log à analyser via ?file=", 400

    # Filtre de contournement non-récursif (remplace uniquement la première occurrence de '../')
    safe_filename = filename.replace("../", "")

    # On refuse les chemins absolus : sinon os.path.join ignore le dossier de base
    # et tout le filtre de traversal serait court-circuité (ex: ?file=/etc/passwd).
    if os.path.isabs(safe_filename):
        return "Chemin invalide.", 400

    file_path = os.path.join(UPLOAD_FOLDER, safe_filename)
    
    try:
        return send_file(file_path)
    except FileNotFoundError:
        # On ne divulgue pas le chemin absolu du serveur (fuite d'info qui facilitait la traversal).
        return "Erreur : fichier introuvable.", 404

if __name__ == "__main__":
    app.run(port=5000, debug=True)
    
    
