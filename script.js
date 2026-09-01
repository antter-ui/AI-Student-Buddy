// ===============================
// CHAT MEMORY
// ===============================

let conversation = [
    {
        role: "system",
        content: `You are a helpful AI study assistant for engineering students.

When study notes are provided, answer questions using those notes.

If the answer cannot be found in the provided notes, clearly say that the information is not available in the uploaded notes.`
    }
];


// ===============================
// GET HTML ELEMENTS
// ===============================

const sendButton = document.getElementById("send");
const promptInput = document.getElementById("prompt");
const messages = document.getElementById("messages");
const clearChatButton = document.getElementById("clearChat");

const pdfUpload = document.getElementById("pdfUpload");
const fileName = document.getElementById("fileName");
const pdfPreview = document.getElementById("pdfPreview");

const summarizeBtn = document.getElementById("summarizeBtn");
const quizBtn = document.getElementById("quizBtn");
const quizContainer = document.getElementById("quizContainer");
// Planner elements
const subjectInput = document.getElementById("subject");
const examDateInput = document.getElementById("examDate");
const topicsInput = document.getElementById("topics");
const studyHoursInput = document.getElementById("studyHours");
const priorityInput = document.getElementById("priority");
const generatePlanBtn = document.getElementById("generatePlanBtn");
const plannerResult = document.getElementById("plannerResult");
const progressSection = document.getElementById("progressSection");
const progressContainer = document.getElementById("progressContainer");
progressSection.style.display = "none";


let pdfText = "";


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


    // Add user message to conversation
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
    // PREPARE MESSAGES FOR AI
    // ===============================

    let messagesToSend = [...conversation];


    if (pdfText.trim() !== "") {

        messagesToSend.splice(1, 0, {

            role: "system",

            content: `The user has uploaded study notes.

Use these notes as the primary source when answering questions.

IMPORTANT:
- Answer using the uploaded notes whenever possible.
- Do not invent information.
- If the answer is not present in the notes, clearly say that the information is not available in the uploaded notes.

UPLOADED NOTES:

${pdfText}`

        });

    }


    // ===============================
    // CALL AI
    // ===============================

    try {

        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {

                method: "POST",

                headers: {

                    "Authorization":
                        `Bearer ${API_KEY}`,

                    "Content-Type":
                        "application/json"

                },

                body: JSON.stringify({

                    model: "openai/gpt-oss-20b",

                    messages: messagesToSend

                })

            }
        );


        const data = await response.json();

        console.log("API RESPONSE:", data);


        // Check API error
        if (!response.ok) {

            throw new Error(
                data.error?.message ||
                "API request failed"
            );

        }


        // Check AI response
        if (
            !data.choices ||
            data.choices.length === 0
        ) {

            throw new Error(
                "No AI response received"
            );

        }


        // ===============================
        // GET AI RESPONSE
        // ===============================

        const aiResponse =
            data.choices[0].message.content;


        // ===============================
        // DISPLAY AI RESPONSE
        // ===============================

        typeMessage(
            aiMessage,
            aiResponse
        );


        // Save AI response
        conversation.push({

            role: "assistant",

            content: aiResponse

        });

    }


    catch (error) {

        console.error(
            "ERROR:",
            error
        );

        aiMessage.innerText =
            "Error: " + error.message;

    }

}


// ===============================
// SEND BUTTON
// ===============================

sendButton.addEventListener(
    "click",
    sendMessage
);


// ===============================
// ENTER KEY
// ===============================

promptInput.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Enter") {

            sendMessage();

        }

    }
);


// ===============================
// CLEAR CHAT
// ===============================

clearChatButton.addEventListener(
    "click",
    function () {

        messages.innerHTML = `
            <div class="message ai">
                Hi! 👋 Ask me anything about your studies.
            </div>
        `;


        conversation = [

            {
                role: "system",

                content: `You are a helpful AI study assistant for engineering students.

When study notes are provided, answer questions using those notes.

If the answer cannot be found in the provided notes, clearly say that the information is not available in the uploaded notes.`
            }

        ];

    }
);


// ===============================
// PDF UPLOAD & TEXT EXTRACTION
// ===============================

