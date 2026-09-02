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


// ===============================
// PLANNER ELEMENTS
// ===============================

const subjectInput = document.getElementById("subject");
const examDateInput = document.getElementById("examDate");
const topicsInput = document.getElementById("topics");
const studyHoursInput = document.getElementById("studyHours");
const priorityInput = document.getElementById("priority");
const generatePlanBtn = document.getElementById("generatePlanBtn");
const plannerResult = document.getElementById("plannerResult");

const progressSection = document.getElementById("progressSection");
const progressContainer = document.getElementById("progressContainer");

if (progressSection) {
    progressSection.style.display = "none";
}


// ===============================
// PDF VARIABLES
// ===============================

let pdfText = "";
let pdfChunks = [];
let pdfEmbeddings = [];


// ===============================
// PDF TEXT CHUNKING
// ===============================

function createPDFChunks(text, chunkSize = 300, overlap = 50) {
    const words = text
        .split(/\s+/)
        .filter(word => word.trim() !== "");

    const chunks = [];

    const step = chunkSize - overlap;

    for (let i = 0; i < words.length; i += step) {
        const chunk = words
            .slice(i, i + chunkSize)
            .join(" ");

        if (chunk.trim() !== "") {
            chunks.push(chunk);
        }
    }

    return chunks;
}


// ===============================
// GENERATE EMBEDDING
// ===============================

