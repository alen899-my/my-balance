from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
import shutil
import os
import uuid
from app.utils.dependencies import get_current_user
from app.services.pipeline import process_statement_pipeline

router = APIRouter(prefix="/upload", tags=["upload"])

# /tmp is the only writable directory in serverless environments (Vercel, AWS Lambda, etc.)
# On local dev, /tmp also works. Falls back to a local dir if /tmp is unavailable.
TEMP_DIR = "/tmp/bank_uploads" if os.path.exists("/tmp") else "temp_uploads"

import logging
logger = logging.getLogger(__name__)

@router.post("/")
async def upload_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    bank: str = Form(...), 
    password: str | None = Form(None), 
    user = Depends(get_current_user)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    logger.info(f"📥 Received file upload: {file.filename} from user {user.get('user_id')}")

    # Ensure temp dir exists (important for serverless cold starts)
    os.makedirs(TEMP_DIR, exist_ok=True)

    # Generate safe temp path
    file_ext = file.filename.split('.')[-1]
    temp_filename = f"{uuid.uuid4()}.{file_ext}"
    temp_path = os.path.join(TEMP_DIR, temp_filename)
    
    # Stream write to disk
    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")
    finally:
        file.file.close()

    # Create Job
    job_id = str(uuid.uuid4())
    from app.services.job_store import create_job, get_job
    await create_job(job_id)
    
    # Trigger Pipeline with Job ID
    background_tasks.add_task(
        process_statement_pipeline, 
        temp_path, 
        bank, 
        password, 
        str(user["user_id"]),
        job_id
    )
    
    return {
        "status": "processing",
        "jobId": job_id,
        "message": "File accepted. Processing started in background."
    }

@router.get("/status/{job_id}")
async def get_upload_status(job_id: str):
    from app.services.job_store import get_job
    job = await get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
