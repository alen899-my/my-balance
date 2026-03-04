import os
import json
import base64
import logging
from datetime import datetime
from typing import Optional, Any
from groq import Groq

logger = logging.getLogger(__name__)

RECEIPT_PROMPT = """
You are an expert receipt scanner. Analyze the provided receipt image and extract the following details in JSON format.
If a field is not found, use null or 0 as appropriate.

Required JSON Structure:
{{
  "merchant": "Name of the store or shop",
  "amount": total_amount_as_number,
  "date": "DD-MM-YYYY" (Use current year {default_year} if only day-month is found)
}}

Important: Return ONLY the raw JSON string, no markdown formatting.
"""

class GroqParser:
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        if not self.api_key:
            logger.error("❌ GROQ_API_KEY not found in environment")
            
    def _get_client(self):
        return Groq(api_key=self.api_key)

    def scan_receipt(
        self, 
        image_bytes: bytes,
        model_name: str = "meta-llama/llama-4-scout-17b-16e-instruct"
    ) -> dict:
        """
        Uses Groq Vision models to extract data from a receipt image.
        """
        try:
            client = self._get_client()
            
            # Encode image to base64
            base64_image = base64.b64encode(image_bytes).decode('utf-8')
            
            # Detect MIME type (simple heuristic)
            mime_type = "image/jpeg"
            if image_bytes.startswith(b'\x89PNG'):
                mime_type = "image/png"
            elif image_bytes.startswith(b'GIF8'):
                mime_type = "image/gif"
            elif image_bytes.startswith(b'RIFF') and b'WEBP' in image_bytes[:12]:
                mime_type = "image/webp"

            prompt = RECEIPT_PROMPT.format(default_year=datetime.now().year)
            
            completion = client.chat.completions.create(
                model=model_name,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:{mime_type};base64,{base64_image}",
                                },
                            },
                        ],
                    }
                ],
                temperature=0,
                max_tokens=1024,
                top_p=1,
                stream=False,
                response_format={"type": "json_object"}
            )

            raw_text = completion.choices[0].message.content
            data = json.loads(raw_text)
            
            return {
                "merchant": data.get("merchant"),
                "amount": self._safe_float(data.get("amount")),
                "date": data.get("date")
            }

        except Exception as e:
            error_msg = str(e)
            if "429" in error_msg or "rate_limit" in error_msg.lower():
                logger.error(f"⚠️ Groq Rate Limit Hit: {error_msg}")
                return {"merchant": "Groq Rate Limit Reached", "amount": 0, "date": "Please wait"}
            
            logger.error(f"❌ Groq OCR error: {e}", exc_info=True)
            return {"merchant": None, "amount": 0, "date": None}

    def _safe_float(self, value: Any) -> float:
        if value is None: return 0.0
        try:
            if isinstance(value, str):
                # Remove currency symbols and commas
                value = value.replace('$', '').replace('₹', '').replace(',', '').strip()
            return float(value)
        except (ValueError, TypeError):
            return 0.0