async function generateEmbedding(text) {

    try {

        const response = await fetch(
            "https://openrouter.ai/api/v1/embeddings",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${API_KEY}`
                },

                body: JSON.stringify({
                    model: "openai/text-embedding-3-small",
                    input: text,
                    encoding_format: "float"
                })
            }
        );

        const data = await response.json();

        console.log("EMBEDDING RESPONSE:", data);

        if (!response.ok) {

            throw new Error(
                data.error?.message ||
                "Failed to generate embedding"
            );
        }

        if (
            !data.data ||
            !data.data[0] ||
            !data.data[0].embedding
        ) {

            throw new Error(
                "No embedding received from API"
            );
        }

        return data.data[0].embedding;

    } catch (error) {

        console.error("Embedding Error:", error);

        throw error;
    }
}


// ===============================
// GENERATE PDF CHUNK EMBEDDINGS
// ===============================

async function generatePDFEmbeddings() {

    pdfEmbeddings = [];

    if (
        !Array.isArray(pdfChunks) ||
        pdfChunks.length === 0
    ) {

        console.log(
            "No PDF chunks available for embeddings."
        );

        return;
    }

    console.log(
        "========== GENERATING PDF EMBEDDINGS =========="
    );

    for (
        let i = 0;
        i < pdfChunks.length;
        i++
    ) {

        console.log(
            `Generating embedding ${i + 1} of ${pdfChunks.length}...`
        );

        const embedding =
            await generateEmbedding(
                pdfChunks[i]
            );

        pdfEmbeddings.push(embedding);
    }

    console.log(
        "PDF embeddings generated:",
        pdfEmbeddings.length
    );

    console.log(
        "First embedding length:",
        pdfEmbeddings[0]?.length
    );

    console.log(
        "==============================================="
    );
}
function cosineSimilarity(vectorA, vectorB) {
    if (!Array.isArray(vectorA) || !Array.isArray(vectorB)) {
        throw new Error("Both inputs must be arrays.");
    }

    if (vectorA.length !== vectorB.length) {
        throw new Error("Vectors must have the same length.");
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vectorA.length; i++) {
        dotProduct += vectorA[i] * vectorB[i];
        magnitudeA += vectorA[i] * vectorA[i];
        magnitudeB += vectorB[i] * vectorB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
        return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
}
async function findSemanticRelevantChunks(query, maxChunks = 3) {

    if (!query || typeof query !== "string") {
        return [];
    }

    if (!Array.isArray(pdfChunks) || pdfChunks.length === 0) {
        return [];
    }

    if (!Array.isArray(pdfEmbeddings) || pdfEmbeddings.length === 0) {
        return [];
    }

    console.log("Generating embedding for user question...");

    const queryEmbedding =
        await generateEmbedding(query);

    // ===============================
    // STOP WORDS
    // ===============================

    const stopWords = new Set([
        "what",
        "is",
        "the",
        "a",
        "an",
        "of",
        "and",
        "to",
        "in",
        "for",
        "on",
        "with",
        "how",
        "why",
        "when",
        "where",
        "who",
        "which",
        "are",
        "was",
        "were",
        "be",
        "this",
        "that"
    ]);

    // ===============================
    // QUERY WORDS
    // ===============================

    const queryWords = query
        .toLowerCase()
        .split(/\W+/)
        .filter(word =>
            word.length > 2 &&
            !stopWords.has(word)
        );

    console.log("QUERY WORDS:", queryWords);

    // ===============================
    // SCORE EVERY PDF CHUNK
    // ===============================

    const scoredChunks = pdfChunks.map(
        (chunk, index) => {

            // -----------------------------
            // 1. Semantic similarity
            // -----------------------------

            const similarity =
                cosineSimilarity(
                    queryEmbedding,
                    pdfEmbeddings[index]
                );

            // -----------------------------
            // 2. Keyword matching
            // -----------------------------

            const chunkWords = chunk
                .toLowerCase()
                .split(/\W+/)
                .filter(word => word.length > 2);

            let keywordMatches = 0;

            queryWords.forEach(word => {

                if (chunkWords.includes(word)) {
                    keywordMatches++;
                }

            });

            const keywordScore =
                queryWords.length > 0
                    ? keywordMatches / queryWords.length
                    : 0;

            // -----------------------------
            // 3. Hybrid score
            // -----------------------------

            const hybridScore =
                (similarity * 0.8) +
                (keywordScore * 0.2);

            return {
                index: index,
                text: chunk,
                similarity: similarity,
                keywordScore: keywordScore,
                hybridScore: hybridScore
            };

        }
    );

    // ===============================
    // SORT BY HYBRID SCORE
    // ===============================

    scoredChunks.sort(
        (a, b) =>
            b.hybridScore - a.hybridScore
    );

    // ===============================
    // DISPLAY RESULTS
    // ===============================

    console.log(
        "========== HYBRID SEARCH RESULTS =========="
    );

    scoredChunks.forEach(chunk => {

        console.log(
            `Chunk ${chunk.index} | ` +
            `Semantic: ${(chunk.similarity * 100).toFixed(1)}% | ` +
            `Keyword: ${(chunk.keywordScore * 100).toFixed(1)}% | ` +
            `Hybrid: ${(chunk.hybridScore * 100).toFixed(1)}%`
        );

    });

    // ===============================
    // SIMILARITY THRESHOLD
    // ===============================

    const similarityThreshold = 0.40;

    const relevantChunks =
        scoredChunks
            .filter(
                chunk =>
                    chunk.similarity >=
                    similarityThreshold
            )
            .slice(0, maxChunks);

    console.log(
        "Chunks passing threshold:",
        relevantChunks
    );

    return relevantChunks;
}

// ===============================
// FIND RELEVANT PDF CHUNKS
// ===============================

function findRelevantChunks(
    query,
    chunks,
    maxChunks = 2
) {

    if (typeof query !== "string") {

        console.error(
            "RAG Error: query must be a string:",
            query
        );

        return [];
    }

    if (
        !Array.isArray(chunks) ||
        chunks.length === 0
    ) {

        return [];
    }

    // Convert question into important words
    const stopWords = new Set([
    "what",
    "is",
    "the",
    "a",
    "an",
    "of",
    "and",
    "to",
    "in",
    "for",
    "on",
    "with",
    "how",
    "why",
    "when",
    "where",
    "who",
    "which",
    "are",
    "was",
    "were",
    "be",
    "this",
    "that"
]);

const queryWords = query
    .toLowerCase()
    .split(/\W+/)
    .filter(word =>
        word.length > 2 &&
        !stopWords.has(word)
    );
    console.log("QUERY WORDS:", queryWords);

    if (queryWords.length === 0) {
        return [];
    }

    const scoredChunks = chunks.map(
        (chunk, index) => {

            const chunkWords = chunk
                .toLowerCase()
                .split(/\W+/)
                .filter(word => word.length > 2);

            let score = 0;

            queryWords.forEach(word => {

                if (chunkWords.includes(word)) {
                    score++;
                }

            });

            // Calculate similarity
            const similarity =
                score / queryWords.length;

            return {
                index: index,
                text: chunk,
                score: score,
                similarity: similarity
            };
        }
    );

    // Highest similarity first
    scoredChunks.sort(
        (a, b) =>
            b.similarity - a.similarity
    );

    // Return useful chunks
    return scoredChunks
        .filter(chunk => chunk.score > 0)
        .slice(0, maxChunks);
}


// ===============================
// TYPING EFFECT
// ===============================

function typeMessage(element, text) {

    let index = 0;

    const speed =
        text.length > 1000 ? 1 : 5;

    element.textContent = "";

    const interval = setInterval(() => {

        element.textContent =
            text.slice(0, index + 1);

        index++;

        messages.scrollTop =
            messages.scrollHeight;

        if (index >= text.length) {

            clearInterval(interval);

            if (
                typeof marked !== "undefined"
            ) {

                element.innerHTML =
                    marked.parse(text);

            } else {

                element.textContent =
                    text;
            }
        }

    }, speed);
}


// ===============================
// SEND MESSAGE
// ===============================

async function sendMessage() {

    const text =
        promptInput.value.trim();

    if (text === "") {
        return;
    }


    // ===============================
    // SHOW USER MESSAGE
    // ===============================

    const userMessage =
        document.createElement("div");

    userMessage.className =
        "message user";

    userMessage.innerText =
        text;

    messages.appendChild(
        userMessage
    );


    // Clear input
    promptInput.value = "";


    // ===============================
    // ADD USER MESSAGE TO MEMORY
    // ===============================

    conversation.push({
        role: "user",
        content: text
    });


    // ===============================
    // SHOW THINKING MESSAGE
    // ===============================

    const aiMessage =
        document.createElement("div");

    aiMessage.className =
        "message ai";

    aiMessage.innerText =
        "Thinking...";

    messages.appendChild(
        aiMessage
    );

    messages.scrollTop =
        messages.scrollHeight;


    // ===============================
    // PREPARE MESSAGES FOR AI
    // ===============================

    let messagesToSend =
        [...conversation];


    // ===============================
    // RAG PDF RETRIEVAL
    // ===============================

    if (pdfChunks.length > 0) {

        const relevantChunks = await findSemanticRelevantChunks(text, 3);


        console.log(
            "========== RAG =========="
        );

        console.log(
            "User question:",
            text
        );

        console.log(
            "Total PDF chunks:",
            pdfChunks.length
        );


        relevantChunks.forEach(
            chunk => {

                console.log(
    `Chunk ${chunk.index} | Similarity: ${(chunk.similarity * 100).toFixed(1)}%`
);

            }
        );


        console.log(
            "Retrieved chunks:",
            relevantChunks
        );
        console.log("========== RETRIEVED TEXT ==========");

relevantChunks.forEach((chunk, index) => {
    console.log(`--- Retrieved Chunk ${index + 1} ---`);
    console.log(chunk.text);
});

console.log("====================================");

        console.log(
            "========================="
        );


        if (
            relevantChunks.length > 0
        ) {

            const retrievedText =
                relevantChunks
                    .map(chunk => chunk.text)
                    .join("\n\n");


            messagesToSend.splice(
                1,
                0,
                {
                    role: "system",

                    content: `
Use the following relevant sections from the uploaded study notes
to answer the student's question.

IMPORTANT:
- Answer using the provided notes.
- Do not invent information.
- If the answer cannot be found in these retrieved sections,
  clearly say that the information is not available in the uploaded notes.

Retrieved study notes:

${retrievedText}
`
                }
            );

        } else {

            messagesToSend.splice(
                1,
                0,
                {
                    role: "system",

                    content: `
The uploaded study notes do not contain information relevant
to the student's question.

Clearly tell the student that the answer is not available
in the uploaded notes.
`
                }
            );
        }
    }


    // ===============================
    // CALL AI
    // ===============================

    try {

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
                            messagesToSend

                    })
                }
            );


        const data =
            await response.json();

        console.log(
            "API RESPONSE:",
            data
        );


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
            data.choices[0]
                .message
                .content;


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

        const file =
            pdfUpload.files[0];


        // No file selected
        if (!file) {

            fileName.innerText =
                "No file selected";

            pdfPreview.innerText =
                "Your extracted notes will appear here.";

            pdfText = "";
            pdfChunks = [];
            pdfEmbeddings = [];

            return;
        }


        // Check file type
        if (
            file.type !== "application/pdf"
        ) {

            fileName.innerText =
                "❌ Please select a PDF file.";

            pdfText = "";
            pdfChunks = [];
            pdfEmbeddings = [];

            return;
        }


        // ===============================
        // SHOW LOADING
        // ===============================

        fileName.innerText =
            "📖 Reading " +
            file.name +
            "...";

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
                await pdfjsLib
                    .getDocument({
                        data: arrayBuffer
                    })
                    .promise;


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
                        .map(
                            item => item.str
                        )
                        .join(" ");


                extractedText +=
                    pageText +
                    "\n\n";
            }


            // ===============================
            // STORE PDF TEXT
            // ===============================

            pdfText =
                extractedText;


            // ===============================
            // CREATE PDF CHUNKS
            // ===============================

            pdfChunks =
                createPDFChunks(
                    pdfText
                );


            console.log(
                "PDF chunks created:",
                pdfChunks.length
            );


            // ===============================
            // GENERATE EMBEDDINGS
            // ===============================

            await generatePDFEmbeddings();


            // ===============================
            // UPDATE FILE NAME
            // ===============================

            fileName.innerText =
                `✅ ${file.name} loaded (${pdf.numPages} pages)`;


            // ===============================
            // SHOW PDF PREVIEW
            // ===============================

            if (
                pdfText.trim() === ""
            ) {

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

            pdfText = "";
            pdfChunks = [];
            pdfEmbeddings = [];

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

        if (
            pdfText.trim() === ""
        ) {

            alert(
                "Please upload a PDF first."
            );

            return;
        }


        summarizeBtn.disabled =
            true;

        summarizeBtn.innerText =
            "⏳ Summarizing...";


        const userMessage =
            document.createElement("div");

        userMessage.className =
            "message user";

        userMessage.innerText =
            "✨ Summarize my uploaded notes.";

        messages.appendChild(
            userMessage
        );


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


            const data =
                await response.json();


            console.log(
                "SUMMARY RESPONSE:",
                data
            );


            if (!response.ok) {

                throw new Error(
                    data.error?.message ||
                    "Summary request failed"
                );
            }


            if (
                !data.choices ||
                data.choices.length === 0
            ) {

                throw new Error(
                    "No summary received"
                );
            }


            const summary =
                data.choices[0]
                    .message
                    .content;


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

        if (
            pdfText.trim() === ""
        ) {

            alert(
                "Please upload a PDF first."
            );

            return;
        }


        quizBtn.disabled =
            true;

        quizBtn.innerText =
            "⏳ Generating...";


        quizContainer.innerHTML = `
            <div class="loading">
                🧠 Creating your quiz...
            </div>
        `;


        try {

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


            const data =
                await response.json();


            console.log(
                "QUIZ RESPONSE:",
                data
            );


            if (!response.ok) {

                throw new Error(
                    data.error?.message ||
                    "Quiz generation failed"
                );
            }


            if (
                !data.choices ||
                data.choices.length === 0
            ) {

                throw new Error(
                    "No quiz received"
                );
            }


            let quizText =
                data.choices[0]
                    .message
                    .content;


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


            const quiz =
                JSON.parse(
                    quizText
                );


            console.log(
                "QUIZ:",
                quiz
            );


            currentQuiz =
                quiz;

            currentQuestion =
                0;

            userAnswers =
                new Array(
                    currentQuiz.length
                ).fill(null);


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

    if (
        currentQuiz.length === 0
    ) {

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


                    userAnswers[
                        currentQuestion
                    ] =
                        selectedOption;


                    options.forEach(
                        function (button) {

                            button.classList.remove(
                                "selected"
                            );

                        }
                    );


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
                    userAnswers[
                        currentQuestion
                    ] === null
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
                    userAnswers[
                        currentQuestion
                    ] === null
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


// ===============================
// STUDY PLANNER
// ===============================

async function generateStudyPlan() {

    const subject =
        subjectInput.value.trim();

    const examDate =
        examDateInput.value;

    const topics =
        topicsInput.value.trim();

    const studyHours =
        studyHoursInput.value;

    const priority =
        priorityInput.value;


    if (
        !subject ||
        !examDate ||
        !topics ||
        !studyHours
    ) {

        alert(
            "Please fill in all planner fields."
        );

        return;
    }


    generatePlanBtn.disabled =
        true;

    generatePlanBtn.textContent =
        "🤖 Generating Plan...";


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

Priority rules:
- If priority is "high", give more revision and exam-practice time.
- If priority is "weak", allocate more time to difficult/weak topics.
- If priority is "balanced", distribute study time evenly.
`;


    try {

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

                        messages: [

                            {
                                role: "system",

                                content:
                                    "You are an expert academic study planner. Create realistic and structured study schedules for engineering students."
                            },

                            {
                                role: "user",

                                content:
                                    plannerPrompt
                            }

                        ]

                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error?.message ||
                "Failed to generate study plan."
            );
        }


        if (
            !data.choices ||
            !data.choices[0]
        ) {

            throw new Error(
                "No response received from AI."
            );
        }


        const plan =
            data.choices[0]
                .message
                .content;


        plannerResult.innerHTML = `
            <div class="plan-output">
                ${marked.parse(plan)}
            </div>
        `;


        createProgressTracker();

    }

    catch (error) {

        console.error(
            "Planner Error:",
            error
        );


        plannerResult.innerHTML = `
            <div class="plan-output">
                <strong>❌ Error:</strong>
                ${error.message}
            </div>
        `;
    }


    finally {

        generatePlanBtn.disabled =
            false;

        generatePlanBtn.textContent =
            "🤖 Generate Study Plan";
    }

}


