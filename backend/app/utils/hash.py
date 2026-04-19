import hashlib
import re

def make_hash(account_id, txn):
    # 1. Standardize the Date (Ensure it's a string even if passed as a datetime object)
    dt = txn['date']
    date_str = dt.strftime("%Y-%m-%d") if hasattr(dt, 'strftime') else str(dt)

    # 2. Ultra-Clean the Description
    # We remove all special characters and collapse all whitespace to ensure 
    # that "UPI / NAME / 123" and "UPI/NAME/123" result in the same hash.
    # This protects against different PDF parsers yielding slightly different spacing.
    raw_desc = str(txn.get('description', '')).upper()
    clean_desc = "".join(re.findall(r'[A-Z0-9]', raw_desc))

    # 3. Create a unique pipe-separated string
    # We use 0.0 to avoid hash misses between "0" and "0.0"
    raw = (
        f"{str(account_id)}|"
        f"{date_str}|"
        f"{float(txn.get('debit', 0)):.2f}|"
        f"{float(txn.get('credit', 0)):.2f}|"
        f"{float(txn.get('balance', 0)):.2f}|"
        f"{clean_desc}"
    )

    return hashlib.sha256(raw.encode()).hexdigest()