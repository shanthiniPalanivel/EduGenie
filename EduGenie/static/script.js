document.addEventListener("DOMContentLoaded", () => {

    const questionInput = document.getElementById("question");

    if (questionInput) {

        questionInput.addEventListener("keydown", (event) => {

            if (event.key === "Enter" && event.ctrlKey) {

                event.preventDefault();
                askQuestion();

            }

        });

    }

});


// ========================================
// ASK EDUGENIE
// ========================================

async function askQuestion() {

    const questionInput = document.getElementById("question");
    const answerBox = document.getElementById("answer");
    const askButton = document.querySelector(".ask-btn");

    const question = questionInput.value.trim();

    if (!question) {

        answerBox.innerHTML = `
            <span class="error-message">
                Please enter a question first.
            </span>
        `;

        questionInput.focus();
        return;
    }

    answerBox.innerHTML = `
        <div class="loading">
            <span class="loader"></span>
            <span>EduGenie is thinking...</span>
        </div>
    `;

    askButton.disabled = true;
    askButton.innerText = "Generating...";

    try {

        const response = await fetch("/ask", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                question: question
            })

        });

        if (!response.ok) {
            throw new Error("Server error");
        }

        const data = await response.json();

        if (data.answer) {

            answerBox.innerHTML = formatAnswer(data.answer);

        } else {

            answerBox.innerHTML = `
                <span class="error-message">
                    No answer was received.
                </span>
            `;

        }

    } catch (error) {

        console.error("EduGenie Error:", error);

        answerBox.innerHTML = `
            <div class="error-message">
                <strong>Something went wrong.</strong>
                <br>
                Please try again.
            </div>
        `;

    } finally {

        askButton.disabled = false;
        askButton.innerText = "Ask EduGenie";

    }

}


// ========================================
// SHOW DASHBOARD
// ========================================

function showDashboard() {

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


// ========================================
// SHOW AI ASSISTANT
// ========================================

function showAssistant() {

    const assistant = document.getElementById("assistant");

    if (!assistant) return;

    assistant.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    setTimeout(() => {

        const questionInput = document.getElementById("question");

        if (questionInput) {
            questionInput.focus();
        }

    }, 500);

}


// ========================================
// SHOW QUIZ
// ========================================

function showQuiz() {

    const quizSection = document.getElementById("quiz");

    if (!quizSection) return;

    quizSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


// ========================================
// SHOW NOTES
// ========================================

function showNotes() {

    const notesSection = document.getElementById("notes");

    if (!notesSection) return;

    notesSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


// ========================================
// GENERATE QUIZ
// ========================================

async function generateQuiz() {

    const topicInput = document.getElementById("quizTopic");
    const difficultyInput = document.getElementById("quizDifficulty");
    const countInput = document.getElementById("quizCount");

    const resultBox = document.getElementById("quizResult");
    const generateButton = document.querySelector(".quiz-btn");

    const topic = topicInput.value.trim();
    const difficulty = difficultyInput.value;
    const count = countInput.value;


    // Check topic
    if (!topic) {

        resultBox.innerHTML = `
            <div class="error-message">
                Please enter a topic first.
            </div>
        `;

        topicInput.focus();
        return;
    }


    // Loading message
    resultBox.innerHTML = `
        <div class="loading">
            <span class="loader"></span>
            <span>EduGenie is creating your quiz...</span>
        </div>
    `;

    generateButton.disabled = true;
    generateButton.innerText = "Generating...";


    try {

        const response = await fetch("/quiz", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                topic: topic,
                difficulty: difficulty,
                count: count

            })

        });


        if (!response.ok) {
            throw new Error("Quiz generation failed");
        }


        const data = await response.json();


        if (data.quiz) {

            resultBox.innerHTML = `
                <h3>📋 Your AI Generated Quiz</h3>

                <div class="ai-response">
                    ${formatQuiz(data.quiz)}
                </div>
            `;

        } else {

            resultBox.innerHTML = `
                <div class="error-message">
                    Unable to generate quiz.
                </div>
            `;

        }


    } catch (error) {

        console.error("Quiz Error:", error);

        resultBox.innerHTML = `
            <div class="error-message">
                <strong>Something went wrong.</strong>
                <br>
                Please try generating the quiz again.
            </div>
        `;

    } finally {

        generateButton.disabled = false;
        generateButton.innerText = "Generate Quiz";

    }

}


