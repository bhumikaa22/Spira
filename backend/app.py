from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import google.generativeai as genai

load_dotenv() 
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel("gemini-pro")

app = Flask(__name__)
CORS(app)  # Allow requests from frontend


@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message")
    situation = data.get("situation")

    if not user_message:
         return jsonify({"error": "Missing message"}), 400

    if situation:
        prompt = f"You are an English-speaking practice partner. The situation is: '{situation}'. The user says: '{user_message}'. Reply in simple, polite English as a native speaker would."
    else:
        prompt = f"The user says: '{user_message}'. Reply in simple, polite English and keep the conversation going."


    prompt = f"You are an English-speaking practice partner. The situation is: '{situation}'. The user says: '{user_message}'. Reply in simple, polite English as a native speaker would."

    try:
        response = model.generate_content(prompt)
        return jsonify({"reply": response.text})
    except Exception as e:
        print("Gemini Error:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
