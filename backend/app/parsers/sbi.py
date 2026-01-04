from .base import BaseParser

class SBIParser(BaseParser):
    def parse(self, pdf):
        txns = []

        for page in pdf.pages:
            lines = page.extract_text().split("\n")
            for l in lines:
                if l[:2].isdigit():
                    parts = l.split()
                    txns.append({
                        "bank": "SBI",
                        "date": parts[0],
                        "description": " ".join(parts[1:-3]),
                        "debit": parts[-3],
                        "credit": parts[-2],
                        "balance": parts[-1],
                    })

        return txns
