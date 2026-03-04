import asyncio
from app.db.session import init_db
from fastapi.testclient import TestClient
from app.main import app
from app.utils.dependencies import get_current_user

def override(): return {"user_id": "67b9fe7d344af95155694a53"}
app.dependency_overrides[get_current_user] = override

async def run_test():
    await init_db()
    client = TestClient(app)
    print('\n--- ADVANCED ---')
    r2 = client.get('/insights/advanced')
    print(f"Status: {r2.status_code}")
    print(r2.text)

if __name__ == '__main__':
    asyncio.run(run_test())
