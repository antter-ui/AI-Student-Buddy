// ===============================
// CHAT MEMORY
// ===============================

let conversation = [
    {
        role: "system",
        content: "You are a helpful AI study assistant for engineering students."
    }
];


// ===============================
// GET HTML ELEMENTS
// ===============================

const sendButton = document.getElementById("send");
const promptInput = document.getElementById("prompt");
const messages = document.getElementById("messages");
const clearChatButton = document.getElementById("clearChat");


// ===============================
// TYPING EFFECT
// ===============================

function typeMessage(element, text) {

    let index = 0;

    const speed = text.length > 1000 ? 1 : 5;

    element.textContent = "";

    const interval = setInterval(() => {

        element.textContent = text.slice(0, index + 1);

        index++;

        messages.scrollTop = messages.scrollHeight;

        if (index >= text.length) {

            clearInterval(interval);

            // Convert Markdown after typing finishes
            if (typeof marked !== "undefined") {
                element.innerHTML = marked.parse(text);
            } else {
                element.textContent = text;
            }
        }

    }, speed);
}


// ===============================
// SEND MESSAGE
// ===============================

async function sendMessage() {

    const text = promptInput.value.trim();

    // Don't send empty messages
    if (text === "") {
        return;
    }


    // ===============================
    // SHOW USER MESSAGE
    // ===============================

    const userMessage = document.createElement("div");

    userMessage.className = "message user";

    userMessage.innerText = text;

    messages.appendChild(userMessage);


    // Clear input
    promptInput.value = "";


    // Add user message to conversation memory
    conversation.push({
        role: "user",
        content: text
    });


    // ===============================
    // SHOW THINKING MESSAGE
    // ===============================

    const aiMessage = document.createElement("div");

    aiMessage.className = "message ai";

    aiMessage.innerText = "Thinking...";

    messages.appendChild(aiMessage);

    messages.scrollTop = messages.scrollHeight;


    // ===============================
    // CALL AI
    // ===============================

    try {

        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Authorization": `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    model: "openai/gpt-oss-20b",

                    messages: conversation

                })
            }
        );


        // Convert response to JSON
        const data = await response.json();

        console.log("API RESPONSE:", data);


        // Check for API errors
        if (!response.ok) {

            throw new Error(
                data.error?.message || "API request failed"
            );

        }


        // Check whether AI actually returned an answer
        if (!data.choices || data.choices.length === 0) {

            throw new Error("No AI response received");

        }


        // ===============================
        // GET AI RESPONSE
        // ===============================

        const aiResponse =
            data.choices[0].message.content;


        // ===============================
        // DISPLAY AI RESPONSE
        // ===============================

        typeMessage(aiMessage, aiResponse);


        // Add AI response to conversation memory
        conversation.push({
            role: "assistant",
            content: aiResponse
        });


    }

    catch (error) {

        console.error("ERROR:", error);

        aiMessage.innerText =
            "Error: " + error.message;

    }

}


// ===============================
// SEND BUTTON
// ===============================

sendButton.addEventListener("click", sendMessage);


// ===============================
// ENTER KEY
// ===============================

promptInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {

        sendMessage();

    }

});


// ===============================
// CLEAR CHAT
// ===============================

clearChatButton.addEventListener("click", function () {

    // Remove all messages
    messages.innerHTML = `
        <div class="message ai">
            Hi! 👋 Ask me anything about your studies.
        </div>
    `;


    // Reset conversation memory
    conversation = [
        {
            role: "system",
            content: "You are a helpful AI study assistant for engineering students."
        }
    ];

});