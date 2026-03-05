import re
from datetime import datetime

DATE_REGEX = re.compile(r"(\d{2}[-/]\d{2}[-/]\d{4})|(\d{2}-[a-zA-Z]{3}-\d{4})")

# ---------------------------------------------------------------------------
# Noise tokens to strip before/after name extraction
# ---------------------------------------------------------------------------
_STRIP_TOKENS = re.compile(
    r"\b(UPI|IMPS|NEFT|RTGS|ACH|EMI|POS|ECOM|ATM|TRANSFER|PAYMENT|DEBIT|CREDIT|"
    r"CARD|MANDATE|ECS|NACH|BILL|CMS|INB|OTH|OUT|IN|TO|BY|FROM|BANK|BANKING|"
    r"ONLINE|MOBILE|NET|INTERNET|REF|NO|DR|CR|OD|AUTO|AUTOPAY|STANDING|ORDER|"
    r"INSTRUCTION|SWEEP|TSF|TFR|FEES|CHARGES|TAX|GST|INTEREST|REVERSAL|RETURN|"
    r"CHQ|CHEQUE|CASH|SALARY|SAL|ADVANCE|LOAN|MIS|RD|FD|SB|OD|A\/C|ACCT|ACCOUNT|"
    r"REFUND|BOUNCE|DISHONOUR|OVERDUE|REPAYMENT|SETTLEMENT|PROCESSING)\b",
    re.IGNORECASE,
)

# Known noise-only results that should be discarded
_NOISE_NAMES = {
    "UPI", "TRANSFER", "PAYMENT", "UPI TRANSFER", "BANK", "ONLINE", "CREDIT",
    "DEBIT", "NEFT", "IMPS", "RTGS", "ACH", "GENERAL TRANSFER", "UNKNOWN",
    "INTERNAL TRANSFER", "NA", "N/A", "NIL", "NULL", "MOBILE", "NET",
    "INTERNET", "TRANSACTION", "FUND", "FUNDS", "TXNS", "TXN",
}

# ---------------------------------------------------------------------------
# Ordered extraction stages — first match wins
# ---------------------------------------------------------------------------

def _stage_upi_slash(desc: str) -> str | None:
    """
    Handles slash-separated UPI format:
      UPI/CR/412345678901/RAHUL SHARMA/oksbi/Note
      UPI/DR/412345678901/ZOMATO/zomato@icici/Order
      UPI/DR/refno/NAME/upihandle
    Also handles IMPS/refno/NAME/BANKNAME
    """
    # Normalise back-slashes
    d = desc.replace("\\", "/")
    parts = [p.strip() for p in d.split("/")]
    # parts[0] = UPI or IMPS, parts[1] = CR/DR or ref, parts[2] = refno,
    # parts[3] = payee name (what we want), parts[4] = upi handle / bank
    for start in range(len(parts)):
        if parts[start].upper() in ("UPI", "IMPS", "NEFT"):
            # Try positions 3 and 4 relative to UPI token
            for offset in (3, 2, 4):
                idx = start + offset
                if idx < len(parts):
                    candidate = parts[idx].strip()
                    # Skip if it looks like a numeric ref, UPI handle, or noise
                    if (
                        re.match(r"^\d+$", candidate)          # pure number
                        or "@" in candidate                     # UPI VPA like name@okicici
                        or len(candidate) < 2
                        or candidate.upper() in _NOISE_NAMES
                    ):
                        continue
                    # Strip trailing bank codes like HDFC0001234
                    candidate = re.sub(r"\s+[A-Z]{2,5}\d{5,}\s*$", "", candidate).strip()
                    if candidate and len(candidate) >= 2:
                        return candidate
    return None


def _stage_upi_dash(desc: str) -> str | None:
    """
    Handles dash-separated UPI format (used by many banks in narration):
      UPI-SWIGGY-SWIGGY@ICICI-Swiggy order
      UPI-CR-412345-RAHUL SHARMA-RAHUL@SBI
      UPI-ZOMATO@icici-ORDER
    """
    d = desc.upper().strip()
    # Remove leading UPI/IMPS/NEFT prefix
    d = re.sub(r"^(UPI|IMPS|NEFT|RTGS)[-\s]+", "", d, flags=re.IGNORECASE)
    # Remove CR/ DR/ IN/ OUT prefix
    d = re.sub(r"^(CR|DR|IN|OUT)[-\s]+", "", d, flags=re.IGNORECASE)
    # Remove numeric reference
    d = re.sub(r"^\d{6,}[-\s]*", "", d)

    parts = [p.strip() for p in re.split(r"[-]", d) if p.strip()]
    for part in parts:
        # Skip pure numbers, UPI handles, noise
        if (
            re.match(r"^\d+$", part)
            or "@" in part
            or len(part) < 2
            or part.upper() in _NOISE_NAMES
        ):
            continue
        # Must contain at least one letter
        if not re.search(r"[A-Z]", part, re.IGNORECASE):
            continue
        cleaned = re.sub(r"\s+\w{2,5}\d{4,}\s*$", "", part).strip()
        if cleaned and len(cleaned) >= 2 and cleaned.upper() not in _NOISE_NAMES:
            return cleaned
    return None


