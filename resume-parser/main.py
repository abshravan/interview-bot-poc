"""
Resume Parser — FastAPI microservice

Endpoints:
  POST /parse   — accepts a PDF file, returns extracted text
  GET  /health  — liveness check
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from parser import extract_text

app = FastAPI(title="Resume Parser", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ParseResponse(BaseModel):
    filename: str
    text: str
    char_count: int


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/parse", response_model=ParseResponse)
async def parse_resume(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    content = await file.read()

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    try:
        text = extract_text(content)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parsing failed: {str(e)}")

    return ParseResponse(
        filename=file.filename or "unknown.pdf",
        text=text,
        char_count=len(text),
    )
