from .hdfc import HDFCParser
from .sbi import SBIParser
from .icici import ICICIParser
from .federa import FederalBankParser

def get_parser(bank):
    return {
        "HDFC": HDFCParser(),
        "SBI": SBIParser(),
        "ICICI": ICICIParser(),
        "FEDERAL": FederalBankParser(),
    }[bank]
