from .base import BaseParser

class HDFCParser(BaseParser):
    def parse(self, pdf):
        txns = []

        for page in pdf.pages:
            table = page.extract_table()
            if not table:
                continue

            for row in table[1:]:
                txns.append({
                    "bank": "HDFC",
                    "date": row[0],
                    "description": row[1],
                    "debit": row[4],
                    "credit": row[5],
                    "balance": row[6],
                })

        return txns
