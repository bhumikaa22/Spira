from flask import Flask, request, jsonify, g
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests
import language_tool_python

load_dotenv()

app = Flask(__name__)
CORS(app)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

HEADERS = {
    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
    "Content-Type": "application/json",
}
API_URL = "https://openrouter.ai/api/v1/chat/completions"

# --- THE NEW, SAFER WAY TO HANDLE THE GRAMMAR TOOL ---
def get_grammar_tool():
    """
    Gets the grammar tool instance. Creates it if it doesn't exist in the
    current application context ('g'). This is safer for production servers.
    """
    if 'grammar_tool' not in g:
        print("Initializing LanguageTool for this context...")
        g.grammar_tool = language_tool_python.LanguageTool('en-US')
        print("LanguageTool initialized.")
    return g.grammar_tool
# --- END OF NEW METHOD ---

@app.route("/")
def home():
    # A simple health check endpoint for the deployed API
    return "Spira Backend is live and running."

@app.route("/chat", methods=["POST"])
def chat():
    # This function is correct and remains unchanged.
    data = request.json
    message_history = data.get('message_history', [])
    situation = data.get('situation', 'general conversation')
    if not message_history:
        return jsonify({"error": "Message history is missing"}), 400
    system_prompt = f"""You are Spira...""" # Truncated for brevity
    system_message = {"role": "system", "content": system_prompt}
    messages_to_send = [system_message] + message_history
    body = {"model": "openai/gpt-3.5-turbo", "messages": messages_to_send}
    try:
        response = requests.post(API_URL, headers=HEADERS, json=body)
        response.raise_for_status() 
        reply = response.json()["choices"][0]["message"]["content"]
        return jsonify({'reply': reply})
    except Exception as e:
        print(f"Chat Error: {e}")
        return jsonify({"error": "Failed to get chat reply"}), 500
    
@app.route("/check_grammar", methods=["POST"])
def check_grammar():
    # Get the tool using our new safe function
    tool = get_grammar_tool()
    
    data = request.json
    text_to_check = data.get('text')
    if not text_to_check:
        return jsonify({"error": "No text provided"}), 400
    try:
        matches = tool.check(text_to_check)
        corrections = []
        for match in matches:
            # We will only send the most essential data to avoid any errors
            corrections.append({
                'message': match.message,
                'replacements': match.replacements[:2] # Send max 2 replacements
            })
        return jsonify({'corrections': corrections})
    except Exception as e:
        print(f"Grammar check error: {e}")
        return jsonify({"error": "Failed to check grammar"}), 500

if __name__ == "__main__":
    app.run(debug=True)