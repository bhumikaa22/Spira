async function sendMessage() {
    const userInput = document.getElementById("userInput").value;
    const chatbox = document.getElementById("chatbox");
    const situation = document.getElementById("situation").value;
  
    if (userInput.trim() === "" || situation === "") return;
  
    // Show user message
    const userMsg = document.createElement("p");
    userMsg.textContent = "🧑 You: " + userInput;
    chatbox.appendChild(userMsg);
  
    // Send to backend
    try {
      const response = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: userInput,
          situation: situation
        })
      });
  
      const data = await response.json();
  
      const botMsg = document.createElement("p");
      botMsg.textContent = "🤖 Bot: " + (data.reply || data.error);
      chatbox.appendChild(botMsg);
  
      chatbox.scrollTop = chatbox.scrollHeight;
    } catch (error) {
      const botMsg = document.createElement("p");
      botMsg.textContent = "🤖 Bot: Error reaching server.";
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

    // Reset UI
    micBtn.style.backgroundColor = "";
    status.textContent = "";
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