generatePlanBtn.addEventListener(
    "click",
    generateStudyPlan
);


// ===============================
// STUDY PROGRESS TRACKING
// ===============================

let topicProgress =
    JSON.parse(
        localStorage.getItem(
            "studyProgress"
        )
    ) || {};


// ===============================
// CREATE PROGRESS TRACKER
// ===============================

function createProgressTracker() {

    const topicsText =
        topicsInput.value.trim();


    if (!topicsText) {
        return;
    }


    const topics =
        topicsText
            .split(",")
            .map(
                topic => topic.trim()
            )
            .filter(
                topic => topic !== ""
            );


    if (!progressSection) {
        return;
    }


    progressSection.style.display =
        "block";


    progressContainer.innerHTML =
        "";


    topics.forEach(
        (topic, index) => {

            if (
                topicProgress[topic] ===
                undefined
            ) {

                topicProgress[topic] =
                    0;
            }


            const progressItem =
                document.createElement(
                    "div"
                );


            progressItem.className =
                "progress-item";


            progressItem.innerHTML = `

                <div class="progress-topic">

                    <span>
                        ${topic}
                    </span>

                    <select
                        class="progress-select"
                        data-topic="${index}"
                    >

                        <option value="0">
                            Not Started
                        </option>

                        <option value="50">
                            In Progress
                        </option>

                        <option value="100">
                            Completed
                        </option>

                    </select>

                </div>


                <div class="topic-progress-bar">

                    <div
                        class="topic-progress-fill"
                        id="topicProgress${index}"
                    ></div>

                </div>

            `;


            progressContainer.appendChild(
                progressItem
            );


            const select =
                progressItem.querySelector(
                    ".progress-select"
                );


            select.value =
                topicProgress[topic];


            select.addEventListener(
                "change",
                function () {

                    topicProgress[topic] =
                        Number(
                            this.value
                        );


                    localStorage.setItem(
                        "studyProgress",
                        JSON.stringify(
                            topicProgress
                        )
                    );


                    updateProgress();

                }
            );


            updateTopicProgress(
                index,
                topicProgress[topic]
            );

        }
    );


    updateProgress();

}


