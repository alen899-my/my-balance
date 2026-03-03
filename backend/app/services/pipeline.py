import os
import io
import shutil
import pdfplumber
from datetime import datetime
from bson import ObjectId
from app.parsers.factory import get_parser
from app.utils.unlock_pdf import unlock_pdf
from app.utils.normalize import normalize
from app.utils.hash import make_hash
from app.models.transaction import Transaction
from pymongo import UpdateOne

import logging
from app.services.job_store import update_job, get_job

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def process_statement_pipeline(file_path: str, bank: str, password: str | None, user_id: str, job_id: str = None):
    """
    Robust pipeline to process bank statement PDF files.
    1. Unlocks PDF (if password provided)
    2. Streams pages one by one to avoid RAM spikes
    3. Uses SmartUniversalParser (pdfplumber + Gemini fallback) for all banks
    4. Normalizes and bulk upserts transactions
    5. Cleans up temp file
    """
    bank_upper = bank.upper().strip()
    logger.info(f"🚀 PIPELINE STARTED: file={file_path} bank={bank_upper} user={user_id}")
    
    try:
        # 1. Read & Unlock PDF
        with open(file_path, "rb") as f:
            file_bytes = f.read()

        logger.info(f"📂 File read from disk. Size: {len(file_bytes)} bytes")

        unlocked_bytes = unlock_pdf(file_bytes, password)
        logger.info("🔓 PDF unlocked successfully")

        # 2. Count pages for progress reporting
        total_pages = 0
        with pdfplumber.open(io.BytesIO(unlocked_bytes)) as pdf_temp:
            total_pages = len(pdf_temp.pages)

        if job_id:
            await update_job(job_id, status="processing", total_pages=total_pages, message="Parsing pages...")

        # 3. Get bank-appropriate parser
        parser = get_parser(bank_upper)
        logger.info(f"🧩 Parser selected: {type(parser).__name__} for bank: {bank_upper}")

        valid_batch = []
        user_oid = str(user_id)
        account_id = f"{user_id}_{bank_upper}"

        # 4. Stream pages
        with pdfplumber.open(io.BytesIO(unlocked_bytes)) as pdf:
            for i, page in enumerate(pdf.pages):
                if job_id:
                    await update_job(job_id, processed_pages=i + 1,
                                     message=f"Processing page {i + 1}/{total_pages}")

                # Parse the page (SmartUniversalParser handles Gemini fallback internally)
                page_data = parser.parse_page(page)

                # 5. Normalize & batch
                for txn in page_data:
                    # Ensure the bank name is always the user-supplied value
                    txn["bank"] = bank_upper
                    clean = normalize(txn)
                    if not clean:
                        continue

                    txn_hash = make_hash(account_id, clean)

                    valid_batch.append(
                        UpdateOne(
                            {"hash": txn_hash},
                            {
                                "$setOnInsert": {
                                    "user_id": user_oid,
                                    "account_id": account_id,
                                    "hash": txn_hash,
                                    "txn_date": clean.get("txn_date"),
                                    "date": clean.get("date"),
                                },
                                "$set": {
                                    "description": clean.get("description"),
                                    "payee": clean.get("payee"),
                                    "category": clean.get("category"),
                                    "debit": clean.get("debit"),
                                    "credit": clean.get("credit"),
                                    "balance": clean.get("balance"),
                                    "bank": bank_upper,
                                    "type": clean.get("type"),
                                    "updated_at": datetime.utcnow(),
                                },
                            },
                            upsert=True,
                        )
                    )

                logger.info(
                    f"📄 Page {i+1}/{total_pages} parsed → "
                    f"{len(page_data)} raw items | batch size: {len(valid_batch)}"
                )

                # 6. Flush batch after each page to keep memory usage flat
                if valid_batch:
                    logger.info(f"💾 Inserting batch of {len(valid_batch)} transactions...")
                    await Transaction.get_pymongo_collection().bulk_write(valid_batch, ordered=False)

                    if job_id:
                        job = await get_job(job_id)
                        current_count = (job.processed_txns if job else 0) + len(valid_batch)
                        await update_job(job_id, processed_txns=current_count)

                    valid_batch = []

    except Exception as e:
        logger.error(f"❌ PIPELINE ERROR: {str(e)}", exc_info=True)
        if job_id:
            await update_job(job_id, status="failed", message=str(e))
    finally:
        # 7. Cleanup temp file
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"🧹 Cleaned up temp file: {file_path}")
        if job_id:
            await update_job(job_id, status="completed", message="Done")
