from fastapi.testclient import TestClient
from app.main import app
from app.utils.dependencies import get_current_user

def override_get_current_user():
    return {"user_id": "651a2b3c4d5e6f7a8b9c0d1e"} # use any valid objectid format

app.dependency_overrides[get_current_user] = override_get_current_user
client = TestClient(app)

print('--- INSIGHTS ---')
r1 = client.get('/api/v1/insights')
print(r1.status_code)
if r1.status_code != 200: print(r1.text)

print('\n--- ADVANCED ---')
r2 = client.get('/api/v1/insights/advanced')
print(r2.status_code)
if r2.status_code != 200: print(r2.text)
