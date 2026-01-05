from .base import BaseParser

class FederalBankParser(BaseParser):
    def parse(self, pdf):
        txns = []
        # Use 'text' strategy if lines aren't perfect in Federal Bank PDFs
        settings = {
            "vertical_strategy": "text", 
            "horizontal_strategy": "text",
        }

        for page in pdf.pages:
            table = page.extract_table(settings)
            if not table or len(table) < 2:
                continue

            headers = [h.lower().strip() if h else "" for h in table[0]]
            
            try:
                idx_date = headers.index("date")
                idx_particulars = headers.index("particulars")
                idx_balance = headers.index("balance")
                # Handle cases where Withdrawals/Deposits are merged or separate
                idx_withdrawals = next((i for i, h in enumerate(headers) if "withdrawal" in h), -1)
                idx_deposits = next((i for i, h in enumerate(headers) if "deposit" in h), -1)
                idx_drcr = next((i for i, h in enumerate(headers) if "dr/cr" in h), -1)
            except ValueError:
                continue 

            last_txn = None

            for row in table[1:]:
                # If Date is empty but Particulars exists, it's a multi-line description
                if not row[idx_date] and last_txn and row[idx_particulars]:
                    last_txn["description"] += " " + row[idx_particulars]
                    continue

                if not row[idx_date] or "Opening Balance" in str(row[idx_particulars]):
                    continue

                date = row[idx_date]
                particulars = row[idx_particulars]
                balance = row[idx_balance]
                
                # Capture raw amounts
                raw_withdrawal = row[idx_withdrawals] if idx_withdrawals != -1 else "0"
                raw_deposit = row[idx_deposits] if idx_deposits != -1 else "0"
                
                # Logic to clean and assign based on Dr/Cr column
                drcr = str(row[idx_drcr]).strip().upper() if idx_drcr != -1 else ""
                
                # Default assignment
                debit = raw_withdrawal
                credit = raw_deposit

                # Federal Bank often puts the amount in one column and uses Dr/Cr to define type
                if drcr == "CR":
                    credit = raw_withdrawal or raw_deposit
                    debit = 0
                elif drcr == "DR":
                    debit = raw_withdrawal or raw_deposit
                    credit = 0

                last_txn = {
                    "bank": "FEDERAL",
                    "date": date,
                    "description": particulars,
                    "debit": debit,
                    "credit": credit,
                    "balance": balance,
                }
                txns.append(last_txn)
                
        return txns
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