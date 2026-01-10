# Simple in-memory job store
# In a production app, use Redis.
jobs = {}

def create_job(job_id: str):
    jobs[job_id] = {
        "status": "processing",
        "total_pages": 0,
        "processed_pages": 0,
        "total_txns": 0,
        "processed_txns": 0,
        "message": "Starting..."
    }

def update_job(job_id: str, **kwargs):
    if job_id in jobs:
        jobs[job_id].update(kwargs)

def get_job(job_id: str):
    return jobs.get(job_id)
