const messageHistory = [];

async function sendMessage() {
    const userInput = document.getElementById("userInput").value;
    const chatbox = document.getElementById("chatbox");
    const situation = document.getElementById("situation").value;
  
if (userInput.trim() === "") return;

  
    // Show user message
    const userMsg = document.createElement("p");
    userMsg.textContent = "🧑 You: " + userInput;
    chatbox.appendChild(userMsg);
  
      messageHistory.push({ role: "user", content: userInput });
    // Send to backend
try {
        const response = await fetch("http://127.0.0.1:5000/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message_history: messageHistory, // Send the whole array
                situation: situation
            })
        });

        const data = await response.json();
        const botReply = data.reply || data.error || "Sorry, I didn't get a response.";

        const botMsg = document.createElement("p");
        botMsg.textContent = "🤖 Bot: " + botReply;
        chatbox.appendChild(botMsg);
        messageHistory.push({ role: "assistant", content: botReply });

        // Auto-scroll to the bottom
        chatbox.scrollTop = chatbox.scrollHeight;

    } catch (error) {
        console.error("Fetch Error:", error);
        const botMsg = document.createElement("p");
        botMsg.textContent = "🤖 Bot: Error reaching the server. Please check the console.";
        chatbox.appendChild(botMsg);
    }
  
    document.getElementById("userInput").value = "";
  }
function startVoiceInput() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  const micBtn = document.getElementById("micButton");
  const status = document.getElementById("status");

  // Show listening status and visual effect
  status.textContent = "🎤 Listening...";
  micBtn.style.backgroundColor = "#34d399"; // Tailwind green
  micBtn.style.borderRadius = "50%";

  recognition.start();

  recognition.onresult = function(event) {
    const spokenText = event.results[0][0].transcript;
    document.getElementById("userInput").value = spokenText;
    sendMessage(); // Auto-send the spoken input
  };

  recognition.onerror = function(event) {
    alert("Voice recognition error: " + event.error);
    micBtn.style.backgroundColor = "";
    status.textContent = "";
  };

  recognition.onend = function() {
    micBtn.style.backgroundColor = "";
    status.textContent = "";
  };
}

document.addEventListener('DOMContentLoaded', () => {
    const sendButton = document.getElementById('sendButton'); // Assuming you have a send button with this ID
    const userInput = document.getElementById('userInput');

    if (sendButton) {
        sendButton.onclick = sendMessage;
    }

    if (userInput) {
        userInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                sendMessage();
            }
        });
    }
});