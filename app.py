import language_tool_python
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests
# import librosa

load_dotenv()

app = Flask(__name__)

CORS(app)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json",
    "HTTP-Referer": f"http://127.0.0.1:5000/chat"
}
API_URL = "https://openrouter.ai/api/v1/chat/completions"
tool = language_tool_python.LanguageTool('en-US')

@app.route("/")
def home():
    return render_template("index.html")

@app.route('/manifest.json')
def serve_manifest():
    return app.send_static_file('manifest.json')

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
    
@app.route("/check_grammar", methods=["POST"])
def check_grammar():
    data = request.json
    text_to_check = data.get('text')

    if not text_to_check:
        return jsonify({"error": "No text provided"}), 400

    try:
        matches = tool.check(text_to_check)
        corrections = []
        for match in matches:
            corrections.append({
                'message': match.message,
                'replacements': match.replacements,
                'offset': match.offset,
                'length': match.errorLength,
                'context': match.context
            })
            
        return jsonify({'corrections': corrections})
    except Exception as e:
        print(f"Grammar check error: {e}")
        return jsonify({"error": "Failed to check grammar"}), 500

# @app.route("/analyze_fluency", methods=["POST"])
# def analyze_fluency():
#     if 'audio_file' not in request.files:
#         return jsonify({"error": "No audio file found"}), 400

#     audio_file = request.files['audio_file']
    
#     try:
#         # Load the audio data directly from the file object using soundfile
#         # Librosa's load function can take a file-like object
#         y, sr = librosa.load(audio_file, sr=None) # sr=None preserves the original sample rate

#         # Calculate total duration in seconds
#         duration = librosa.get_duration(y=y, sr=sr)

#         # Find the silent parts. `top_db=40` means anything 40dB below the max is silence.
#         non_silent_intervals = librosa.effects.split(y, top_db=40)

#         speaking_time = sum(interval[1] - interval[0] for interval in non_silent_intervals) / sr
#         num_pauses = len(non_silent_intervals) - 1 if len(non_silent_intervals) > 0 else 0
#         fluency_score = (speaking_time / duration) * 100 if duration > 0 else 0

#         return jsonify({
#             "duration": round(duration, 2),
#             "speaking_time": round(speaking_time, 2),
#             "num_pauses": num_pauses,
#             "fluency_score": round(fluency_score, 2)
#         })

#     except Exception as e:
#         print(f"Audio analysis error: {e}")
#         return jsonify({"error": "Failed to analyze audio"}), 500

if __name__ == "__main__":
    app.run(debug=True)