pdfUpload.addEventListener(
    "change",
    async function () {

        const file = pdfUpload.files[0];


        // No file selected
        if (!file) {

            fileName.innerText =
                "No file selected";

            pdfPreview.innerText =
                "Your extracted notes will appear here.";

            return;

        }


        // Check file type
        if (file.type !== "application/pdf") {

            fileName.innerText =
                "❌ Please select a PDF file.";

            return;

        }


        // ===============================
        // SHOW LOADING
        // ===============================

        fileName.innerText =
            "📖 Reading " + file.name + "...";

        pdfPreview.innerText =
            "Extracting text from your PDF...";


        try {

            // ===============================
            // READ FILE
            // ===============================

            const arrayBuffer =
                await file.arrayBuffer();


            // ===============================
            // OPEN PDF
            // ===============================

            const pdf =
                await pdfjsLib.getDocument({
                    data: arrayBuffer
                }).promise;


            let extractedText = "";


            // ===============================
            // READ EVERY PAGE
            // ===============================

            for (
                let pageNumber = 1;
                pageNumber <= pdf.numPages;
                pageNumber++
            ) {

                const page =
                    await pdf.getPage(
                        pageNumber
                    );


                const textContent =
                    await page.getTextContent();


                const pageText =
                    textContent.items
                        .map(item => item.str)
                        .join(" ");


                extractedText +=
                    pageText + "\n\n";

            }


            // ===============================
            // STORE PDF TEXT
            // ===============================

            pdfText = extractedText;


            // ===============================
            // UPDATE FILE NAME
            // ===============================

            fileName.innerText =
                `✅ ${file.name} loaded (${pdf.numPages} pages)`;


            // ===============================
            // SHOW PDF PREVIEW
            // ===============================

            if (pdfText.trim() === "") {

                pdfPreview.innerText =
                    "⚠️ No selectable text was found in this PDF. It may be a scanned/image-based PDF.";

            } else {

                pdfPreview.innerText =
                    pdfText;

            }


            // ===============================
            // CONSOLE
            // ===============================

            console.log(
                "========== PDF TEXT =========="
            );

            console.log(pdfText);

            console.log(
                "========== END PDF TEXT =========="
            );

        }


        catch (error) {

            console.error(
                "PDF ERROR:",
                error
            );

            fileName.innerText =
                "❌ Could not read this PDF.";

            pdfPreview.innerText =
                "Something went wrong while reading the PDF.";

        }

    }
);


// ===============================
// SUMMARIZE NOTES
// ===============================

summarizeBtn.addEventListener(
    "click",
    async function () {

        // Check PDF
        if (pdfText.trim() === "") {

            alert(
                "Please upload a PDF first."
            );

            return;

        }


        // Disable button
        summarizeBtn.disabled = true;

        summarizeBtn.innerText =
            "⏳ Summarizing...";


        // ===============================
        // SHOW USER REQUEST
        // ===============================

        const userMessage =
            document.createElement("div");

        userMessage.className =
            "message user";

        userMessage.innerText =
            "✨ Summarize my uploaded notes.";

        messages.appendChild(
            userMessage
        );


        // ===============================
        // SHOW AI LOADING
        // ===============================

        const aiMessage =
            document.createElement("div");

        aiMessage.className =
            "message ai";

        aiMessage.innerText =
            "Reading your notes...";

        messages.appendChild(
            aiMessage
        );


        messages.scrollTop =
            messages.scrollHeight;


        try {

            // ===============================
            // SUMMARY PROMPT
            // ===============================

            const summaryMessages = [

                {
                    role: "system",

                    content: `You are an AI study assistant.

Summarize the uploaded study notes clearly and accurately.

Rules:
- Use only the information provided in the notes.
- Organize the summary using headings and bullet points.
- Highlight important concepts.
- Keep the explanation suitable for an engineering student.
- Do not invent information.`
                },

                {
                    role: "user",

                    content: `Please summarize these study notes:

${pdfText}`
                }

            ];


            // ===============================
            // CALL AI
            // ===============================

            const response =
                await fetch(
                    "https://openrouter.ai/api/v1/chat/completions",
                    {

                        method: "POST",

                        headers: {

                            "Authorization":
                                `Bearer ${API_KEY}`,

                            "Content-Type":
                                "application/json"

                        },

                        body: JSON.stringify({

                            model:
                                "openai/gpt-oss-20b",

                            messages:
                                summaryMessages

                        })

                    }
                );


            // Get response
            const data =
                await response.json();


            console.log(
                "SUMMARY RESPONSE:",
                data
            );


            // Check API error
            if (!response.ok) {

                throw new Error(
                    data.error?.message ||
                    "Summary request failed"
                );

            }


            // Check response
            if (
                !data.choices ||
                data.choices.length === 0
            ) {

                throw new Error(
                    "No summary received"
                );

            }


            // Get summary
            const summary =
                data.choices[0].message.content;


            // Display summary
            typeMessage(
                aiMessage,
                summary
            );

        }


        catch (error) {

            console.error(
                "SUMMARY ERROR:",
                error
            );

            aiMessage.innerText =
                "Error: " + error.message;

        }


        finally {

            summarizeBtn.disabled =
                false;

            summarizeBtn.innerText =
                "✨ Summarize Notes";

        }

    }
);


