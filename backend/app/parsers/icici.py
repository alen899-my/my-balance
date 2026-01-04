from .base import BaseParser

class ICICIParser(BaseParser):
    def parse(self, pdf):
        txns = []
        for page in pdf.pages:
            table = page.extract_table()
            if not table:
                continue

            for row in table[1:]:
                txns.append({
                    "bank": "ICICI",
                    "date": row[0],
                    "description": row[2],
                    "debit": row[5],
                    "credit": row[6],
                    "balance": row[7],
                })

        return txns
