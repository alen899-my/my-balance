from .base import BaseParser
import re
import logging

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
                if len(row) < 5:
                    continue

                # 2. Header Detection
                row_lower = [c.lower() for c in row]
                if "particulars" in row_lower and "date" in row_lower:
                    try:
                        self.header_indices = {
                            "date": row_lower.index("date"),
                            "particulars": row_lower.index("particulars"),
                            "withdrawals": next((i for i, h in enumerate(row_lower) if "withdrawal" in h), -1),
                            "deposits": next((i for i, h in enumerate(row_lower) if "deposit" in h), -1),
                            "balance": next((i for i, h in enumerate(row_lower) if "balance" in h), -1),
                        }
                        logger.info(f"✅ Headers identified at indices: {self.header_indices}")
                        continue 
                    except (ValueError, StopIteration):
                        continue

                # 3. Process Transaction Data
                if not self.header_indices:
                    continue

                # Validate Date Column (Supports DD-MMM-YYYY and DD/MM/YYYY)
                date_cell = row[self.header_indices["date"]]
                # Matches: 05-MAY-2025 OR 05/05/2025 OR 05-05-2025
                if not re.match(r"(\d{2}[-/]\d{2}[-/]\d{4})|(\d{2}-[a-zA-Z]{3}-\d{4})", date_cell):
                    continue

                try:
                    # Clean the particulars (remove internal newlines for better regex matching)
                    particulars = row[self.header_indices["particulars"]].replace("\n", " ")
                    
                    # Clean numeric values
                    def clean_num(val):
                        if not val or val.lower() in ["nil", "0", "0.00", ""]: 
                            return 0.0
                        cleaned = "".join(re.findall(r"[\d.]", val))
                        return float(cleaned) if cleaned else 0.0

                    debit = clean_num(row[self.header_indices["withdrawals"]])
                    credit = clean_num(row[self.header_indices["deposits"]])
                    balance = clean_num(row[self.header_indices["balance"]])

                    # Skip only if strictly empty financial line
                    if debit == 0 and credit == 0 and "opening balance" not in particulars.lower():
                        continue

                    txns.append({
                        "bank": "FEDERAL",
                        "date": date_cell,
                        "description": particulars,
                        "debit": debit,
                        "credit": credit,
                        "balance": balance,
                        "type": "CREDIT" if credit > 0 else "DEBIT"
                    })

                except Exception as e:
                    logger.debug(f"Row skip: {e}")
                    continue

        return txns

    def parse(self, pdf):
        all_txns = []
        for page in pdf.pages:
            all_txns.extend(self.parse_page(page))
        return all_txns