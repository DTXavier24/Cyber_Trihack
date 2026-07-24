import os
from flask import Flask, request, render_template, render_template_string

app = Flask(__name__)

# Le flag est stocké dans une variable d'environnement
os.environ["SECRET_FLAG"] = os.environ.get("GZCTF_FLAG", "TriHack{12345678_87654321}")  # not the flag

@app.route("/", methods=["GET", "POST"])
def index():
    preview = ""
    if request.method == "POST":
        name = request.form.get("name", "")
        
        # Filtre de sécurité basique (mots-clés interdits)
        forbidden_words = ["import", "os", "system", "subprocess", "flag.txt",
                           "popen", "exec", "eval", "spawn", "open", "read"]
        if any(word in name.lower() for word in forbidden_words):
            return render_template("index.html", preview="Security filter: Forbidden character or keyword detected.")

        # Vulnérabilité SSTI (Injection directe dans le template)
        template = f"Hello {name}, welcome to the school intranet!"
        
        try:
            preview = render_template_string(template)
        except Exception as e:
            preview = f"Rendering error: {e}"

    return render_template("index.html", preview=preview)

if __name__ == "__main__":
    print("[*] Lancement du serveur sur http://localhost:5000 ...")
    app.run(host="0.0.0.0", port=5000, debug=True)