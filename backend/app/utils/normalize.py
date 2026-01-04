import re

# Pre-compiled regex patterns for different transaction types
PATTERNS = [
    (re.compile(r"(?:FN|GN|TFR)\/([A-Z\s]+)\/", re.I), lambda m: m.group(1).strip()),
    (re.compile(r"UPI(?:OUT|IN)?\/.*?\/([a-zA-Z0-9\.\-_]+)@[a-zA-Z]+", re.I), lambda m: m.group(1).strip()),
    (re.compile(r"TO ATM\/.*?\/([A-Z\-\s]+)$", re.I), lambda m: "ATM " + m.group(1).replace("FBL-", "").strip()),
    (re.compile(r"(?:POS|ECOM)\/.*?\/([A-Z0-9\s\.]+)", re.I), lambda m: m.group(1).strip())
]

DATE_REGEX = re.compile(r"\d{2}/\d{2}/\d{4}")
JUNK_WORDS_REGEX = re.compile(r'[0-9]{5,}')

def extract_payee_refined(description):
    if not description: return "UNKNOWN"
    desc_str = str(description).strip()
    
    # 1. Try specific UPI @ cleaning first
    match = re.search(r'/\s*([^/@\s]+)@', desc_str)
    if match:
        return match.group(1).strip().upper()
    
    # 2. Try the general patterns list
    for pattern, extractor in PATTERNS:
        match = pattern.search(desc_str)
        if match:
            clean_name = extractor(match)
            return JUNK_WORDS_REGEX.sub('', clean_name).upper().strip()

    return desc_str[:25].strip().upper()

def normalize(txn):
    date = txn.get("date")
    if not isinstance(date, str) or not DATE_REGEX.match(date):
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

    return {
        "date": date.strip(),
        "txn_date": date.strip(),
        "description": str(txn.get("description", "")).replace("\n", " ").strip(),
        "payee": extract_payee_refined(txn.get("description")),
        "debit": debit,
        "credit": credit,
        "balance": to_float(txn.get("balance")),
        "bank": txn.get("bank"),
        "type": "DEBIT" if debit > 0 else "CREDIT"
    }