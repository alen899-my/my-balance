from fastapi.testclient import TestClient
from app.main import app
from app.utils.dependencies import get_current_user

def override(): return {"user_id": "651a2b3c4d5e6f7a8b9c0d1e"}
app.dependency_overrides[get_current_user] = override

client = TestClient(app)
print('--- INSIGHTS ---')
r1 = client.get('/insights')
print(f"Status: {r1.status_code}")
print(r1.text)

print('\n--- ADVANCED ---')
r2 = client.get('/insights/advanced')
print(f"Status: {r2.status_code}")
print(r2.text)
