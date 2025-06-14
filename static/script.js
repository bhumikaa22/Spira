const messageHistory = [];

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

function startVoiceInput() {
    const micBtn = document.getElementById("micButton");
    const status = document.getElementById("status");
    const userInputElem = document.getElementById("userInput");

    if (!('webkitSpeechRecognition' in window)) {
        status.textContent = "Sorry, voice recognition is not supported in this browser.";
        return;
    }
  
    const recognition = new webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    status.textContent = "🎤 Listening...";
    micBtn.disabled = true;

    recognition.start();

    recognition.onresult = function(event) {
        const spokenText = event.results[0][0].transcript;
        userInputElem.value = spokenText;
        setTimeout(sendMessage, 300); 
    };

    // When an error occurs
    recognition.onerror = function(event) {
        console.error("Voice recognition error: ", event.error);
        status.textContent = "Error: " + event.error;
    };

    // When recognition ends (either successfully or with an error)
    recognition.onend = function() {
        // Reset the UI
        micBtn.disabled = false;
        // Clear status after a second
        setTimeout(() => { status.textContent = ""; }, 1000);
    };
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