def _stage_upi_handle(desc: str) -> str | None:
    """
    Extract the username part from a UPI VPA: rahulsharma@okaxis → RAHULSHARMA
    Only use this when it looks like a real personal name (no digits).
    """
    m = re.search(r"([a-zA-Z][a-zA-Z0-9._-]{1,})\@[a-zA-Z0-9.-]+", desc)
    if m:
        handle = m.group(1).strip()
        # Skip merchant VPAs (e.g., zomato, swiggy, amazon — handled by merchant list)
        # Keep only if it looks like a person name (no digits, not a known service)
        if not re.search(r"\d", handle) and handle.upper() not in _NOISE_NAMES:
            return handle
    return None


def _stage_imps_neft_name(desc: str) -> str | None:
    """
    IMPS/412345678901/JOHN DOE/HDFCBANK
    NEFT/N123456/SANJAY KUMAR GUPTA/SBIN
    Also: BY TRANSFER-NEFT/CR/40293/PRIYA NAIR/SBI
    """
    m = re.search(
        r"(?:IMPS|NEFT|RTGS)[/\s-]+\w+[/\s-]+([A-Z][A-Z\s]{2,35}?)(?:[/\s-]+[A-Z]{2,6})?$",
        desc, re.IGNORECASE
    )
    if m:
        name = m.group(1).strip()
        if name.upper() not in _NOISE_NAMES and len(name) >= 3:
            return name
    return None


def _stage_pos_merchant(desc: str) -> str | None:
    """
    POS 452113XXXXXX DMART MUMBAI
    POS/452113XXXXXX/AMAZON/MUMBAI
    ECOM/452113/FLIPKART/DELHI
    """
    m = re.search(
        r"(?:POS|ECOM)[/\s]+[X\d]{6,}[/\s]+([A-Z][A-Z0-9\s]{1,30})",
        desc, re.IGNORECASE
    )
    if m:
        name = re.split(r"[/\d]", m.group(1).strip())[0].strip()
        if name and len(name) >= 2 and name.upper() not in _NOISE_NAMES:
            return name
    return None


def _stage_known_merchants(desc: str) -> str | None:
    """
    Detect well-known merchant names directly in the description.
    This catches descriptions where the brand name appears but extraction fails.
    """
    merchants = [
        "ZOMATO", "SWIGGY", "BLINKIT", "ZEPTO", "INSTAMART",
        "AMAZON", "FLIPKART", "MYNTRA", "MEESHO", "NYKAA", "AJIO",
        "NETFLIX", "HOTSTAR", "PRIME VIDEO", "SPOTIFY", "YOUTUBE",
        "UBER", "OLA", "RAPIDO", "REDBUS",
        "MAKEMYTRIP", "YATRA", "IXIGO", "CLEARTRIP", "GOIBIBO",
        "AIRTEL", "JIO", "VI ", "BSNL", "TATA SKY", "DISH TV",
        "KSEB", "BESCOM", "MSEDCL", "TNEB", "BSES", "TPDDL",
        "DREAM11", "MPL", "MY11CIRCLE", "WINZO",
        "HDFC", "ICICI", "SBI", "AXIS", "KOTAK", "IDFC", "YES BANK",
        "BAJAJ", "RAZORPAY", "PAYTM", "PHONEPE", "GOOGLEPAY", "GPAY",
        "IRCTC", "RAILWAYS", "METRO",
        "DMART", "BIGBASKET", "RELIANCE FRESH", "MORE RETAIL", "LULU",
        "HOSPITAL", "APOLLO", "FORTIS", "MANIPAL", "MEDPLUS", "NETMEDS",
        "PETROL", "HP ", "INDIAN OIL", "BHARAT PETROLEUM", "SHELL",
        "TATANEU", "TATA MOTORS", "MARUTI", "HONDA",
    ]
    desc_upper = desc.upper()
    for merchant in merchants:
        if merchant in desc_upper:
            return merchant.strip()
    return None


