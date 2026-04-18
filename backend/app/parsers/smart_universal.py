"""
SmartUniversalParser
====================
A robust, bank-agnostic parser built on top of pdfplumber.

Strategy order (per page):
  1. lines  + lines  (bordered / grid tables)
  2. text   + lines  (semi-bordered)
  3. text   + text   (borderless / text-only)
  4. explicit_text   (raw text column heuristic for very unusual layouts)

If ALL pdfplumber strategies yield 0 transactions → delegates to GeminiParser.
"""

from .base import BaseParser
import re
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Column keyword maps
# ---------------------------------------------------------------------------
DATE_KEYWORDS        = ["date", "txn date", "value date", "trans date", "posting date"]
DESC_KEYWORDS        = ["particulars", "narration", "description", "details", "remarks",
                        "transaction details", "transaction narration"]
DEBIT_KEYWORDS       = ["withdrawal", "debit", "dr", "debit amount", "withdraw"]
CREDIT_KEYWORDS      = ["deposit", "credit", "cr", "credit amount"]
BALANCE_KEYWORDS     = ["balance", "bal", "closing balance", "running balance"]
AMOUNT_KEYWORDS      = ["amount", "txn amount", "transaction amount"]    # single-column style
CHQREF_KEYWORDS      = ["chq", "ref", "cheque", "reference", "ref no", "chq/ref"]

# ---------------------------------------------------------------------------
# Date formats tried in order
# ---------------------------------------------------------------------------
DATE_FORMATS = [
    "%d-%m-%Y", "%d/%m/%Y", "%d-%b-%Y", "%d %b %Y",
    "%d/%m/%y", "%d-%m-%y", "%d %b %y",
    "%Y-%m-%d", "%d.%m.%Y", "%d.%m.%y",
]

def _clean_num(val: str) -> float:
    """Convert a cell string like '-1,23,456.78 Dr' → float."""
    if not val:
        return 0.0
    # Remove commas and whitespace
    cleaned = val.replace(",", "").strip()
    # Extract digit, dot, and minus sign sequences
    nums = "".join(re.findall(r"[-\d.]", cleaned))
    try:
        return float(nums) if nums else 0.0
    except ValueError:
        return 0.0

def _parse_date(cell: str):
    """Try all known date formats, return datetime or None."""
    if not cell:
        return None
    cell = cell.strip()
    # Some banks have date + time, drop the time part
    cell = re.split(r"\s+\d{2}:\d{2}", cell)[0].strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(cell, fmt)
        except:
            continue
    return None

def _has_any(cell_lower: str, keywords: list) -> bool:
    return any(kw in cell_lower for kw in keywords)

def _discover_headers(row: list) -> dict | None:
    """
    Inspect a row and return column index mapping if it looks like a header.
    Returns None if not a header row.
    """
    row_lower = [str(c).lower().strip().replace("\n", " ") for c in row]
    
    # Must have at least a date column to be treated as a header
    if not any(_has_any(c, DATE_KEYWORDS) for c in row_lower):
        return None
    # Must also have a description-like column
    if not any(_has_any(c, DESC_KEYWORDS) for c in row_lower):
        return None

    mapping = {}
    for i, cell in enumerate(row_lower):
        if "date" in mapping and "desc" in mapping:
            # Already found primary keys, try secondary
            pass
        
        if not mapping.get("date") and _has_any(cell, DATE_KEYWORDS):
            mapping["date"] = i
        elif not mapping.get("desc") and _has_any(cell, DESC_KEYWORDS):
            mapping["desc"] = i
        elif not mapping.get("debit") and _has_any(cell, DEBIT_KEYWORDS):
            mapping["debit"] = i
        elif not mapping.get("credit") and _has_any(cell, CREDIT_KEYWORDS):
            mapping["credit"] = i
        elif not mapping.get("balance") and _has_any(cell, BALANCE_KEYWORDS):
            mapping["balance"] = i
        elif not mapping.get("amount") and _has_any(cell, AMOUNT_KEYWORDS):
            mapping["amount"] = i  # single-column amount banks
        elif not mapping.get("chqref") and _has_any(cell, CHQREF_KEYWORDS):
            mapping["chqref"] = i  # optional

    # Require at least date + desc + one financial column
    has_finance = "debit" in mapping or "credit" in mapping or "amount" in mapping
    if "date" in mapping and "desc" in mapping and has_finance:
        return mapping
    return None

