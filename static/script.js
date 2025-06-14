const messageHistory = [];
let mediaRecorder;
let audioChunks = [];

async function sendMessage() {
    const userInputElem = document.getElementById("userInput");
    const userInput = userInputElem.value;
    const chatbox = document.getElementById("chatbox");
    const situation = document.getElementById("situation").value;
  
    if (userInput.trim() === "") return;
    const userMsg = document.createElement("p");
    userMsg.textContent = "🧑 You: " + userInput;
    chatbox.appendChild(userMsg);
  
    messageHistory.push({ role: "user", content: userInput });
    getGrammarFeedback(userInput);
    
    // Clear the input field immediately 
    userInputElem.value = ""; 

    try {
        const response = await fetch("http://127.0.0.1:5000/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message_history: messageHistory,
                situation: situation
            })
        });

        const data = await response.json();
        const botReply = data.reply || data.error || "Sorry, I didn't get a response.";

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

async function sendMessage() {
    console.log("1. startVoiceInput called");
    const micBtn = document.getElementById("micButton");
    const status = document.getElementById("status");
    const userInputElem = document.getElementById("userInput");

    if (!('webkitSpeechRecognition' in window) || !navigator.mediaDevices) {
        status.textContent = "Voice recognition or media devices not supported.";
        return;
    }
    try {
        console.log("2. Requesting microphone access...");
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = event => {
            console.log("Audio data available!");
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
            console.log("4. MediaRecorder stopped. Creating Blob.");
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });

            analyzeAudioFluency(audioBlob);

            audioChunks = [];
        };

    } catch (err) {
        console.error("Error accessing microphone:", err);
        status.textContent = "Could not access microphone.";
        return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    mediaRecorder.start();
    recognition.start();

    status.textContent = "🎤 Listening...";
    micBtn.disabled = true;

    recognition.onresult = function(event) {
        const spokenText = event.results[0][0].transcript;
        userInputElem.value = spokenText;
        sendMessage(); 
    };

    // When an error occurs
    recognition.onerror = function(event) {
        console.error("Voice recognition error: ", event.error);
        status.textContent = "Error: " + event.error;
        mediaRecorder.stop();
    };

    recognition.onend = function() {
        if (mediaRecorder.state === "recording") {
            mediaRecorder.stop();
        }
        micBtn.disabled = false;
        setTimeout(() => { status.textContent = ""; }, 1000);
    };
}

async function analyzeAudioFluency(audioBlob) {
    console.log("5. analyzeAudioFluency called. Sending audio to backend.");
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'user_audio.webm');

    try {
        const response = await fetch('/analyze_fluency', {
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

function displayFluencyScore(data) {
    const chatbox = document.getElementById("chatbox");
    const scoreContainer = document.createElement('div');
    scoreContainer.className = 'suggestions'; //  can reuse the same style

    // Build a user-friendly report
    let scoreHTML = `
        <details>
            <summary><strong>📊 Your Fluency Report</strong></summary>
            <ul>
                <li><strong>Fluency Score:</strong> ${data.fluency_score}%</li>
                <li><strong>Pauses Detected:</strong> ${data.num_pauses}</li>
                <li><strong>Total Duration:</strong> ${data.duration}s</li>
                <li><strong>Time Spent Speaking:</strong> ${data.speaking_time}s</li>
            </ul>
        </details>
    `;

    scoreContainer.innerHTML = scoreHTML;
    chatbox.appendChild(scoreContainer);
    chatbox.scrollTop = chatbox.scrollHeight;
}

document.addEventListener('DOMContentLoaded', () => {
    const sendButton = document.getElementById('sendButton');
    const userInput = document.getElementById('userInput');
    const micButton = document.getElementById('micButton'); // Find the mic button

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

function speakText(text) {

    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1; // Speed of speech (0.1 to 10)
        utterance.pitch = 1; // Pitch of speech (0 to 2)

        // Speak the text
        window.speechSynthesis.speak(utterance);
    } else {
        console.log("Sorry, your browser doesn't support text-to-speech.");
    }
}

async function getGrammarFeedback(text) {
    try {
        const response = await fetch("http://127.0.0.1:5000/check_grammar", {
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

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/static/sw.js')
            .then(registration => {
                console.log('Service Worker registered successfully:', registration);
            })
            .catch(error => {
                console.log('Service Worker registration failed:', error);
            });
    });
}