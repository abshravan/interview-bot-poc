"""
PDF text extraction utilities.

Strategy:
  1. Try pdfplumber first (best for text-based PDFs).
  2. Fall back to PyMuPDF (fitz) if pdfplumber returns empty text
     (handles some edge-case layouts better).
"""

import io
from typing import Optional

import pdfplumber
import fitz  # PyMuPDF


def extract_text_pdfplumber(content: bytes) -> str:
    """Extract text from PDF bytes using pdfplumber."""
    text_parts = []
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text.strip())
    return "\n\n".join(text_parts)


def extract_text_pymupdf(content: bytes) -> str:
    """Extract text from PDF bytes using PyMuPDF."""
    text_parts = []
    doc = fitz.open(stream=content, filetype="pdf")
    for page in doc:
        text_parts.append(page.get_text().strip())
    doc.close()
    return "\n\n".join(text_parts)


def extract_text(content: bytes) -> Optional[str]:
    """
    Main extraction entry point.
    Returns cleaned text or raises ValueError if nothing could be extracted.
    """
    text = extract_text_pdfplumber(content)

    if not text.strip():
        # Fallback to PyMuPDF
        text = extract_text_pymupdf(content)

    text = text.strip()
    if not text:
        raise ValueError("Could not extract any text from the provided PDF")

    return text
