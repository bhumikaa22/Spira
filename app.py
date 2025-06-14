from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests

load_dotenv()

print(f"--- DEBUG: Loaded API Key is: {os.getenv('OPENROUTER_API_KEY')} ---")

app = Flask(__name__)
app.static_folder = 'static'

CORS(app)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": f"http://127.0.0.1:5000/chat"
}
API_URL = "https://openrouter.ai/api/v1/chat/completions"

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json
    message_history = data.get('message_history', [])
    situation = data.get('situation', 'general conversation')

    if not message_history:
        return jsonify({"error": "Message history is missing"}), 400

    system_prompt = f"""
    You are Spira, a friendly and helpful AI English speaking tutor.
    The user wants to practice a conversation based on the scenario: '{situation}'.
    Your primary goals are:
    1. Act as the other person in the scenario.
    2. Keep your responses natural, friendly, and concise.
    3. If this is the first message, you MUST start the conversation by setting the scene and asking a question.
    """
    system_message = {"role": "system", "content": system_prompt}
    messages_to_send = [system_message] + message_history

    body = {
        "model": "openai/gpt-3.5-turbo",
        "messages": messages_to_send,
    }

    try:
        response = requests.post(API_URL, headers=HEADERS, json=body)
        response.raise_for_status() 
        reply = response.json()["choices"][0]["message"]["content"]
        return jsonify({'reply': reply})
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error from OpenRouter: {e.response.text}")
        return jsonify({"error": f"API Error: {e.response.status_code}"}), 500
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