// ========================================
// FORMAT QUIZ
// ========================================

function formatQuiz(text) {
    const lines = text.split("\n");
    let html = "";
    let questionNumber = 0;

    lines.forEach(line => {
        line = line.trim();

        if (!line) return;

        // Question
        if (/^Question\s+\d+:/i.test(line)) {
            questionNumber++;

            const question = line.replace(/^Question\s+\d+:\s*/i, "");

            html += `
                <div class="quiz-card">
                    <h3>Question ${questionNumber}</h3>
                    <p class="quiz-question">${escapeHTML(question)}</p>
            `;
        }

        // Options
        else if (/^[A-D]\)/.test(line)) {
            const optionLetter = line.charAt(0);
            const optionText = line.substring(2).trim();

            html += `
                <label class="quiz-option">
                    <input type="radio"
                           name="question${questionNumber}"
                           value="${optionLetter}">
                    <span>${optionLetter}) ${escapeHTML(optionText)}</span>
                </label>
            `;
        }

        // Answer
        else if (/^Answer:/i.test(line)) {
            const answer = line.replace(/^Answer:\s*/i, "");

            html += `
                <input type="hidden"
                       class="correct-answer"
                       data-question="${questionNumber}"
                       value="${escapeHTML(answer)}">
            `;

            html += `</div>`;
        }
    });

    html += `
        <button class="submit-quiz-btn" onclick="submitQuiz()">
            Submit Quiz
        </button>

        <div id="quizScore"></div>
    `;

    return html;
}
function submitQuiz() {

    const questions = document.querySelectorAll(".quiz-card");
    let score = 0;
    let answered = 0;

    questions.forEach((question, index) => {

        const selected = question.querySelector(
            `input[name="question${index + 1}"]:checked`
        );

        const correctAnswer = question.querySelector(".correct-answer");

        if (selected) {
            answered++;

            if (selected.value.toUpperCase() ===
                correctAnswer.value.trim().toUpperCase()) {

                score++;

                question.classList.add("correct");
            } else {
                question.classList.add("wrong");
            }
        }
    });

    if (answered < questions.length) {
        alert("Please answer all questions before submitting.");
        return;
    }

    const scoreBox = document.getElementById("quizScore");

    scoreBox.innerHTML = `
        <div class="score-card">
            <h2>🎉 Quiz Completed!</h2>
            <p>Your Score</p>
            <strong>${score} / ${questions.length}</strong>
        </div>
    `;
    
saveQuizScore(score, questions.length);

    // Disable options after submission
    document.querySelectorAll(".quiz-option input").forEach(input => {
        input.disabled = true;
    });
}

// ========================================
// FORMAT AI ANSWER
// ========================================

function formatAnswer(text) {

    let formatted = escapeHTML(text);

    formatted = formatted.replace(/\n/g, "<br>");

    return `
        <div class="ai-response">
            ${formatted}
        </div>
    `;

}


// ========================================
// SECURITY
// ========================================

function escapeHTML(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}


// ========================================
// CLEAR QUESTION
// ========================================

function clearQuestion() {

    const questionInput = document.getElementById("question");
    const answerBox = document.getElementById("answer");

    if (!questionInput || !answerBox) return;

    questionInput.value = "";

    answerBox.innersaveQuizHTML = `
        Your AI-generated answer will appear here.
    `;

    questionInput.focus();

}


// ========================================
// ESC KEY
// ========================================

document.addEventListener("keydown", (event) => {

    if (event.key === "Escape") {

        clearQuestion();

    }

});
document.addEventListener("DOMContentLoaded", function () {

    const notesButton = document.getElementById("generateNotesBtn");

    if (notesButton) {

        notesButton.addEventListener("click", generateNotes);

    }

});


