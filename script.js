const BACKEND_URL = "https://spira.onrender.com";

// --- Global variables ---
const messageHistory = [];
let mediaRecorder;
let audioChunks = [];

// --- Main function to send text messages to the bot ---
async function sendMessage() {
    const userInputElem = document.getElementById("userInput");
    const userInput = userInputElem.value;
    const chatbox = document.getElementById("chatbox");
    const situation = document.getElementById("situation").value;
  
    if (userInput.trim() === "") return;

    // Display user message and update history
    const userMsg = document.createElement("p");
    userMsg.textContent = "🧑 You: " + userInput;
    chatbox.appendChild(userMsg);
    messageHistory.push({ role: "user", content: userInput });
    
    // Get grammar feedback for the typed text
    getGrammarFeedback(userInput);
    
    // Clear the input field
    userInputElem.value = ""; 

    try {
        const response = await fetch("https://spira.onrender.com/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message_history: messageHistory,
                situation: situation
            })
        });

        const data = await response.json();
        const botReply = data.reply || data.error || "Sorry, I didn't get a response.";

        // Display bot reply, update history, and speak it aloud
        const botMsg = document.createElement("p");
        botMsg.textContent = "🤖 Bot: " + botReply;
        chatbox.appendChild(botMsg);
        messageHistory.push({ role: "assistant", content: botReply });
        speakText(botReply);
        
        chatbox.scrollTop = chatbox.scrollHeight;

    } catch (error) {
        console.error("Fetch Error:", error);
        const botMsg = document.createElement("p");
        botMsg.textContent = "🤖 Bot: Error reaching the server. Please check the console.";
        chatbox.appendChild(botMsg);
    }
}
// This function captures audio for fluency analysis AND text for the chatbot.
async function startVoiceInput() {
    const micBtn = document.getElementById("micButton");
    const status = document.getElementById("status");
    const userInputElem = document.getElementById("userInput");

    if (!('webkitSpeechRecognition' in window) || !navigator.mediaDevices) {
        status.textContent = "Voice recognition or media devices not supported.";
        return;
    }

    // try {
    //     const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    //     mediaRecorder = new MediaRecorder(stream);
    // } catch (err) {
    //     console.error("Error accessing microphone:", err);
    //     status.textContent = "Could not access microphone.";
    //     return;
    // }

    // mediaRecorder.ondataavailable = event => {
    //     audioChunks.push(event.data);
    // };

    // mediaRecorder.onstop = () => {
    //     const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
    //     analyzeAudioFluency(audioBlob);
    //     audioChunks = []; // Reset for next recording
    // };

    const recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    // Start both recording and recognition
    // mediaRecorder.start();
    recognition.start();
    status.textContent = "🎤 Listening...";
    micBtn.disabled = true;

    recognition.onresult = function(event) {
        const spokenText = event.results[0][0].transcript;
        userInputElem.value = spokenText;
        sendMessage(); 
    };

    recognition.onerror = function(event) {
        console.error("Voice recognition error: ", event.error);
        status.textContent = "Error: " + event.error;
        // if (mediaRecorder.state === "recording") {
        //     mediaRecorder.stop();
        // }
    };

    recognition.onend = function() {
        // if (mediaRecorder.state === "recording") {
        //     mediaRecorder.stop();
        // }
        micBtn.disabled = false;
        setTimeout(() => { status.textContent = ""; }, 1000);
    };
}

async function analyzeAudioFluency(audioBlob) {
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'user_audio.webm');

    try {
        const response = await fetch(`${BACKEND_URL}/analyze_fluency`, {
            method: 'POST',
            body: formData  
        });
        const data = await response.json();
        if (response.ok) {
            displayFluencyScore(data);
        } else {
            console.error("Fluency analysis failed:", data.error);
        }
    } catch (error) {
        console.error("Error sending audio for analysis:", error);
    }
}

async function getGrammarFeedback(text) {
    try {
        const response = await fetch("https://spira.onrender.com/check_grammar", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text })
        });
        const data = await response.json();
        if (data.corrections && data.corrections.length > 0) {
            displayGrammarSuggestions(data.corrections);
        }
    } catch (error) {
        console.error("Error fetching grammar feedback:", error);
    }
}

function displayFluencyScore(data) {
    const chatbox = document.getElementById("chatbox");
    const scoreContainer = document.createElement('div');
    scoreContainer.className = 'suggestions';
    let scoreHTML = `
        <details>
            <summary><strong>📊 Your Fluency Report</strong></summary>
            <ul>
                <li><strong>Fluency Score:</strong> ${data.fluency_score}%</li>
                <li><strong>Pauses Detected:</strong> ${data.num_pauses}</li>
                <li><strong>Total Duration:</strong> ${data.duration}s</li>
                <li><strong>Time Spent Speaking:</strong> ${data.speaking_time}s</li>
            </ul>
        </details>`;
    scoreContainer.innerHTML = scoreHTML;
    chatbox.appendChild(scoreContainer);
    chatbox.scrollTop = chatbox.scrollHeight;
}

function displayGrammarSuggestions(corrections) {
    const chatbox = document.getElementById("chatbox");
    const suggestionsContainer = document.createElement('div');
    suggestionsContainer.className = 'suggestions';
    let suggestionsHTML = '💡 **Suggestions:**<ul>';
    corrections.forEach(correction => {
        suggestionsHTML += `<li>${correction.message} (e.g., "${correction.replacements[0]}")</li>`;
    });
    suggestionsHTML += '</ul>';
    suggestionsContainer.innerHTML = suggestionsHTML;
    chatbox.appendChild(suggestionsContainer);
    chatbox.scrollTop = chatbox.scrollHeight;
}

function speakText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    } else {
        console.log("Sorry, your browser doesn't support text-to-speech.");
    }
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => console.log('Service Worker registered successfully:', registration))
            .catch(error => console.log('Service Worker registration failed:', error));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const sendButton = document.getElementById('sendButton');
    const userInput = document.getElementById('userInput');
    const micButton = document.getElementById('micButton');

    if (sendButton) {
        sendButton.onclick = sendMessage;
    }

    if (userInput) {
        userInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); 
                sendMessage();
            }
        });
    }

    if (micButton) {
        micButton.onclick = startVoiceInput; 
    }
});
