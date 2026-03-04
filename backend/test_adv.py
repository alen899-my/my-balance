import httpx

# 1. Login
login_data = {"username": "test@test.com", "password": "password123"}
try:
    r_auth = httpx.post("http://localhost:8000/api/v1/auth/login", json=login_data)
    token = r_auth.json().get("access_token")

    # 2. Get Advanced Insights
    headers = {"Authorization": f"Bearer {token}"}
    r_adv = httpx.get("http://localhost:8000/insights/advanced", headers=headers)
    print("STATUS:", r_adv.status_code)
    print("RESPONSE:", r_adv.text)
except Exception as e:
    print("ERROR:", e)