async function generateNotes() {

    const topicInput = document.getElementById("notesTopic");
    const resultBox = document.getElementById("notesResult");
    const button = document.getElementById("generateNotesBtn");

    const topic = topicInput.value.trim();

    if (!topic) {
        resultBox.innerHTML = `
            <div class="error-message">
                Please enter a topic first.
            </div>
        `;
        topicInput.focus();
        return;
    }

    resultBox.innerHTML = `
        <div class="loading">
            EduGenie is preparing your notes...
        </div>
    `;

    button.disabled = true;
    button.innerText = "Generating...";

    try {

        const response = await fetch("/notes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                topic: topic
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.notes || "Notes generation failed");
        }

        resultBox.innerHTML = `
            <div class="ai-response">
                ${formatAnswer(data.notes)}
            </div>
        `;

    } catch (error) {

        console.error("Notes Error:", error);

        resultBox.innerHTML = `
            <div class="error-message">
                ${error.message}
            </div>
        `;

    } finally {

        button.disabled = false;
        button.innerText = "Generate Notes";

    }
}
function showPDF() {
    document.getElementById("pdf").scrollIntoView({
        behavior: "smooth"
    });
}
document.addEventListener("DOMContentLoaded", function () {

    const pdfButton = document.getElementById("summarizePdfBtn");

    if (pdfButton) {
        pdfButton.addEventListener("click", summarizePDF);
    }

});


async function summarizePDF() {

    const fileInput = document.getElementById("pdfFile");
    const resultBox = document.getElementById("pdfResult");
    const button = document.getElementById("summarizePdfBtn");

    if (!fileInput.files.length) {
        resultBox.innerHTML = `
            <div class="error-message">
                Please select a PDF file first.
            </div>
        `;
        return;
    }

    const file = fileInput.files[0];

    if (file.type !== "application/pdf") {
        resultBox.innerHTML = `
            <div class="error-message">
                Please select a PDF file.
            </div>
        `;
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    resultBox.innerHTML = `
        <div class="loading">
            📄 EduGenie is reading your PDF...
        </div>
    `;

    button.disabled = true;
    button.innerText = "Summarizing...";

    try {

        const response = await fetch("/summarize-pdf", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.summary || "PDF summarization failed.");
        }

        resultBox.innerHTML = `
            <div class="ai-response">
                ${formatAnswer(data.summary)}
            </div>
        `;

    } catch (error) {

        console.error("PDF Error:", error);

        resultBox.innerHTML = `
            <div class="error-message">
                ${error.message}
            </div>
        `;

    } finally {

        button.disabled = false;
        button.innerText = "Summarize PDF";

    }
}
function showProgress() {
    document.getElementById("progress").scrollIntoView({
        behavior: "smooth"
    });

    updateProgress();
}


function updateProgress() {

    const scores = JSON.parse(
        localStorage.getItem("edugenieScores") || "[]"
    );

    const completed = scores.length;

    let average = 0;
    let best = 0;

    if (completed > 0) {

        const percentages = scores.map(score => score.percentage);

        average = Math.round(
            percentages.reduce((a, b) => a + b, 0) / completed
        );

        best = Math.max(...percentages);
    }

    document.getElementById("quizCompleted").innerText = completed;
    document.getElementById("averageScore").innerText = average + "%";
    document.getElementById("bestScore").innerText = best + "%";
}


function saveQuizScore(score, total) {

    const percentage = Math.round((score / total) * 100);

    const scores = JSON.parse(
        localStorage.getItem("edugenieScores") || "[]"
    );

    scores.push({
        score: score,
        total: total,
        percentage: percentage
    });

    localStorage.setItem(
        "edugenieScores",
        JSON.stringify(scores)
    );

    updateProgress();

    saveActivity(
        "📝",
        "Quiz Completed",
        `You scored ${score}/${total}`
    );
}
function updateActivity() {

    const activities = JSON.parse(
        localStorage.getItem("edugenieActivity") || "[]"
    );
    const activityList = document.getElementById("activityList");

    if (!activityList) {
        return;
    }

    if (activities.length === 0) {

        activityList.innerHTML = `
            <div class="no-activity">
                No recent activity yet.
            </div>
        `;

        return;
    }

    activityList.innerHTML = activities
        .slice(0, 5)
        .map(activity => `
            <div class="activity-item">

                <div class="activity-icon">
                    ${activity.icon}
                </div>

                <div class="activity-info">
                    <strong>${activity.title}</strong>
                    <p>${activity.description}</p>
                </div>

            </div>
        `)
        .join("");
}


function saveActivity(icon, title, description) {

    const activities = JSON.parse(
        localStorage.getItem("edugenieActivity") || "[]"
    );

    activities.unshift({
        icon: icon,
        title: title,
        description: description
    });

    localStorage.setItem(
        "edugenieActivity",
        JSON.stringify(activities.slice(0, 10))
    );

    updateActivity();
}


document.addEventListener("DOMContentLoaded", function () {
    updateActivity();
});
