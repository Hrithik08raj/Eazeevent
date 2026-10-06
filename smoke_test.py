import requests
import sys
import uuid
import sys
import io

# Fix encoding for Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "https://eazeevent-backend.onrender.com"

def run_smoke_test():
    print(f"Starting smoke test against {BASE_URL}...\n")
    session = requests.Session()

    # Create a unique email to avoid "already exists" errors on repeated runs
    unique_id = str(uuid.uuid4())[:8]
    cust_email = f"smoke_customer_{unique_id}@gmail.com"
    vend_email = f"smoke_vendor_{unique_id}@gmail.com"

    # 1. Register a test customer
    print("1. Registering test customer...")
    cust_payload = {
        "email": cust_email,
        "password": "Password123",
        "name": "Smoke Test Customer",
        "phone": "+91 9999988888",
        "wedding_date": "2026-12-25",
        "estimated_budget": 500000.0
    }
    res = session.post(f"{BASE_URL}/api/auth/register/customer", json=cust_payload)
    if not res.ok:
        print(f"FAILED to register customer: {res.status_code} - {res.text}")
        sys.exit(1)
    print("[OK] Customer registered successfully.\n")

    # 2. Log in
    print("2. Logging in as customer...")
    res = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": cust_email,
        "password": "Password123"
    })
    if not res.ok:
        print(f"FAILED to login customer: {res.status_code} - {res.text}")
        sys.exit(1)
    cust_token = res.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    print("[OK] Customer logged in successfully.\n")

    # 3. Hit GET /api/vendors
    print("3. Fetching public vendors list...")
    res = session.get(f"{BASE_URL}/api/vendors")
    if not res.ok:
        print(f"FAILED to fetch vendors: {res.status_code} - {res.text}")
        sys.exit(1)
    print(f"[OK] Vendors fetched successfully. Count: {len(res.json())}\n")

    print("4. Testing Admin and Vendor endpoints...")
    # Admin login (uses the seeded admin account)
    print("  -> Logging in as Admin...")
    res = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@eazeevent.com",
        "password": "admin123"
    })
    if not res.ok:
        print(f"FAILED to login admin: {res.status_code} - {res.text}")
        sys.exit(1)
    admin_token = res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("  [OK] Admin logged in successfully.")

    # Admin endpoint test: Hit /api/admin/overview
    print("  -> Hitting admin endpoint /api/admin/overview...")
    res = session.get(f"{BASE_URL}/api/admin/overview", headers=admin_headers)
    if not res.ok:
        print(f"FAILED to fetch admin overview: {res.status_code} - {res.text}")
        sys.exit(1)
    print("  [OK] Admin endpoint successful.\n")

    # Now for a vendor endpoint, we first register a vendor
    print("  -> Registering test vendor...")
    vend_payload = {
        "email": vend_email,
        "password": "Password123",
        "name": "Smoke Test Vendor",
        "business_name": "Smoke Studio",
        "category": "Photography",
        "city": "Udaipur"
    }
    res = session.post(f"{BASE_URL}/api/auth/register/vendor", json=vend_payload)
    if not res.ok:
        print(f"FAILED to register vendor: {res.status_code} - {res.text}")
        sys.exit(1)
    
    # We need to find the vendor ID to approve it
    res = session.get(f"{BASE_URL}/api/admin/vendors", headers=admin_headers)
    if not res.ok:
        print(f"FAILED to fetch admin vendors list: {res.status_code} - {res.text}")
        sys.exit(1)
    
    vend_id = next(v["id"] for v in res.json() if v["email"] == vend_email)
    
    # Approve the vendor as admin
    print("  -> Admin verifying vendor...")
    res = session.post(f"{BASE_URL}/api/admin/vendors/{vend_id}/verify", headers=admin_headers)
    if not res.ok:
        print(f"FAILED to verify vendor: {res.status_code} - {res.text}")
        sys.exit(1)
        
    # Login as Vendor
    print("  -> Logging in as verified vendor...")
    res = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": vend_email,
        "password": "Password123"
    })
    if not res.ok:
        print(f"FAILED to login vendor: {res.status_code} - {res.text}")
        sys.exit(1)
    vend_token = res.json()["access_token"]
    vend_headers = {"Authorization": f"Bearer {vend_token}"}
    
    # Hit Vendor endpoint: /api/vendors/portal/profile
    print("  -> Hitting vendor endpoint /api/vendors/portal/profile...")
    res = session.get(f"{BASE_URL}/api/vendors/portal/profile", headers=vend_headers)
    if not res.ok:
        print(f"FAILED to fetch vendor profile: {res.status_code} - {res.text}")
        sys.exit(1)
    print(f"  [OK] Vendor endpoint successful. Business name: {res.json()['business_name']}\n")

    print("[SUCCESS] ALL SMOKE TESTS PASSED!")

if __name__ == "__main__":
    run_smoke_test()
