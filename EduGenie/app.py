from flask import Flask, render_template, request, jsonify
from google import genai
from dotenv import load_dotenv
from pypdf import PdfReader
import os

# ==========================================
# LOAD ENVIRONMENT VARIABLES
# ==========================================

load_dotenv()

app = Flask(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("ERROR: GEMINI_API_KEY not found in .env")
else:
    print("Gemini API key loaded successfully.")

# Create Gemini client
client = genai.Client(api_key=GEMINI_API_KEY)


# ==========================================
# GEMINI MODELS
# ==========================================

MODELS = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash"
]


# ==========================================
# GEMINI FUNCTION
# ==========================================

def ask_gemini(prompt):

    last_error = None

    for model in MODELS:

        try:
            print("Trying model:", model)

            response = client.models.generate_content(
                model=model,
                contents=prompt
            )

            print("Gemini response received.")

            return response.text

        except Exception as e:

            last_error = e

            print("Gemini error:", repr(e))

            error_text = str(e)

            if (
                "503" in error_text
                or "UNAVAILABLE" in error_text
                or "429" in error_text
                or "RESOURCE_EXHAUSTED" in error_text
            ):
                print("Trying next Gemini model...")
                continue

            raise e

    raise last_error


# ==========================================
# HOME PAGE
# ==========================================

@app.route("/")
def home():
    return render_template("index.html")


# ==========================================
# AI ASSISTANT
# ==========================================

@app.route("/ask", methods=["POST"])
def ask():

    data = request.get_json() or {}

    question = data.get("question", "").strip()

    if not question:
        return jsonify({
            "answer": "Please enter a question."
        }), 400

    prompt = f"""
You are EduGenie, an AI learning assistant for college students.

Answer the student's question clearly and accurately.

Instructions:
- Use simple language.
- Explain step by step when necessary.
- Give examples when useful.
- Keep the answer educational.
- Do not use Markdown.
- Do not use ###.
- Do not use **.

Student question:

{question}
"""

    try:

        answer = ask_gemini(prompt)

        return jsonify({
            "answer": answer
        })

    except Exception as e:

        print("AI ASSISTANT ERROR:", repr(e))

        return jsonify({
            "answer": "Gemini is temporarily unavailable. Please try again."
        }), 503


# ==========================================
# QUIZ
# ==========================================

@app.route("/quiz", methods=["POST"])
def quiz():

    data = request.get_json() or {}

    topic = data.get("topic", "").strip()
    difficulty = data.get("difficulty", "Medium")
    count = data.get("count", 5)

    if not topic:
        return jsonify({
            "quiz": "Please enter a topic."
        }), 400

    try:
        count = int(count)
    except:
        count = 5

    if count < 1:
        count = 1

    if count > 20:
        count = 20

    prompt = f"""
You are EduGenie, an AI learning assistant.

Create a multiple-choice quiz for college students.

Topic: {topic}

Difficulty: {difficulty}

Number of questions: {count}

Use exactly this format:

Question 1: question
A) option
B) option
C) option
D) option
Answer: A

Question 2: question
A) option
B) option
C) option
D) option
Answer: B

Continue until you create exactly {count} questions.

Rules:
- Every question must have four options.
- Only one answer must be correct.
- Clearly show the correct answer.
- Questions must be related to the topic.
- Use simple language.
- Do not use Markdown.
"""

    try:

        quiz_text = ask_gemini(prompt)

        return jsonify({
            "quiz": quiz_text
        })

    except Exception as e:

        print("QUIZ ERROR:", repr(e))

        return jsonify({
            "quiz": "Gemini is temporarily unavailable. Please try again."
        }), 503


# ==========================================
# NOTES
# ==========================================

@app.route("/notes", methods=["POST"])
def notes():

    data = request.get_json() or {}

    topic = data.get("topic", "").strip()

    if not topic:
        return jsonify({
            "notes": "Please enter a topic."
        }), 400

    prompt = f"""
You are EduGenie, an AI learning assistant.

Create study notes for:

{topic}

Include:
1. Definition
2. Important concepts
3. Key points
4. Examples
5. Short conclusion

Use simple language suitable for college students.

Do not use Markdown.
Do not use ###.
Do not use **.
"""

    try:

        notes_text = ask_gemini(prompt)

        return jsonify({
            "notes": notes_text
        })

    except Exception as e:

        print("NOTES ERROR:", repr(e))

        return jsonify({
            "notes": "Gemini is temporarily unavailable. Please try again."
        }), 503


# ==========================================
# PDF SUMMARY
# ==========================================

@app.route("/summarize-pdf", methods=["POST"])
def summarize_pdf():

    if "file" not in request.files:
        return jsonify({
            "summary": "Please upload a PDF file."
        }), 400

    pdf_file = request.files["file"]

    if pdf_file.filename == "":
        return jsonify({
            "summary": "Please select a PDF file."
        }), 400

    if not pdf_file.filename.lower().endswith(".pdf"):
        return jsonify({
            "summary": "Only PDF files are supported."
        }), 400

    try:

        reader = PdfReader(pdf_file)

        text = ""

        for page in reader.pages:

            page_text = page.extract_text()

            if page_text:
                text += page_text + "\n"

        if not text.strip():
            return jsonify({
                "summary": "No readable text was found in the PDF."
            }), 400

        # Limit text sent to Gemini
        text = text[:30000]

        prompt = f"""
You are EduGenie, an AI learning assistant.

Summarize the following PDF content for a college student.

Requirements:
- Identify the main topic.
- Explain the important concepts.
- List the key points.
- Keep the explanation simple.
- Do not invent information.
- Do not use Markdown.
- Do not use ###.
- Do not use **.

PDF CONTENT:

{text}
"""

        summary = ask_gemini(prompt)

        return jsonify({
            "summary": summary
        })

    except Exception as e:

        print("PDF ERROR:", repr(e))

        return jsonify({
            "summary": "Gemini could not summarize the PDF right now."
        }), 503


# ==========================================
# TEST ROUTE
# ==========================================

@app.route("/test")
def test():

    return jsonify({
        "status": "EduGenie is running",
        "gemini_api_key_loaded": bool(GEMINI_API_KEY)
    })


# ==========================================
# START FLASK
# ==========================================

if __name__ == "__main__":

    print()
    print("======================================")
    print("       EduGenie AI Learning Assistant")
    print("======================================")

    if GEMINI_API_KEY:
        print("Gemini API Key: Loaded")
    else:
        print("Gemini API Key: NOT FOUND")

    print("Server: http://127.0.0.1:5000")
    print("======================================")
    print()

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )