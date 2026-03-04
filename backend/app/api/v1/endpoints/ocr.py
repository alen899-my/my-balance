import os
import time
import requests
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.utils.dependencies import get_current_user
from app.parsers.gemini_parser import GeminiParser
from app.parsers.groq_parser import GroqParser

router = APIRouter(prefix="/ocr", tags=["ocr"])

@router.post("/scan")
async def scan_receipt(
    file: UploadFile = File(...), 
    model: str = Form("gemini-2.0-flash"),
    user = Depends(get_current_user)
):
    """
    Receives a receipt image, uploads it to Vercel Blob from the server, 
    and then parses it using the selected provider (Gemini or Groq).
    """
    # 1. Read file content
    try:
        content = await file.read()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read file: {str(e)}")

    # 2. Upload to Vercel Blob from Server (Bypasses CORS and secures token)
    blob_token = os.getenv("BLOB_READ_WRITE_TOKEN")
    if not blob_token:
        raise HTTPException(status_code=500, detail="Vercel Blob token not configured on server")

    filename = f"receipt_{int(time.time())}_{file.filename}"
    blob_url = f"https://blob.vercel-storage.com/{filename}"
    
    try:
        upload_res = requests.put(
            blob_url,
            data=content,
            headers={
                "Authorization": f"Bearer {blob_token}",
                "x-access": "public",
                "x-api-version": "1",
                "x-add-random-suffix": "true"
            }
        )
        if upload_res.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Vercel Blob upload failed: {upload_res.text}")
        
        final_image_url = upload_res.json().get("url")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage error: {str(e)}")

    # 3. Parse with selected provider
    try:
        if "llama" in model.lower():
            parser = GroqParser()
            result = parser.scan_receipt(image_bytes=content, model_name=model)
        else:
            parser = GeminiParser()
            result = parser.scan_receipt(image_url=final_image_url, image_bytes=content, model_name=model)
            
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Parsing failed: {str(e)}")