// ===============================
// UPDATE TOPIC PROGRESS
// ===============================

function updateTopicProgress(
    index,
    value
) {

    const progressBar =
        document.getElementById(
            `topicProgress${index}`
        );


    if (progressBar) {

        progressBar.style.width =
            `${value}%`;
    }

}


// ===============================
// UPDATE OVERALL PROGRESS
// ===============================

function updateProgress() {

    const values =
        Object.values(
            topicProgress
        );


    if (values.length === 0) {
        return;
    }


    const total =
        values.reduce(
            (sum, value) =>
                sum + value,
            0
        );


    const average =
        Math.round(
            total / values.length
        );


    const progressPercentage =
        document.getElementById(
            "progressPercentage"
        );


    const overallProgressBar =
        document.getElementById(
            "overallProgressBar"
        );


    if (progressPercentage) {

        progressPercentage.textContent =
            `${average}%`;
    }


    if (overallProgressBar) {

        overallProgressBar.style.width =
            `${average}%`;
    }

}

async function testQuestionEmbedding() {
    const question = "What is inheritance?";

    console.log("Generating question embedding...");

    const embedding = await generateEmbedding(question);

    console.log("Question embedding generated!");
    console.log("Embedding length:", embedding.length);
    console.log("First 10 values:", embedding.slice(0, 10));
}
testQuestionEmbedding();