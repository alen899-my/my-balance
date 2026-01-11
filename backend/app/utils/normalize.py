import re
from datetime import datetime

DATE_REGEX = re.compile(r"(\d{2}[-/]\d{2}[-/]\d{4})|(\d{2}-[a-zA-Z]{3}-\d{4})")

# Improved Patterns to catch names even when UPI strings are messy
PATTERNS = [
    # Extracts name from TFR/NAME/ or GN/NAME/
    (re.compile(r"(?:FN|GN|TFR)\/([A-Z\s]+)\/", re.I), lambda m: m.group(1).strip()),
    
    # Extracts UPI handle: user@okaxis (Prioritizes this)
    (re.compile(r"([a-zA-Z0-9\.\-_]+@[a-zA-Z0-9\.-]+)", re.I), lambda m: m.group(1).strip()),
    
    # Extracts name after the transaction ID in UPI/OUT/12345/NAME
    (re.compile(r"UPI(?:OUT|IN|[- ]IN|[- ]OUT)?\/\d+\/([^\/]+)", re.I), lambda m: m.group(1).strip()), 
    
    # POS/ECOM transactions
    (re.compile(r"(?:POS|ECOM)\/.*?\/([A-Z0-9\s\.]+)", re.I), lambda m: m.group(1).strip()),
    
    # ATM transactions
    (re.compile(r"TO ATM\/.*?\/([A-Z\-\s]+)$", re.I), lambda m: "ATM " + m.group(1).replace("FBL-", "").strip()),
]

def extract_payee_refined(description):
    if not description: return "UNKNOWN"
    desc_str = str(description).strip()
    
    # 1. Try Regex Patterns
    for pattern, extractor in PATTERNS:
        match = pattern.search(desc_str)
        if match:
            extracted = extractor(match).upper().strip()
            # If the extracted name is just "UPI TRANSFER", ignore it and try next
            if extracted not in ["UPI TRANSFER", "UPI", "TRANSFER"]:
                return extracted

    # 2. BETTER FALLBACK: If regex fails, clean the string manually
    # Remove generic junk words that cause bad grouping
    junk = ["UPI/", "OUT/", "IN/", "TRANSFER", "PAYMENT", "UPI TRANSFER", "REF-", "RTGS", "NEFT"]
    clean_fallback = desc_str.upper()
    for word in junk:
        clean_fallback = clean_fallback.replace(word, "")
    
    # Remove long numeric IDs (usually 10+ digits)
    clean_fallback = re.sub(r'\d{10,}', '', clean_fallback)
    
    # Clean up and limit length
    final = clean_fallback.replace("/", " ").replace("-", " ").strip()
    final = " ".join(final.split()) # Remove extra spaces
    
    return final[:30] if final else "GENERAL TRANSFER"

def normalize(txn):
    import logging
    logger = logging.getLogger(__name__)

    date_val = txn.get("date")

    # --- CHANGE 1: Handle if date is already a datetime object ---
    if isinstance(date_val, datetime):
        date_obj = date_val
    elif isinstance(date_val, str):
        # Clean and check string
        clean_date = date_val.strip()
        if not DATE_REGEX.search(clean_date):
            logger.warning(f"⚠️ Validation Failed: Invalid date format '{clean_date}'")
            return None
        
        # --- CHANGE 2: Expand formats to include Union Bank / ISO styles ---
        date_obj = None
        formats = (
            "%d/%m/%Y", "%d-%b-%Y", "%d-%m-%Y", 
            "%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%d/%m/%y"
        )
        
        for fmt in formats:
            try:
                date_obj = datetime.strptime(clean_date, fmt)
                break
            except: continue
        
        if not date_obj:
            logger.warning(f"⚠️ Date parse error '{clean_date}': No matching format")
            return None
    else:
        logger.warning(f"⚠️ Validation Failed: Date missing or invalid type")
        return None

    # Helper for numbers
    def to_float(v):
        if v is None or v == "" or v == 0: return 0.0
        try: 
            return float(str(v).replace(',', '').replace(' ', '').strip())
        except: 
            return 0.0

    debit = to_float(txn.get("debit"))
    credit = to_float(txn.get("credit"))
    
    # Filter out non-transactional lines
    if debit == 0 and credit == 0: 
        return None

    # Clean description
    raw_description = str(txn.get("description", "")).replace("\n", " ").strip()
    clean_description = " ".join(raw_description.split()) 

    # Payee Extraction & Classification
    from app.utils.analysis import classify_category
    payee = extract_payee_refined(clean_description)

    return {
        "date": date_obj,              # Proper BSON Date for MongoDB
        "description": clean_description, 
        "payee": payee,
        "category": classify_category(payee),
        "debit": debit,
        "credit": credit,
        "balance": to_float(txn.get("balance")),
        "bank": txn.get("bank", "UNKNOWN").upper(),
        "type": "DEBIT" if debit > 0 else "CREDIT",
        "updated_at": datetime.utcnow()
    }
    import logging
    logger = logging.getLogger(__name__)

    date_str = txn.get("date")
    if not isinstance(date_str, str) or not DATE_REGEX.search(date_str):
        if date_str: 
            logger.warning(f"⚠️ Validation Failed: Invalid date format '{date_str}'")
        return None

    # CONVERT STRING TO DATETIME OBJECT
    try:
        # Standardize string for parsing
        clean_date = date_str.strip()
        
        # Helper to try multiple formats
        date_obj = None
        for fmt in ("%d/%m/%Y", "%d-%b-%Y", "%d-%m-%Y"):
            try:
                date_obj = datetime.strptime(clean_date, fmt)
                break
            except: continue
        
        if not date_obj:
            raise ValueError("No matching format")
            
    except Exception as e:
        logger.warning(f"⚠️ Date parse error '{date_str}': {e}")
        return None

    def to_float(v):
        if v is None or v == "" or v == 0: return 0.0
        try: 
            return float(str(v).replace(',', '').replace(' ', '').strip())
        except: 
            return 0.0

    debit = to_float(txn.get("debit"))
    credit = to_float(txn.get("credit"))
    
    if debit == 0 and credit == 0: 
        return None

    # Clean description
    raw_description = str(txn.get("description", "")).replace("\n", " ").strip()
    clean_description = " ".join(raw_description.split()) 

    # Payee Extraction
    payee = extract_payee_refined(clean_description)

    # Note: Import inside function to avoid circular dependency
    from app.utils.analysis import classify_category

    return {
        "date": date_obj,              # For Mongo Queries
        "description": clean_description, 
        "payee": payee,
        "category": classify_category(payee),
        "debit": debit,
        "credit": credit,
        "balance": to_float(txn.get("balance")),
        "bank": txn.get("bank", "UNKNOWN").upper(),
        "type": "DEBIT" if debit > 0 else "CREDIT",
        "updated_at": datetime.utcnow()
    }