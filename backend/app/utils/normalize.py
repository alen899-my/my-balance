import re
import os
import json
from datetime import datetime

# ---------------------------------------------------------------------------
# High-Precision Regex Patterns for Indian Bank Narrations
# ---------------------------------------------------------------------------

_BANK_NOISE = re.compile(
    r"\b(UPIAR|UPI|TRANSFER|PAYMENT|INB|RTGS|NEFT|IMPS|POS|DR|CR|HDFC|SBI|ICICI|AXIS|UBIN|FBL|SIB|BARB|CNRB|IDFB|KKBK|YESB|PUNB|SBIN|HDFC0|UTIB0|ICIC0|FINACLE|CASHOUT|CASHIN)\b",
    re.IGNORECASE
)

_COMMON_ID_PATTERN = re.compile(r"\b\d{6,}\b") 
_VPA_PATTERN = re.compile(r"([A-Z0-9\.\-_]+)@[A-Z]{3,}") 

def extract_payee_name(description: str) -> str:
    if not description: return "Miscellaneous"
    raw = description.replace("\\", "/").upper().strip()
    
    # 1. VPA handle extraction
    vpa_match = _VPA_PATTERN.search(raw)
    if vpa_match:
        handle_name = vpa_match.group(1).strip()
        clean_handle = re.sub(r"\d+$", "", handle_name)
        if len(clean_handle) > 2: return clean_handle.title()

    # 2. Part-based Extraction
    parts = [p.strip() for p in raw.split("/") if p.strip()]
    if len(parts) >= 3:
        for part in parts:
            # Check if this part looks like a real name (words only, no numbers, not a bank code)
            if (not _BANK_NOISE.search(part) and 
                not _COMMON_ID_PATTERN.search(part) and 
                len(part) > 2 and 
                re.match(r"^[A-Z\s\.]+$", part) and
                not "@" in part):
                return part.title()

    # 3. Clean fallback
    clean = _VPA_PATTERN.sub(" ", raw)
    clean = _BANK_NOISE.sub(" ", clean)
    clean = _COMMON_ID_PATTERN.sub(" ", clean)
    clean = re.sub(r"[/\-_|;:,.]", " ", clean)
    
    # Remove fragments that are clearly noise
    valid_words = [w for w in clean.split() if len(w) > 2 and not w.isdigit() and not _BANK_NOISE.match(w)]
    
    if valid_words:
        # If we have multiple words, combine up to 2 (e.g. 'AMAZON PAY')
        return " ".join(valid_words[:2]).title()

    # Final resort: If it's just numbers/noise, at least show the first few chars of raw but cleaned
    last_resort = re.sub(r"[^A-Z]", " ", raw)
    last_resort = " ".join(last_resort.split())
    if last_resort: return last_resort.title()[:20]

    return "Internal Activity"

def batch_extract_payees_ai(descriptions: list[str]) -> dict:
    mapping = {}
    for d in descriptions:
        mapping[d] = extract_payee_name(d)
    return mapping

def normalize(txn):
    import logging
    logger = logging.getLogger(__name__)
    date_val = txn.get("date")
    if isinstance(date_val, datetime): date_obj = date_val
    elif isinstance(date_val, str):
        date_obj = None
        for fmt in ("%d/%m/%Y", "%d-%b-%Y", "%d-%m-%Y", "%Y-%m-%d"):
            try: date_obj = datetime.strptime(date_val.strip(), fmt); break
            except: continue
        if not date_obj: return None
    else: return None

    def to_float(v):
        try: return float(str(v).replace(',', '').replace(' ', '').strip())
        except: return 0.0

    debit = abs(to_float(txn.get("debit")))
    credit = abs(to_float(txn.get("credit")))
    if debit == 0 and credit == 0: return None

    desc = " ".join(str(txn.get("description", "")).split())
    payee = extract_payee_name(desc)

    from app.utils.analysis import classify_category
    return {
        "date": date_obj,
        "description": desc,
        "payee": payee,
        "category": classify_category(payee),
        "debit": debit, "credit": credit,
        "balance": to_float(txn.get("balance")),
        "bank": txn.get("bank", "Bank").upper(),
        "type": "DEBIT" if debit > 0 else "CREDIT",
        "updated_at": datetime.utcnow()
    }