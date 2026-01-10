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
    Robust pipeline to process heavy PDF files.
    1. Unlocks PDF (if password provided)
    2. Streams pages one by one to avoid RAM spikes
    3. Normalizes and Bulk Upserts transactions
    4. Cleans up temp file
    """
    logger.info(f"🚀 PIPELINE STARTED: Processing file {file_path} for Bank: {bank} User: {user_id}")
    try:
        # 1. Unlock PDF
        # Note: unlock_pdf currently takes bytes. For truly huge files, we might need to 
        # refactor unlock_pdf to handle file paths, but for now we read the temp file.
        # If the file is huge, this "read_all" might still be a bottleneck, 
        # but pikepdf/qpdf usually need the whole file structure. 
        # For now, we assume the server has enough RAM for ONE doc, just not holding ALL pages in pdfplumber DOM.
        
        with open(file_path, "rb") as f:
            file_bytes = f.read()
            
        logger.info(f"📂 File read from disk. Size: {len(file_bytes)} bytes")
        
        unlocked_bytes = unlock_pdf(file_bytes, password)
        logger.info("🔓 PDF Unlocked successfully")
        
        # 2. Parse & Stream
        parser = get_parser(bank)
        logger.info(f"🧩 Parser selected: {bank}")
        valid_batch = []
        user_oid = str(user_id) # Beanie uses str or ObjectId. Let's stick to str for the model if defined as str.
        account_id = f"{user_id}_{bank}"

        # Using io.BytesIO for the unlocked content 
        # (If unlock was successful, we have the decrypted bytes in memory. 
        #  Optimizing this to write decrypted to disk would be the next        # 3. Stream & Process
        # We need to know total pages for progress, if possible (pdfplumber does this easily)
        total_pages = 0
        with pdfplumber.open(io.BytesIO(unlocked_bytes)) as pdf_temp:
             total_pages = len(pdf_temp.pages)
        
        if job_id: await update_job(job_id, status="processing", total_pages=total_pages, message="Parsing pages...")
        
        # Re-open or use the bytes depending on parser implementation. 
        # Our BaseParser usually takes a pdfplumber object.
        with pdfplumber.open(io.BytesIO(unlocked_bytes)) as pdf:
            for i, page in enumerate(pdf.pages):
                if job_id: await update_job(job_id, processed_pages=i+1, message=f"Processing page {i+1}/{total_pages}")
                
                # Extract using the specific parser strategy (stateless or stateful)
                if hasattr(parser, 'parse_page'):
                    page_data = parser.parse_page(page)
                else:
                    # Fallback for monolithic parsers (should be refactored later)
                    page_data = parser.parse(pdf)
                    # If parser is monolithic, it returns ALL data at once, so we break after one loop
                    if not isinstance(page_data, list): page_data = [] # Safety
                
                # 3. Process Transactions
                for txn in page_data:
                    clean = normalize(txn)
                    if clean:
                        txn_hash = make_hash(account_id, clean)
                        
                        # Prepare Beanie/Mongo Update
                        # We use raw PyMongo operations for speed in bulk writes, 
                        # or we can use Beanie's bulk writer if available/stable.
                        # Mixed approach: Use raw pymongo update_one for bulk lists.
                        
                        valid_batch.append(
                            UpdateOne(
                                {"hash": txn_hash},
                                {
                                    "$setOnInsert": {
                                        "user_id": user_oid,
                                        "account_id": account_id,
                                        "hash": txn_hash,
                                        "txn_date": clean.get("txn_date"),
                                        "date": clean.get("date")
                                    },
                                    "$set": {
                                        "description": clean.get("description"),
                                        "payee": clean.get("payee"),
                                        "category": clean.get("category"),
                                        "debit": clean.get("debit"),
                                        "credit": clean.get("credit"),
                                        "balance": clean.get("balance"),
                                        "bank": bank,
                                        "type": clean.get("type"),
                                        "updated_at": datetime.utcnow()
                                    }
                                },
                                upsert=True
                            )
                        )

                logger.info(f"📄 Page parsed. Found {len(page_data)} raw items. Valid batch size: {len(valid_batch)}")

                # Execute batch per page (or every N items) to keep memory flat
                if len(valid_batch) > 0:
                    # Access the raw motor collection from the Beanie model
                    logger.info(f"💾 Inserting batch of {len(valid_batch)} transactions...")
                    # Beanie < 1.8 uses get_pymongo_collection() for the motor collection
                    await Transaction.get_pymongo_collection().bulk_write(valid_batch, ordered=False)
                    
                    if job_id: 
                        job = await get_job(job_id)
                        current_count = (job.processed_txns if job else 0) + len(valid_batch)
                        await update_job(job_id, processed_txns=current_count)
                        
                    valid_batch = []
                
                # Monolithic backup break
                if not hasattr(parser, 'parse_page'): break

    except Exception as e:
        logger.error(f"❌ PIPELINE ERROR: {str(e)}", exc_info=True)
        if job_id: await update_job(job_id, status="failed", message=str(e))
    finally:
        # 4. Cleanup
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"🧹 Cleaned up temp file: {file_path}")
        if job_id: await update_job(job_id, status="completed", message="Done")
