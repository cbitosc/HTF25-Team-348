import os
import logging
import json
from io import BytesIO
from typing import Optional, List, Dict, Any

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Optional OCR support
try:
    from PIL import Image
    import pytesseract
    OCR_AVAILABLE = True
except Exception:
    OCR_AVAILABLE = False

# Gemini (Google Generative AI)
import google.generativeai as genai

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ✅ Configure Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.warning("⚠️ GEMINI_API_KEY is not set. Please set it in your environment before running the app.")
genai.configure(api_key=GEMINI_API_KEY)

# ✅ Choose the Gemini model (from your list)
MODEL_NAME = "models/gemini-2.5-flash"  # good balance between speed and quality
model = genai.GenerativeModel(MODEL_NAME)

# ✅ FastAPI app setup
app = FastAPI(title="Health Tracker AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # change this in production
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------
# 🔹 MODELS
# ---------------------------
class AnalyzeRequest(BaseModel):
    symptom: str


# ---------------------------
# 🔹 HELPER FUNCTION
# ---------------------------
def ask_gemini(prompt: str, system: Optional[str] = None) -> str:
    """Send prompt to Gemini and return the response."""
    try:
        system_prompt = system or (
            "You are a helpful, cautious medical assistant. "
            "Provide non-diagnostic advice, clearly indicate if the user should seek medical care, "
            "and suggest follow-up steps and specialist types."
        )

        # Combine system + user prompt
        full_prompt = f"{system_prompt}\n\nUser input:\n{prompt}"

        response = model.generate_content(full_prompt)
        return response.text.strip() if response.text else "[No response]"
    except Exception as e:
        logger.exception("Gemini request failed")
        return f"[Gemini error] {str(e)}"


# ---------------------------
# 🔹 ENDPOINTS
# ---------------------------

@app.get("/")
def home():
    return {"message": "✅ FastAPI + Gemini backend is running!"}


@app.post("/analyze")
async def analyze_text(req: AnalyzeRequest):
    """Analyze symptom text and return concise advice."""
    symptom = req.symptom.strip()
    if not symptom:
        return {"result": "Please provide a non-empty symptom description."}

    prompt = (
        f"User symptom description:\n\n{symptom}\n\n"
        "Please provide:\n"
        "1) Short summary of likely causes (2–4 bullet points).\n"
        "2) Urgency level (e.g., 'seek immediate care', 'see doctor within 48 hours', 'self-care ok').\n"
        "3) Practical next steps (3 bullets) and what specialist to consult if needed.\n"
        "4) List any red-flag symptoms that should prompt immediate emergency care.\n"
        "Be concise and avoid giving definitive medical diagnoses. Use plain language."
    )

    answer = ask_gemini(prompt)
    return {"result": answer}


@app.post("/analyze-file")
async def analyze_file(file: UploadFile = File(...)):
    """Analyze uploaded image or text file for health metrics."""
    filename = file.filename
    content_type = file.content_type or ""
    logger.info("📄 Received file: %s (%s)", filename, content_type)

    body = await file.read()
    extracted_text = ""

    # 1️⃣ Plain text file
    if content_type.startswith("text/") or filename.lower().endswith(".txt"):
        extracted_text = body.decode("utf-8", errors="replace")

    # 2️⃣ Image file (OCR)
    elif content_type.startswith("image/") or filename.lower().endswith((".png", ".jpg", ".jpeg")):
        if OCR_AVAILABLE:
            try:
                image = Image.open(BytesIO(body))
                extracted_text = pytesseract.image_to_string(image)
            except Exception:
                logger.exception("OCR failed")
                return {"error": "OCR failed on the uploaded image."}
        else:
            return {"error": "OCR is not available. Install Pillow and pytesseract."}

    # 3️⃣ PDF not supported (simple version)
    elif filename.lower().endswith(".pdf"):
        return {"error": "PDF parsing not enabled. Please convert PDF to text or image."}

    else:
        return {"error": "Unsupported file type. Send text or image files."}

    if not extracted_text.strip():
        return {"error": "No text could be extracted from the file."}

    # 🧠 Build AI prompt
    prompt = (
        f"Here is the extracted text from a lab report or prescription:\n\n{extracted_text}\n\n"
        "1) Extract key health metrics (name, value, unit, normal-range if present). "
        "Respond as a JSON object with a top-level key 'metrics' (list of objects with name, value, unit, range, normal boolean). \n"
        "2) Provide a concise diagnosis summary and recommendations under key 'diagnosis'. \n\n"
        "Return only JSON with keys: metrics and diagnosis."
    )

    ai_response = ask_gemini(prompt)

    # Try to parse JSON from the response
    try:
        parsed = json.loads(ai_response)
        metrics = parsed.get("metrics", [])
        diagnosis_text = parsed.get("diagnosis", "")
    except Exception:
        metrics = []
        diagnosis_text = ai_response  # fallback

    return {"metrics": metrics, "diagnosis": diagnosis_text}


# ✅ End of file
