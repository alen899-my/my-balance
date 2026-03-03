from .federa import FederalBankParser
from .smart_universal import SmartUniversalParser


def get_parser(bank: str):
    """
    Route to the correct parser based on bank name.

    - Federal Bank → dedicated FederalBankParser (tuned for its lattice grid format)
    - Everything else → SmartUniversalParser (4 pdfplumber strategies + Gemini AI fallback)
    """
    bank_key = bank.upper().strip()

    if "FEDERAL" in bank_key:
        return FederalBankParser()

    # Universal parser carries the bank name for logging and DB storage
    return SmartUniversalParser(bank=bank_key)