// ===============================
// QUIZ STATE
// ===============================

let currentQuiz = [];

let currentQuestion = 0;

let userAnswers = [];


// ===============================
// GENERATE QUIZ
// ===============================

quizBtn.addEventListener(
    "click",
    async function () {

        // Check PDF
        if (pdfText.trim() === "") {

            alert(
                "Please upload a PDF first."
            );

            return;

        }


        // Disable button
        quizBtn.disabled = true;

        quizBtn.innerText =
            "⏳ Generating...";


        // Show loading
        quizContainer.innerHTML = `
            <div class="loading">
                🧠 Creating your quiz...
            </div>
        `;


        try {

            // ===============================
            // QUIZ PROMPT
            // ===============================

            const quizMessages = [

                {
                    role: "system",

                    content: `You are an AI quiz generator for engineering students.

Create exactly 5 multiple-choice questions based ONLY on the provided study notes.

Each question must contain:
- One question
- Four options
- One correct answer
- A short explanation

Return ONLY valid JSON.

Use exactly this format:

[
    {
        "question": "Question text",
        "options": [
            "Option A",
            "Option B",
            "Option C",
            "Option D"
        ],
        "answer": 0,
        "explanation": "Short explanation"
    }
]

The answer must be the number:
0 = Option A
1 = Option B
2 = Option C
3 = Option D`
                },

                {
                    role: "user",

                    content: `Create a 5-question quiz from these study notes:

${pdfText}`
                }

            ];


            // ===============================
            // CALL AI
            // ===============================

            const response =
                await fetch(
                    "https://openrouter.ai/api/v1/chat/completions",
                    {

                        method: "POST",

                        headers: {

                            "Authorization":
                                `Bearer ${API_KEY}`,

                            "Content-Type":
                                "application/json"

                        },

                        body: JSON.stringify({

                            model:
                                "openai/gpt-oss-20b",

                            messages:
                                quizMessages

                        })

                    }
                );


            // ===============================
            // GET RESPONSE
            // ===============================

            const data =
                await response.json();


            console.log(
                "QUIZ RESPONSE:",
                data
            );


            // Check API error
            if (!response.ok) {

                throw new Error(
                    data.error?.message ||
                    "Quiz generation failed"
                );

            }


            // Check response
            if (
                !data.choices ||
                data.choices.length === 0
            ) {

                throw new Error(
                    "No quiz received"
                );

            }


            // ===============================
            // GET AI TEXT
            // ===============================

            let quizText =
                data.choices[0].message.content;


            // Remove Markdown code fences
            quizText =
                quizText
                    .replace(
                        /```json/g,
                        ""
                    )
                    .replace(
                        /```/g,
                        ""
                    )
                    .trim();


            // Convert JSON text
            const quiz =
                JSON.parse(quizText);


            console.log(
                "QUIZ:",
                quiz
            );


            // ===============================
            // SAVE QUIZ
            // ===============================

            currentQuiz =
                quiz;

            currentQuestion = 0;

            userAnswers =
                new Array(
                    currentQuiz.length
                ).fill(null);


            // Show first question
            showQuestion();

        }


        catch (error) {

            console.error(
                "QUIZ ERROR:",
                error
            );

            quizContainer.innerHTML = `
                <div class="loading">
                    ❌ ${error.message}
                </div>
            `;

        }


        finally {

            quizBtn.disabled =
                false;

            quizBtn.innerText =
                "📝 Generate Quiz";

        }

    }
);


// ===============================
// SHOW QUESTION
// ===============================

