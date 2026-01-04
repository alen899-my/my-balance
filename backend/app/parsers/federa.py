from .base import BaseParser

class FederalBankParser(BaseParser):
    def parse(self, pdf):
        txns = []
        # Optimization: Pre-define table settings to help pdfplumber find the grid faster
        settings = {
            "vertical_strategy": "lines", 
            "horizontal_strategy": "lines",
        }

        for page in pdf.pages:
            table = page.extract_table(settings)
            if not table or len(table) < 2:
                continue

            # Process headers once per page
            headers = [h.lower().strip() if h else "" for h in table[0]]
            
            # Optimization: Map indices outside the inner loop
            try:
                idx_date = headers.index("date")
                idx_particulars = headers.index("particulars")
                idx_balance = headers.index("balance")
                idx_withdrawals = headers.index("withdrawals") if "withdrawals" in headers else -1
                idx_deposits = headers.index("deposits") if "deposits" in headers else -1
                idx_drcr = headers.index("dr/cr") if "dr/cr" in headers else -1
            except ValueError:
                continue # Not the transaction table page

            for row in table[1:]:
                if not row or not row[idx_date]:
                    continue

                # Fast assignment by index
                date = row[idx_date]
                particulars = row[idx_particulars]
                balance = row[idx_balance]
                debit = row[idx_withdrawals] if idx_withdrawals != -1 else 0
                credit = row[idx_deposits] if idx_deposits != -1 else 0

                if idx_drcr != -1:
                    drcr = row[idx_drcr]
                    amt = debit or credit
                    if drcr == "DR":
                        debit, credit = amt, 0
                    elif drcr == "CR":
                        credit, debit = amt, 0

                txns.append({
                    "bank": "FEDERAL",
                    "date": date,
                    "description": particulars,
                    "debit": debit,
                    "credit": credit,
                    "balance": balance,
                })
        return txns