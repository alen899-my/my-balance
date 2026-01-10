from app.models.job import JobStatus
from datetime import datetime

async def create_job(job_id: str):
    job = JobStatus(
        job_id=job_id,
        status="processing",
        message="Starting..."
    )
    await job.insert()

async def update_job(job_id: str, **kwargs):
    job = await JobStatus.find_one(JobStatus.job_id == job_id)
    if job:
        # Update the fields dynamically
        for key, value in kwargs.items():
            setattr(job, key, value)
        job.updated_at = datetime.utcnow()
        await job.save()

async def get_job(job_id: str):
    return await JobStatus.find_one(JobStatus.job_id == job_id)