function showQuestion() {

    if (currentQuiz.length === 0) {
        return;
    }


    const question =
        currentQuiz[currentQuestion];


    quizContainer.innerHTML = `

        <div class="quiz-question">

            <h3>
                Question
                ${currentQuestion + 1}
                of
                ${currentQuiz.length}
            </h3>

            <p>
                ${question.question}
            </p>


            <div class="quiz-options">

                ${question.options.map(
                    (option, index) => `

                    <button
                        type="button"
                        class="quiz-option ${
                            userAnswers[currentQuestion] === index
                                ? "selected"
                                : ""
                        }"
                        data-option="${index}"
                    >

                        ${String.fromCharCode(65 + index)}.
                        ${option}

                    </button>

                `
                ).join("")}

            </div>


            <div class="quiz-controls">

                ${
                    currentQuestion > 0

                        ? `
                        <button
                            type="button"
                            id="previousBtn"
                            class="quiz-control-btn"
                        >
                            ← Previous
                        </button>
                        `

                        : `
                        <span></span>
                        `
                }


                ${
                    currentQuestion <
                    currentQuiz.length - 1

                        ? `
                        <button
                            type="button"
                            id="nextBtn"
                            class="quiz-control-btn"
                        >
                            Next →
                        </button>
                        `

                        : `
                        <button
                            type="button"
                            id="submitQuizBtn"
                            class="quiz-control-btn"
                        >
                            Submit Quiz
                        </button>
                        `
                }

            </div>

        </div>

    `;


    // ===============================
    // ANSWER SELECTION
    // ===============================

    const options =
        document.querySelectorAll(
            ".quiz-option"
        );


    options.forEach(
        function (option) {

            option.addEventListener(
                "click",
                function () {

                    const selectedOption =
                        Number(
                            this.dataset.option
                        );


                    userAnswers[currentQuestion] =
                        selectedOption;


                    // Remove previous selection
                    options.forEach(
                        function (button) {

                            button.classList.remove(
                                "selected"
                            );

                        }
                    );


                    // Highlight selected answer
                    this.classList.add(
                        "selected"
                    );

                }
            );

        }
    );


    // ===============================
    // NEXT BUTTON
    // ===============================

    const nextBtn =
        document.getElementById(
            "nextBtn"
        );


    if (nextBtn) {

        nextBtn.addEventListener(
            "click",
            function () {

                if (
                    userAnswers[currentQuestion] ===
                    null
                ) {

                    alert(
                        "Please select an answer first."
                    );

                    return;

                }


                currentQuestion++;

                showQuestion();

            }
        );

    }


    // ===============================
    // PREVIOUS BUTTON
    // ===============================

    const previousBtn =
        document.getElementById(
            "previousBtn"
        );


    if (previousBtn) {

        previousBtn.addEventListener(
            "click",
            function () {

                currentQuestion--;

                showQuestion();

            }
        );

    }


    // ===============================
    // SUBMIT BUTTON
    // ===============================

    const submitBtn =
        document.getElementById(
            "submitQuizBtn"
        );


    if (submitBtn) {

        submitBtn.addEventListener(
            "click",
            function () {

                if (
                    userAnswers[currentQuestion] ===
                    null
                ) {

                    alert(
                        "Please select an answer first."
                    );

                    return;

                }


                calculateQuizScore();

            }
        );

    }

}


// ===============================
// CALCULATE QUIZ SCORE
// ===============================

function calculateQuizScore() {

    let score = 0;


    currentQuiz.forEach(
        function (question, index) {

            if (
                userAnswers[index] ===
                question.answer
            ) {

                score++;

            }

        }
    );


    const percentage =
        Math.round(
            (score / currentQuiz.length) * 100
        );


    // ===============================
    // SHOW RESULT
    // ===============================

    quizContainer.innerHTML = `

        <div class="quiz-result">

            <h2>
                🎯 Quiz Complete!
            </h2>

            <h1>
                ${score} / ${currentQuiz.length}
            </h1>

            <p>
                Score: ${percentage}%
            </p>

            <button
                type="button"
                id="retryQuizBtn"
                class="quiz-control-btn"
            >
                🔄 Try Again
            </button>

        </div>

    `;


    // ===============================
    // RETRY
    // ===============================

    const retryBtn =
        document.getElementById(
            "retryQuizBtn"
        );


    retryBtn.addEventListener(
        "click",
        function () {

            currentQuestion = 0;

            userAnswers =
                new Array(
                    currentQuiz.length
                ).fill(null);

            showQuestion();

        }
    );

}

