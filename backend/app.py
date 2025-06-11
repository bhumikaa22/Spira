from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv() 
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)

response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "system", "content": "You are a helpful English speaking assistant."},
        {"role": "user", "content": "hello"},
    ]
)

print(response.choices[0].message.content)

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
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",  
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=150
        )
        bot_reply = response['choices'][0]['message']['content']
        return jsonify({"reply": bot_reply})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
