import hashlib

def make_hash(account_id, txn):
    # 1. Standardize the Date (Ensure it's a string even if passed as a datetime object)
    dt = txn['date']
    date_str = dt.strftime("%Y-%m-%d") if hasattr(dt, 'strftime') else str(dt)

    # 2. Clean the Description
    # Remove all extra spaces/newlines so "UPI / NAME / 123" is same as "UPI/NAME/123"
    clean_desc = "".join(str(txn.get('description', '')).split()).upper()

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