from flask import Flask, render_template, request, jsonify # type: ignore
from flask_cors import CORS
from dotenv import load_dotenv # type: ignore
import os
import requests

load_dotenv()

app = Flask(__name__)
app.static_folder = 'static'

@app.route("/")
def home():
    return render_template("index.html")
CORS(app)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": "https://github.com/bhumikaa22/Spira"  # ✅ Must be a valid public link
}

MODEL_NAME = "openai/gpt-3.5-turbo"  # fallback that always works

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message")
    situation = data.get("situation", "")

    if not user_message:
        return jsonify({"error": "Message is missing"}), 400

    prompt = f"The situation is: {situation}. The user says: {user_message}" if situation else user_message

    body = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    try:
        response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=HEADERS, json=body)
        response.raise_for_status()
        reply = response.json()["choices"][0]["message"]["content"]
        return jsonify({"reply": reply})
    except Exception as e:
        print("OpenRouter Error:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
