from .base import BaseParser
import re
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class FederalBankParser(BaseParser):
    def __init__(self):
        self.header_indices = None

    def parse_page(self, page):
        txns = []
        
        # 'lines' is the correct strategy to detect the table grid (lattice)
        # 'snap_y_tolerance' helps group multi-line descriptions into one row
        settings = {
            "vertical_strategy": "lines",
            "horizontal_strategy": "lines",
            "snap_y_tolerance": 5,
            "intersection_x_tolerance": 5,
        }
        
        # Extract all tables found on the page
        tables = page.extract_tables(settings)
        
        if not tables:
            logger.warning(f"⚠️ Page {page.page_number}: No grid tables found. Trying 'text' strategy fallback.")
            # Fallback for pages where lines might be missing or faint
            settings["vertical_strategy"] = "text"
            settings["horizontal_strategy"] = "text"
            tables = page.extract_tables(settings)

        if not tables:
            return []

        for table in tables:
            for row in table:
                # 1. Basic Cleaning
                row = [str(cell).strip() if cell else "" for cell in row]
                
                # Skip tiny rows or header junk
                if len(row) < 4:
                    continue

                # 2. Header Detection
                row_lower = [c.lower() for c in row]
                
                # Detect Date Column
                date_idx = -1
                for i, cell in enumerate(row_lower):
                    if "date" in cell:
                        date_idx = i
                        break
                
                if date_idx != -1:
                    # Look for other columns relative to this row
                    try:
                        # Particulars
                        desc_idx = next(i for i, h in enumerate(row_lower) if any(x in h for x in ["particulars", "description", "narration"]))
                        
                        # Debit / Withdrawal
                        dr_idx = next((i for i, h in enumerate(row_lower) if any(x in h for x in ["withdrawal", "debit", "dr"])), None)
                        
                        # Credit / Deposit
                        cr_idx = next((i for i, h in enumerate(row_lower) if any(x in h for x in ["deposit", "credit", "cr"])), None)
                        
                        # Balance
                        bal_idx = next((i for i, h in enumerate(row_lower) if "balance" in h), None)

                        self.header_indices = {
                            "date": date_idx,
                            "particulars": desc_idx,
                            "debit": dr_idx,
                            "credit": cr_idx,
                            "balance": bal_idx
                        }
                        logger.info(f"✅ Headers identified: {self.header_indices}")
                        continue 
                    except StopIteration:
                        pass # Not a header row, or missing required columns

                # 3. Process Transaction Data
                if not self.header_indices:
                    continue

                # Validate Date Column
                date_cell = row[self.header_indices["date"]]
                # Matches: 05-MAY-2025 OR 05/05/2025 OR 05-05-2025
                if not re.search(r"\d", date_cell): # Quick check if it has numbers
                    continue

                try:
                    # Clean the particulars
                    particulars = row[self.header_indices["particulars"]].replace("\n", " ")
                    
                    # Clean numeric values
                    def clean_num(idx):
                        if idx is None or idx >= len(row): return 0.0
                        val = row[idx]
                        if not val or val.lower() in ["nil", "0", "0.00", ""]: 
                            return 0.0
                        cleaned = "".join(re.findall(r"[\d.]", val.replace(",", "")))
                        return float(cleaned) if cleaned else 0.0

                    debit = clean_num(self.header_indices["debit"])
                    credit = clean_num(self.header_indices["credit"])
                    balance = clean_num(self.header_indices["balance"])

                    # If both zero, check if it is a "Amount" column with Dr/Cr suffix (rare but possible)
                    # For now, assume Federal Bank always separates Dr/Cr

                    # Skip only if strictly empty financial line
                    if debit == 0 and credit == 0 and "opening balance" not in particulars.lower():
                        continue
                    
                    # Parse Date
                    date_obj = None
                    clean_date = date_cell.strip()
                    for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%d-%b-%Y", "%d %b %Y"):
                        try:
                            date_obj = datetime.strptime(clean_date, fmt)
                            break
                        except: continue

                    txns.append({
                        "bank": "FEDERAL",
                        "date": date_obj if date_obj else clean_date, # Let normalize handle if string
                        "description": particulars,
                        "debit": debit,
                        "credit": credit,
                        "balance": balance,
                        "type": "CREDIT" if credit > 0 else "DEBIT"
                    })

                except Exception as e:
                    # logger.debug(f"Row skip: {e}")
                    continue

        return txns

    def parse(self, pdf):
        all_txns = []
        for page in pdf.pages:
            all_txns.extend(self.parse_page(page))
        return all_txns