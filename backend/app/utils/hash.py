import hashlib

def make_hash(account_id, txn):
    raw = f"{account_id}|{txn['date']}|{txn['debit']}-{txn['credit']}|{txn['balance']}|{txn['description']}"
    return hashlib.sha256(raw.encode()).hexdigest()
