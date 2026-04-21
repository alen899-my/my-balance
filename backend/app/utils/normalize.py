import re
import os
import json
from datetime import datetime

# ---------------------------------------------------------------------------
# Patterns for noise removal (reference IDs, dates, transaction type words)
# We do NOT strip bank/merchant names — those are the useful display values
# ---------------------------------------------------------------------------

# Long digit sequences = reference IDs / account numbers / UPI transaction IDs
_REF_NUMS = re.compile(r'\b\d{6,}\b')
# Short date patterns like 01/04/24 or 01-04-2024
_DATES = re.compile(r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b')
# UPI VPA suffix: @oksbi, @paytm, @ybl etc
_VPA_SUFFIX = re.compile(r'@\w+')
# Transaction type prefixes only — NOT bank names
_TX_PREFIX = re.compile(
    r'\b(UPI|UPIAR|NEFT|RTGS|IMPS|TRANSFER|TRF|REF|PAYMENT|PAY|ACH|NACH|MANDATE|EMI|'
    r'INB|POS|ATM|CDM|CMS|BILLPAY|BILL|NFS|MB|IB|eBANKING|NETBKG|NET|MOBILE|'
    r'REVERSAL|CHGS|CHARGES|TAX|GST|CONV|FEE|INT|INTEREST|PENALTY|ADJ|ADJUSTMENT)\b',
    re.IGNORECASE
)
# Separator characters
_SEPS = re.compile(r'[/|_\-]+')
# Remove lone single-letter or two-letter tokens (DR, CR, TO, BY, AC)
_SHORT_TOKENS = re.compile(r'\b(DR|CR|TO|BY|FROM|AC|A/C|MB|IB)\b', re.IGNORECASE)


def normalize_description_for_grouping(description: str) -> str:
    """
    Extract the real payee name from bank narrations.

    Indian bank description format is typically:
      UPI / <ref_number> / <PAYEE NAME> / <bank_or_vpa>
      NEFT / <ref_number> / <PAYEE NAME> / <bank>
      IMPS / <ref_number> / <PAYEE NAME> / ...

    So the name is always at index 2 (3rd segment) when split by '/'.
    """
    if not description:
        return "Other"

    text = description.strip()

    # ── Strategy 1: Extract 3rd segment (index 2) from slash-separated narrations ──
    parts = [p.strip() for p in text.split("/") if p.strip()]
    if len(parts) >= 3:
        candidate = parts[2]
        # Remove long digit reference numbers inside the candidate
        candidate = _REF_NUMS.sub('', candidate).strip()
        # Remove VPA suffix (@bank)
        candidate = _VPA_SUFFIX.sub('', candidate).strip()
        # Remove leftover short noise tokens
        candidate = _SHORT_TOKENS.sub('', candidate).strip()
        candidate = re.sub(r'\b\d+\b', '', candidate).strip()
        candidate = ' '.join(candidate.split())
        # Accept it if it has meaningful alphabetic content (at least 2 chars, not a bank code)
        if candidate and len(candidate) >= 2 and not candidate.isdigit():
            return candidate.title()

    # ── Strategy 2: Full cleanup (for non-slash formats) ──
    cleaned = text
    cleaned = _REF_NUMS.sub('', cleaned)
    cleaned = _DATES.sub('', cleaned)
    cleaned = _VPA_SUFFIX.sub('', cleaned)
    cleaned = _SEPS.sub(' ', cleaned)
    cleaned = _TX_PREFIX.sub('', cleaned)
    cleaned = _SHORT_TOKENS.sub('', cleaned)
    cleaned = re.sub(r'\b\d{1,5}\b', '', cleaned)
    cleaned = ' '.join(cleaned.split())

    if cleaned and len(cleaned) >= 2:
        return cleaned.title()

    # ── Fallback: strip digits from original ──
    fallback = re.sub(r'\d+', '', text)
    fallback = re.sub(r'[/|_\-]+', ' ', fallback)
    fallback = ' '.join(fallback.split())
    return fallback.title()[:60] if fallback.strip() else "Other"


# ---------------------------------------------------------------------------
# Legacy extract_payee_name — kept for backward compatibility during import
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

    vpa_match = _VPA_PATTERN.search(raw)
    if vpa_match:
        handle_name = vpa_match.group(1).strip()
        clean_handle = re.sub(r"\d+$", "", handle_name)
        if len(clean_handle) > 2: return clean_handle.title()

    parts = [p.strip() for p in raw.split("/") if p.strip()]
    if len(parts) >= 3:
        for part in parts:
            if (not _BANK_NOISE.search(part) and
                not _COMMON_ID_PATTERN.search(part) and
                len(part) > 2 and
                re.match(r"^[A-Z\s\.]+$", part) and
                    "@" not in part):
                return part.title()

    clean = _VPA_PATTERN.sub(" ", raw)
    clean = _BANK_NOISE.sub(" ", clean)
    clean = _COMMON_ID_PATTERN.sub(" ", clean)
    clean = re.sub(r"[/\-_|;:,.]", " ", clean)
    valid_words = [w for w in clean.split() if len(w) > 2 and not w.isdigit() and not _BANK_NOISE.match(w)]
    if valid_words:
        return " ".join(valid_words[:2]).title()

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