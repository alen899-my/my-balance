from .base import BaseParser
import re
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class CommonBankParser(BaseParser):
    def __init__(self):
        self.header_mapping = None

    def _discover_headers(self, row):
        """
        Dynamically find column indices based on common banking keywords.
        Works for HDFC, SBI, ICICI, AXIS, etc.
        """
        row_lower = [str(c).lower().strip() for c in row]
        
        # Check if this row looks like a header
        if not ("date" in row_lower and ("particulars" in row_lower or "narration" in row_lower or "description" in row_lower)):
            return None

        mapping = {}
        for i, cell in enumerate(row_lower):
            if "date" in cell: mapping["date"] = i
            elif any(x in cell for x in ["particulars", "narration", "description", "details"]): mapping["desc"] = i
            elif any(x in cell for x in ["withdrawal", "debit", "dr"]): mapping["debit"] = i
            elif any(x in cell for x in ["deposit", "credit", "cr"]): mapping["credit"] = i
            elif any(x in cell for x in ["balance", "bal"]): mapping["balance"] = i
        
        if len(mapping) >= 3:
            return mapping
        return None

    def parse_page(self, page):
        txns = []
        
        # Dual Strategy: First try 'lines' (grid), then 'text' (no borders)
        settings_list = [
            {"vertical_strategy": "lines", "horizontal_strategy": "lines", "snap_y_tolerance": 5},
            {"vertical_strategy": "text", "horizontal_strategy": "text", "snap_y_tolerance": 3}
        ]

        for settings in settings_list:
            tables = page.extract_tables(settings)
            if not tables: continue

            for table in tables:
                for row in table:
                    # Clean the row
                    row = [str(cell).strip() if cell else "" for cell in row]
                    if len(row) < 4: continue

                    # 1. Header Detection
                    discovered = self._discover_headers(row)
                    if discovered:
                        self.header_mapping = discovered
                        logger.info(f"🔍 Discovered Structure: {self.header_mapping}")
                        continue

                    if not self.header_mapping:
                        continue

                    # 2. Date Extraction & Validation
                    date_val = row[self.header_mapping["date"]]
                    # Pattern for DD-MM-YYYY or DD/MM/YY or DD-MMM-YYYY
                    date_pattern = r"(\d{1,2}[-/ ](\d{1,2}|[A-Za-z]{3})[-/ ]\d{2,4})"
                    if not re.search(date_pattern, date_val):
                        continue

                    try:
                        # --- CRITICAL: DATE CONVERSION TO DATETIME OBJECT ---
                        clean_date_str = date_val.strip()
                        date_obj = None
                        
                        # Try common bank formats
                        for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%d-%b-%Y", "%d %b %Y", "%d/%m/%y"):
                            try:
                                date_obj = datetime.strptime(clean_date_str, fmt)
                                break
                            except: continue

                        if not date_obj:
                            logger.warning(f"⚠️ Skip row: Unrecognized date format '{date_val}'")
                            continue

                        # --- NUMBER CLEANING ---
                        def clean_num(key):
                            if key not in self.header_mapping: return 0.0
                            val = row[self.header_mapping[key]]
                            cleaned = "".join(re.findall(r"[\d.]", val.replace(",", "")))
                            return float(cleaned) if cleaned else 0.0

                        debit = clean_num("debit")
                        credit = clean_num("credit")
                        balance = clean_num("balance")
                        
                        # Handle single column "Amount" with Dr/Cr suffixes
                        if debit == 0 and credit == 0:
                            amt_idx = self.header_mapping.get("debit", self.header_mapping.get("credit", 0))
                            amt_cell = row[amt_idx].lower()
                            val = clean_num("debit") if "debit" in self.header_mapping else clean_num("credit")
                            if "dr" in amt_cell: debit = val
                            else: credit = val

                        if debit == 0 and credit == 0: continue

                        txns.append({
                            "bank": "COMMON", 
                            "date": date_obj,  # Storing as Object for Insights
                            "description": row[self.header_mapping["desc"]].replace("\n", " "),
                            "debit": debit,
                            "credit": credit,
                            "balance": balance,
                            "type": "CREDIT" if credit > 0 else "DEBIT"
                        })
                    except Exception as e:
                        logger.debug(f"Row skip error: {e}")
                        continue
            
            if txns: break # If lattice worked, don't use text strategy

        return txns

    def parse(self, pdf):
        all_txns = []
        for page in pdf.pages:
            all_txns.extend(self.parse_page(page))
        return all_txns