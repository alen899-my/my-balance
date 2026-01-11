from .federa import FederalBankParser
from .CommonParser import CommonBankParser

def get_parser(bank: str):
    """
    Standardizes the bank string and maps it to the correct parser.
    """
    # Normalize input: "Federal Bank" -> "FEDERAL"
    bank_key = bank.upper()

    # Map possible variations to the Federal Parser
    if "FEDERAL" in bank_key:
        return FederalBankParser()
    
    # Add other specific mappings here if needed in the future
    # elif "HDFC" in bank_key:
    #     return HDFCParser()

    # Default to Common Parser for everything else
    return CommonBankParser()