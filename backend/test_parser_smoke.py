"""
Smoke test for SmartUniversalParser and GeminiParser.
Run from the backend directory with: venv\Scripts\python test_parser_smoke.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Load env vars (simulate dotenv)
from dotenv import load_dotenv
load_dotenv()

from datetime import datetime
from unittest.mock import MagicMock

# ---------------------------------------------------------------------------
# Test 1: SmartUniversalParser with a mock HDFC-style grid table
# ---------------------------------------------------------------------------
print("\n--- TEST 1: SmartUniversalParser (grid table, HDFC style) ---")

from app.parsers.smart_universal import SmartUniversalParser

# Build a mock pdfplumber page
def make_mock_page(rows, has_text=True):
    page = MagicMock()
    page.page_number = 1

    def extract_tables(settings=None):
        return [rows]

    def extract_text():
        return "Sample page text for Gemini fallback"

    page.extract_tables = extract_tables
    page.extract_text = extract_text
    return page

# HDFC-style: Date | Narration | Chq/Ref | Value Dt | Withdrawal | Deposit | Closing Balance
hdfc_table = [
    ["Date", "Narration", "Chq/Ref No.", "Value Dt", "Withdrawal Amt.", "Deposit Amt.", "Closing Balance"],
    ["01-01-2025", "UPI/123456/FLIPKART/flipkart@okicici", "REF123", "01-01-2025", "2,500.00", "", "47,500.00"],
    ["03-01-2025", "SALARY CREDIT/EMPLOYER", "REF456", "03-01-2025", "", "50,000.00", "97,500.00"],
    ["05-01-2025", "ATM WITHDRAWAL/SBI ATM", "REF789", "05-01-2025", "1,000.00", "", "96,500.00"],
]

parser = SmartUniversalParser(bank="HDFC")
mock_page = make_mock_page(hdfc_table)
result = parser.parse_page(mock_page)

assert len(result) == 3, f"Expected 3 txns, got {len(result)}: {result}"
assert result[0]["debit"] == 2500.0, f"Expected 2500 debit, got {result[0]['debit']}"
assert result[1]["credit"] == 50000.0, f"Expected 50000 credit, got {result[1]['credit']}"
assert result[2]["bank"] == "HDFC"
print(f"  ✅ PASS: Extracted {len(result)} HDFC transactions")

# ---------------------------------------------------------------------------
# Test 2: SmartUniversalParser single-amount column (SBI/Kotak style)
# ---------------------------------------------------------------------------
print("\n--- TEST 2: SmartUniversalParser (single Amount column, SBI style) ---")

sbi_table = [
    ["Date", "Description", "Ref No.", "Amount", "Balance"],
    ["10-01-2025", "UPI Payment to Swiggy", "789012", "350.00 Dr", "46,150.00"],
    ["15-01-2025", "IMPS Credit from John", "345678", "5,000.00 Cr", "51,150.00"],
]

parser2 = SmartUniversalParser(bank="SBI")
mock_page2 = make_mock_page(sbi_table)
result2 = parser2.parse_page(mock_page2)

assert len(result2) == 2, f"Expected 2 txns, got {len(result2)}: {result2}"
assert result2[0]["debit"] == 350.0, f"Expected 350 debit, got {result2[0]['debit']}"
assert result2[1]["credit"] == 5000.0, f"Expected 5000 credit, got {result2[1]['credit']}"
print(f"  ✅ PASS: Extracted {len(result2)} SBI transactions with single-amount column")

# ---------------------------------------------------------------------------
# Test 3: GeminiParser JSON parsing (no actual API call)
# ---------------------------------------------------------------------------
print("\n--- TEST 3: GeminiParser JSON parsing (mock API) ---")

from app.parsers.gemini_parser import GeminiParser

gemini_json_response = """[
  {"date": "12-01-2025", "description": "NEFT Transfer to Alice", "debit": 3000.0, "credit": 0, "balance": 44150.0},
  {"date": "18-01-2025", "description": "Interest Credit", "debit": 0, "credit": 125.5, "balance": 44275.5}
]"""

mock_response = MagicMock()
mock_response.text = gemini_json_response

mock_client = MagicMock()
mock_client.models.generate_content.return_value = mock_response

gp = GeminiParser()
gp._client = mock_client  # inject mock

txns = gp.parse_page_text("Dummy page text", bank="AXIS")
assert len(txns) == 2, f"Expected 2 txns, got {len(txns)}"
assert txns[0]["debit"] == 3000.0
assert txns[1]["credit"] == 125.5
assert isinstance(txns[0]["date"], datetime), f"date should be datetime, got {type(txns[0]['date'])}"
print(f"  ✅ PASS: GeminiParser correctly parsed {len(txns)} transactions from JSON")

# ---------------------------------------------------------------------------
# Test 4: GeminiParser graceful error handling
# ---------------------------------------------------------------------------
print("\n--- TEST 4: GeminiParser error fallback ---")
mock_client2 = MagicMock()
mock_client2.models.generate_content.side_effect = Exception("API timeout")

gp2 = GeminiParser()
gp2._client = mock_client2

result4 = gp2.parse_page_text("some page text", bank="KOTAK")
assert result4 == [], f"Expected empty list on error, got {result4}"
print(f"  ✅ PASS: GeminiParser returned [] gracefully on API error")

# ---------------------------------------------------------------------------
# Test 5: Factory routing
# ---------------------------------------------------------------------------
print("\n--- TEST 5: Factory routing ---")
from app.parsers.factory import get_parser
from app.parsers.federa import FederalBankParser
from app.parsers.smart_universal import SmartUniversalParser

p_federal = get_parser("Federal Bank")
p_hdfc    = get_parser("HDFC")
p_sbi     = get_parser("SBI")
p_axis    = get_parser("AXIS BANK")

assert isinstance(p_federal, FederalBankParser), f"Expected FederalBankParser, got {type(p_federal)}"
assert isinstance(p_hdfc, SmartUniversalParser), f"Expected SmartUniversalParser for HDFC, got {type(p_hdfc)}"
assert isinstance(p_sbi, SmartUniversalParser),  f"Expected SmartUniversalParser for SBI, got {type(p_sbi)}"
assert isinstance(p_axis, SmartUniversalParser), f"Expected SmartUniversalParser for AXIS, got {type(p_axis)}"
assert p_hdfc.bank == "HDFC"
assert p_axis.bank == "AXIS BANK"
print(f"  ✅ PASS: Factory routes correctly for all banks")

print("\n🎉 ALL TESTS PASSED!\n")
