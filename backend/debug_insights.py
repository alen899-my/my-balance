import httpx
import sys

def run():
    try:
        print("Logging in...")
        resp = httpx.post(
            "http://localhost:8000/auth/login", 
            json={"identifier": "test@test.com", "password": "password123"}
        )
        if resp.status_code != 200:
            print("Login failed!", resp.status_code, resp.text)
            return
            
        token = resp.json().get("token")
        
        print("\nFetching Advanced Insights...")
        headers = {"Authorization": f"Bearer {token}"}
        res = httpx.get("http://localhost:8000/insights/advanced", headers=headers)
        
        print(f"Status: {res.status_code}")
        print("Response Body:")
        print(res.text)
        
    except Exception as e:
        print(f"Script threw exception: {e}", file=sys.stderr)

if __name__ == "__main__":
    run()