def _extract_txn_from_row(row: list, mapping: dict, bank: str) -> dict | None:
    """Given a data row and a column mapping, extract a transaction dict."""
    try:
        date_cell = row[mapping["date"]].strip()
        if not re.search(r"\d", date_cell):
            return None  # No digits → not a data row

        date_obj = _parse_date(date_cell)
        if not date_obj:
            return None

        desc = str(row[mapping["desc"]]).replace("\n", " ").strip()

        # --- Financial values ---
        if "debit" in mapping and "credit" in mapping:
            # Standard separate-column layout
            debit  = _clean_num(row[mapping["debit"]])
            credit = _clean_num(row[mapping["credit"]])
        elif "amount" in mapping:
            # Single-amount column → detect Dr/Cr from the cell text, sign, or separate type column
            raw_amt = str(row[mapping["amount"]])
            amt = _clean_num(raw_amt)
            raw_lower = raw_amt.lower()
            
            # Check for Dr/Cr in the amount cell itself
            is_debit = (
                "dr" in raw_lower or 
                "d" in raw_lower.replace("credit", "") or 
                amt < 0
            )
            is_credit = "cr" in raw_lower or "c" in raw_lower.replace("debit", "")
            
            # If not detected yet, check all other columns for Dr/Cr indicators
            # (Matches banks that have a separate 'Type' or 'Dr/Cr' column)
            if not is_debit and not is_credit:
                for idx, cell in enumerate(row):
                    cell_l = str(cell).lower().strip()
                    if cell_l in ["dr", "d", "debit"]:
                        is_debit = True
                        break
                    if cell_l in ["cr", "c", "credit"]:
                        is_credit = True
                        break

            abs_amt = abs(amt)
            
            if is_debit:
                debit, credit = abs_amt, 0.0
            elif is_credit:
                debit, credit = 0.0, abs_amt
            else:
                # Fallback: look at description keywords
                desc_l = desc.lower()
                if any(x in desc_l for x in ["debit", "withdrawal", "payment", "purchase", "paid to", "dr"]):
                    debit, credit = abs_amt, 0.0
                else:
                    # Default to credit if no signals
                    debit, credit = 0.0, abs_amt
        else:
            return None

        balance = _clean_num(row[mapping["balance"]]) if "balance" in mapping else 0.0

        if debit == 0 and credit == 0:
            return None

        return {
            "bank": bank.upper(),
            "date": date_obj,
            "description": desc,
            "debit": debit,
            "credit": credit,
            "balance": balance,
            "type": "DEBIT" if debit > 0 else "CREDIT",
        }
    except Exception:
        return None


class SmartUniversalParser(BaseParser):
    """
    Bank-agnostic parser with 4 pdfplumber strategies + Gemini AI fallback.
    """

    TABLE_STRATEGIES = [
        {"vertical_strategy": "lines",  "horizontal_strategy": "lines",  "snap_y_tolerance": 5, "intersection_x_tolerance": 5},
        {"vertical_strategy": "text",   "horizontal_strategy": "lines",  "snap_y_tolerance": 5},
        {"vertical_strategy": "text",   "horizontal_strategy": "text",   "snap_y_tolerance": 3},
        {"vertical_strategy": "lines",  "horizontal_strategy": "text",   "snap_y_tolerance": 5},
    ]

    def __init__(self, bank: str = "UNKNOWN"):
        self.bank = bank.upper()
        self.header_mapping = None  # persists across pages

    def _try_strategies(self, page) -> list:
        """Try all table strategies, return transactions from the first one that works."""
        for settings in self.TABLE_STRATEGIES:
            try:
                tables = page.extract_tables(settings)
                if not tables:
                    continue

                txns = []
                local_mapping = self.header_mapping  # carry from previous pages

                for table in tables:
                    for row in table:
                        row = [str(c).strip() if c else "" for c in row]
                        if len(row) < 3:
                            continue

                        # Header detection
                        discovered = _discover_headers(row)
                        if discovered:
                            local_mapping = discovered
                            self.header_mapping = discovered
                            logger.info(f"🔍 [{self.bank}] Headers found: {discovered}")
                            continue

                        if not local_mapping:
                            continue

                        txn = _extract_txn_from_row(row, local_mapping, self.bank)
                        if txn:
                            txns.append(txn)

                if txns:
                    logger.info(f"✅ [{self.bank}] Strategy {settings['vertical_strategy']}+{settings['horizontal_strategy']} → {len(txns)} txns")
                    return txns

            except Exception as e:
                logger.debug(f"Strategy error: {e}")
                continue

        return []

    def parse_page(self, page) -> list:
        txns = self._try_strategies(page)

        if not txns:
            # ---------------------------------------------------------------
            # Gemini fallback: send raw page text to the AI
            # ---------------------------------------------------------------
            logger.warning(f"⚠️ [{self.bank}] pdfplumber found 0 txns. Trying Gemini fallback...")
            try:
                from app.parsers.gemini_parser import GeminiParser
                page_text = page.extract_text() or ""
                if page_text.strip():
                    gemini = GeminiParser()
                    txns = gemini.parse_page_text(page_text, self.bank)
                    if txns:
                        logger.info(f"🤖 [{self.bank}] Gemini fallback → {len(txns)} txns")
                else:
                    logger.warning(f"⚠️ [{self.bank}] Page has no extractable text (possibly scanned image).")
            except Exception as e:
                logger.error(f"❌ Gemini fallback failed: {e}")

        return txns

    def parse(self, pdf) -> list:
        all_txns = []
        for page in pdf.pages:
            all_txns.extend(self.parse_page(page))
        return all_txns
