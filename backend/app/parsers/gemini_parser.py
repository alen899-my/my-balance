"""
GeminiParser
============
Uses Google Gemini Flash 2.0 Lite to parse raw page text from a bank statement
and returns structured transaction data as a list of dicts.

Only called when pdfplumber strategies yield zero transactions.
"""

import os
import re
import json
import logging
from datetime import datetime
from typing import Optional, Any

logger = logging.getLogger(__name__)

# Model to use — high performance flash model
GEMINI_MODEL = "gemini-2.0-flash"

# Accepted date formats when parsing Gemini output
DATE_FORMATS = [
    "%d-%m-%Y", "%d/%m/%Y", "%d-%b-%Y", "%d %b %Y",
    "%Y-%m-%d", "%d/%m/%y", "%d-%m-%y", "%d.%m.%Y",
]

PROMPT_TEMPLATE = """You are a bank statement parser. Extract ALL transactions from the following bank statement page text.

Return a valid JSON array. Each element must have these exact keys:
- "date": string in DD-MM-YYYY format
- "description": string (transaction narration/particulars)
- "debit": number (0 if not a debit)
- "credit": number (0 if not a credit)
- "balance": number (closing/running balance after this transaction, 0 if not shown)

Rules:
- Ignore header rows, totals, opening/closing balance summary lines.
- Only include actual transaction rows (rows with a date and at least one non-zero amount).
- If amounts have commas (e.g. 1,23,456.78), convert to plain float.
- Return ONLY the JSON array, no markdown, no explanation.
- If no transactions found, return an empty array: []

Bank: {bank}

Page text:
---
{page_text}
---"""

RECEIPT_PROMPT = """You are an expert receipt OCR agent. Extract data from the provided receipt image.
Return a valid JSON object with the following keys:
- "merchant": string (The name of the store or brand)
- "amount": number (Total amount including tax)
- "date": string in DD-MM-YYYY format (If not found, use "{default_date}")

Return ONLY the JSON object, no markdown, no explanation.
If you cannot find a value, use null for MERCHANT/AMOUNT.
"""


def _parse_date(val: str) -> datetime | None:
    if not val:
        return None
    val = str(val).strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(val, fmt)
        except:
            continue
    return None


def _safe_float(val) -> float:
    if val is None:
        return 0.0
    try:
        return float(str(val).replace(",", "").strip())
    except:
        return 0.0


class GeminiParser:
    """
    Calls Gemini Flash 2.0 Lite to extract transactions from raw page text.
    Falls back silently (returns []) on any error.
    """

    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is not None:
            return self._client

        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set in environment")

        try:
            from google import genai
            self._client = genai.Client(api_key=api_key)
        except ImportError:
            raise ImportError("google-genai package not installed. Run: pip install google-genai")

        return self._client

    def parse_page_text(self, page_text: str, bank: str = "UNKNOWN") -> list:
        """
        Send raw page text to Gemini. Returns list of normalized transaction dicts.
        """
        if not page_text or not page_text.strip():
            return []

        # Limit text length to stay within token limits
        page_text_trimmed = page_text[:8000]

        prompt = PROMPT_TEMPLATE.format(bank=bank, page_text=page_text_trimmed)

        try:
            client = self._get_client()
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
            )

            raw_text = response.text.strip()
            logger.debug(f"🤖 Gemini raw response (first 500 chars): {raw_text[:500]}")

            # Extract JSON array from the response (handle possible markdown code fences)
            json_match = re.search(r"\[.*\]", raw_text, re.DOTALL)
            if not json_match:
                logger.warning("⚠️ Gemini response did not contain a JSON array.")
                return []

            raw_json = json_match.group(0)
            rows = json.loads(raw_json)

            if not isinstance(rows, list):
                logger.warning("⚠️ Gemini returned non-list JSON.")
                return []

            txns = []
            for row in rows:
                if not isinstance(row, dict):
                    continue

                date_obj = _parse_date(str(row.get("date", "")))
                if not date_obj:
                    continue

                debit  = _safe_float(row.get("debit", 0))
                credit = _safe_float(row.get("credit", 0))

                if debit == 0 and credit == 0:
                    continue

                txns.append({
                    "bank": bank.upper(),
                    "date": date_obj,
                    "description": str(row.get("description", "")).replace("\n", " ").strip(),
                    "debit": debit,
                    "credit": credit,
                    "balance": _safe_float(row.get("balance", 0)),
                    "type": "DEBIT" if debit > 0 else "CREDIT",
                })

            logger.info(f"🤖 Gemini extracted {len(txns)} valid transactions from page.")
            return txns

        except Exception as e:
            logger.error(f"❌ GeminiParser error: {e}", exc_info=True)
            return []

    def scan_receipt(
        self, 
        image_url: Optional[str] = None, 
        image_bytes: Optional[bytes] = None,
        model_name: Optional[str] = None
    ) -> dict:
        """
        Uses Gemini to extract data from a receipt image (via URL or raw bytes).
        """
        try:
            client = self._get_client()
            
            # Use requested model or default
            active_model = model_name or GEMINI_MODEL
            
            # Use provided bytes or fetch from URL
            final_bytes = image_bytes
            mime_type = "image/jpeg"

            if not final_bytes and image_url:
                import requests
                img_res = requests.get(image_url)
                if img_res.status_code != 200:
                    logger.error(f"Failed to fetch image from URL: {image_url}")
                    return {"merchant": None, "amount": 0, "date": None}
                final_bytes = img_res.content
                mime_type = img_res.headers.get("Content-Type", "image/jpeg")

            # Detect MIME type if we have bytes but generic type
            if final_bytes and mime_type == "image/jpeg":
                if final_bytes.startswith(b'\xff\xd8'):
                    mime_type = "image/jpeg"
                elif final_bytes.startswith(b'\x89PNG'):
                    mime_type = "image/png"
                elif final_bytes.startswith(b'GIF8'):
                    mime_type = "image/gif"
                elif final_bytes.startswith(b'RIFF') and b'WEBP' in final_bytes[:12]:
                    mime_type = "image/webp"

            prompt = RECEIPT_PROMPT.format(default_date=datetime.now().strftime("%d-%m-%Y"))
            
            response = client.models.generate_content(
                model=active_model,
                contents=[
                    prompt,
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": final_bytes
                        }
                    }
                ]
            )

            raw_text = response.text.strip()
            # Extract JSON
            json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
            if not json_match:
                return {"merchant": None, "amount": 0, "date": None}

            data = json.loads(json_match.group(0))
            
            return {
                "merchant": data.get("merchant"),
                "amount": _safe_float(data.get("amount")),
                "date": data.get("date")
            }

        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "RESOURCE_EXHAUSTED" in error_msg:
                logger.error(f"⚠️ Gemini Rate Limit Hit: {error_msg}")
                return {"merchant": "Rate Limit Reached", "amount": 0, "date": "Please wait 60s"}
            
            logger.error(f"❌ Receipt OCR error: {e}", exc_info=True)
            return {"merchant": None, "amount": 0, "date": None}
