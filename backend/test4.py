import httpx
try:
    print('Testing...')
    login = httpx.post("http://localhost:8000/auth/login", json={"username": "test@test.com", "password": "password123"})
    print('Login:', login.status_code)
    token = login.json().get('access_token')
    
    act = httpx.get("http://localhost:8000/insights/advanced", headers={"Authorization": f"Bearer {token}"})
    print('Advanced:', act.status_code)
    print(act.text)
except Exception as e:
    print(f"Exception: {e}")