// =========================
// STUDY PLANNER
// =========================

async function generateStudyPlan() {

    const subject = subjectInput.value.trim();
    const examDate = examDateInput.value;
    const topics = topicsInput.value.trim();
    const studyHours = studyHoursInput.value;
    const priority = priorityInput.value;

    // Validate input
    if (!subject || !examDate || !topics || !studyHours) {
        alert("Please fill in all planner fields.");
        return;
    }

    generatePlanBtn.disabled = true;
    generatePlanBtn.textContent = "🤖 Generating Plan...";

    plannerResult.innerHTML = `
        <div class="loading">
            Creating your personalized study plan...
        </div>
    `;

    const plannerPrompt = `
Create a personalized study plan for an engineering student.

Subject: ${subject}
Exam Date: ${examDate}
Topics: ${topics}
Study hours available per day: ${studyHours}
Priority: ${priority}

Create a realistic day-by-day study plan from today until the exam date.

Requirements:
- Divide the topics across the available days.
- Respect the student's available study hours per day.
- Give extra revision time before the exam.
- Include practice/revision sessions.
- Keep the workload realistic.
- Use clear headings and bullet points.
- Do not invent topics that were not provided.
`;

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
                    messages: [
                        {
                            role: "system",
                            content: "You are an expert academic study planner. Create realistic and structured study schedules for engineering students."
                        },
                        {
                            role: "user",
                            content: plannerPrompt
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error?.message || "Failed to generate study plan."
            );
        }

        if (!data.choices || !data.choices[0]) {
            throw new Error("No response received from AI.");
        }

        const plan = data.choices[0].message.content;

        plannerResult.innerHTML = `
            <div class="plan-output">
                ${marked.parse(plan)}
            </div>
        `;
        createProgressTracker();    

    } catch (error) {

        console.error("Planner Error:", error);

        plannerResult.innerHTML = `
            <div class="plan-output">
                <strong>❌ Error:</strong> 
                ${error.message}
            </div>
        `;

    } finally {

        generatePlanBtn.disabled = false;
        generatePlanBtn.textContent = "🤖 Generate Study Plan";
    }
}
generatePlanBtn.addEventListener("click", generateStudyPlan);

// =========================
// STUDY PROGRESS TRACKING
// =========================

let topicProgress = {};

function createProgressTracker() {

    const topicsText = topicsInput.value.trim();

    if (!topicsText) {
        return;
    }

    const topics = topicsText
        .split(",")
        .map(topic => topic.trim())
        .filter(topic => topic !== "");

    progressSection.style.display = "block";

    progressContainer.innerHTML = "";

    topics.forEach((topic, index) => {

        if (topicProgress[topic] === undefined) {
            topicProgress[topic] = 0;
        }

        const progressItem = document.createElement("div");

        progressItem.className = "progress-item";

        progressItem.innerHTML = `
            <div class="progress-topic">
                <span>${topic}</span>

                <select 
                    class="progress-select"
                    data-topic="${index}"
                >
                    <option value="0">Not Started</option>
                    <option value="50">In Progress</option>
                    <option value="100">Completed</option>
                </select>
            </div>

            <div class="topic-progress-bar">
                <div 
                    class="topic-progress-fill"
                    id="topicProgress${index}"
                ></div>
            </div>
        `;

        progressContainer.appendChild(progressItem);

        const select = progressItem.querySelector(".progress-select");

        select.value = topicProgress[topic];

        select.addEventListener("change", function () {

            topicProgress[topic] = Number(this.value);

            updateProgress();
        });

        updateTopicProgress(index, topicProgress[topic]);
    });

    updateProgress();
}

function updateTopicProgress(index, value) {

    const progressBar = document.getElementById(
        `topicProgress${index}`
    );

    if (progressBar) {
        progressBar.style.width = `${value}%`;
    }
}

function updateProgress() {

    const values = Object.values(topicProgress);

    if (values.length === 0) {
        return;
    }

    const total = values.reduce(
        (sum, value) => sum + value,
        0
    );

    const average = Math.round(
        total / values.length
    );

    document.getElementById(
        "progressPercentage"
    ).textContent = `${average}%`;

    document.getElementById(
        "overallProgressBar"
    ).style.width = `${average}%`;

    Object.keys(topicProgress).forEach((topic, index) => {
        updateTopicProgress(
            index,
            topicProgress[topic]
        );
    });
}