def _stage_ach_emi_mandate(desc: str) -> str | None:
    """
    ACH D- EMI BAJAJ FINANCE LTD
    NACH/EMANDATE/ICICI BANK EMI
    SI- HDFC CREDILA
    """
    m = re.search(
        r"(?:ACH|NACH|SI|MANDATE|EMI|AUTO)[\s-]+(?:D[\s-]+|DR[\s-]+)?([A-Z][A-Z0-9\s&.]{2,35})",
        desc, re.IGNORECASE
    )
    if m:
        name = m.group(1).strip()
        name = re.sub(r"\s+\d.*$", "", name).strip()
        if name and len(name) >= 3 and name.upper() not in _NOISE_NAMES:
            return name
    return None


def _stage_fallback_clean(desc: str) -> str:
    """
    Last resort: strip noise tokens and numeric sequences, return what's left.
    """
    cleaned = desc.upper()
    # Remove long numeric sequences (ref numbers)
    cleaned = re.sub(r"\b\d{6,}\b", " ", cleaned)
    # Remove UPI handles
    cleaned = re.sub(r"\S+@\S+", " ", cleaned)
    # Strip noise tokens
    cleaned = _STRIP_TOKENS.sub(" ", cleaned)
    # Remove slashes and excess punctuation
    cleaned = re.sub(r"[/\-_|;:,.]", " ", cleaned)
    # Collapse whitespace
    cleaned = " ".join(cleaned.split()).strip()
    # Take the first meaningful segment (up to 35 chars)
    if cleaned and len(cleaned) >= 3:
        return cleaned[:35]
    return "GENERAL TRANSFER"


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def extract_payee_name(description: str) -> str:
    """
    Extract the actual payee/merchant name from a bank transaction description.

    Tries multiple strategies in priority order:
    1. Known merchant keyword match (fastest, most reliable for popular brands)
    2. UPI slash-format name extraction
    3. IMPS/NEFT name extraction
    4. POS merchant name
    5. ACH/EMI mandate name
    6. UPI dash-format name extraction
    7. UPI VPA handle (only if it's a personal name, no digits)
    8. Fallback: strip noise and return whatever's left
    """
    if not description:
        return "UNKNOWN"

    desc = str(description).strip()

    stages = [
        _stage_known_merchants,
        _stage_upi_slash,
        _stage_imps_neft_name,
        _stage_pos_merchant,
        _stage_ach_emi_mandate,
        _stage_upi_dash,
        _stage_upi_handle,
    ]

    for stage in stages:
        result = stage(desc)
        if result:
            cleaned = result.strip().upper()
            # Accept if it's a meaningful name (not pure noise)
            if cleaned and len(cleaned) >= 2 and cleaned not in _NOISE_NAMES:
                # Title-case the result for readability
                return " ".join(w.capitalize() for w in cleaned.split())

    # Final fallback
    fallback = _fallback = _stage_fallback_clean(desc)
    if fallback and fallback != "GENERAL TRANSFER":
        return " ".join(w.capitalize() for w in fallback.split())
    return "General Transfer"


# ---------------------------------------------------------------------------
# Legacy alias kept for backward compatibility
# ---------------------------------------------------------------------------
def extract_payee_refined(description):
    return extract_payee_name(description)


# ---------------------------------------------------------------------------
# Normalize function (unchanged interface)
# ---------------------------------------------------------------------------

def normalize(txn):
    import logging
    logger = logging.getLogger(__name__)

    date_val = txn.get("date")

    if isinstance(date_val, datetime):
        date_obj = date_val
    elif isinstance(date_val, str):
        clean_date = date_val.strip()
        if not DATE_REGEX.search(clean_date):
            logger.warning(f"⚠️ Validation Failed: Invalid date format '{clean_date}'")
            return None

        date_obj = None
        formats = (
            "%d/%m/%Y", "%d-%b-%Y", "%d-%m-%Y",
            "%Y-%m-%d %H:%M:%S", "%Y-%m-%d", "%d/%m/%y"
        )
        for fmt in formats:
            try:
                date_obj = datetime.strptime(clean_date, fmt)
                break
            except:
                continue

        if not date_obj:
            logger.warning(f"⚠️ Date parse error '{clean_date}': No matching format")
            return None
    else:
        logger.warning("⚠️ Validation Failed: Date missing or invalid type")
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

    # Extract payee name using the improved extractor
    from app.utils.analysis import classify_category
    payee = extract_payee_name(clean_description)

    return {
        "date": date_obj,
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