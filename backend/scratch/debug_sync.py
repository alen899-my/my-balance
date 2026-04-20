from pymongo import MongoClient
import os

def check_db():
    uri = 'mongodb+srv://alenjames899_db_user:yoJXZQygFo3Kk08l@cluster0.7ttpoml.mongodb.net/?appName=Cluster0'
    client = MongoClient(uri)
    db = client['bankDb']
    
    total = db.budget_entries.count_documents({})
    print(f"Total Budget Entries in bankDb: {total}")
    
    sample = db.budget_entries.find_one({})
    if sample:
        print(f"Sample Entry: {sample}")
        print(f"User ID: {sample.get('user_id')} (Type: {type(sample.get('user_id'))})")
    else:
        print("Empty collection")

if __name__ == "__main__":
    check_db()
