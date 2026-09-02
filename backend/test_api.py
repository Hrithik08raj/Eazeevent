import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("==================================================")
    print("[TEST] Starting Eazeevent API Integration Tests...")
    print("==================================================")
    
    # Check server availability
    try:
        res = requests.get(f"{BASE_URL}/")
        res.raise_for_status()
        print(f"[OK] Backend server is online: {res.json()}")
    except Exception as e:
        print(f"[ERROR] Failed to connect to server at {BASE_URL}. Ensure uvicorn is running.")
        print(f"Error: {e}")
        sys.exit(1)

    session = requests.Session()
    
    # --------------------------------------------------
    # 1. AUTHENTICATION & REGISTRATION
    # --------------------------------------------------
    print("\n--- 1. Testing Registration and Authentication ---")
    
    # Register customer
    cust_payload = {
        "email": "test_customer@gmail.com",
        "password": "Password123",
        "name": "Test Customer User",
        "phone": "+91 9999988888",
        "wedding_date": "2026-12-25",
        "estimated_budget": 500000.0
    }
    res = session.post(f"{BASE_URL}/api/auth/register/customer", json=cust_payload)
    if res.status_code == 201:
        print("[OK] Customer registration successful.")
    elif res.status_code == 400 and "already exists" in res.json().get("detail", ""):
        print("[WARN] Customer already registered (proceeding with existing user).")
    else:
        print(f"[ERROR] Customer registration failed: {res.status_code} - {res.text}")
        sys.exit(1)
        
    # Login customer
    res = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": "test_customer@gmail.com",
        "password": "Password123"
    })
    assert res.status_code == 200, f"Customer login failed: {res.text}"
    cust_token = res.json()["access_token"]
    cust_headers = {"Authorization": f"Bearer {cust_token}"}
    print("[OK] Customer login successful. Token received.")

    # Register vendor (should be pending)
    vend_payload = {
        "email": "test_vendor@gmail.com",
        "password": "Password123",
        "name": "Test Vendor User",
        "business_name": "Test Vendor Studio",
        "category": "Photography",
        "city": "Udaipur"
    }
    res = session.post(f"{BASE_URL}/api/auth/register/vendor", json=vend_payload)
    if res.status_code == 201:
        print("[OK] Vendor registration successful (pending approval).")
    elif res.status_code == 400 and "already exists" in res.json().get("detail", ""):
        print("[WARN] Vendor already registered (proceeding).")
    else:
        print(f"[ERROR] Vendor registration failed: {res.status_code} - {res.text}")
        sys.exit(1)

    # Attempt logging in as pending vendor - should fail
    res = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": "test_vendor@gmail.com",
        "password": "Password123"
    })
    # If the vendor was already verified in a previous run, this will be 200, which is fine
    if res.status_code == 403:
        print("[OK] Pending vendor login blocked successfully (expected behavior).")
    elif res.status_code == 200:
        print("[WARN] Vendor login succeeded (already verified in database).")
    else:
        print(f"[ERROR] Unexpected vendor login response: {res.status_code} - {res.text}")
        sys.exit(1)

    # --------------------------------------------------
    # 2. CUSTOMER PORTAL
    # --------------------------------------------------
    print("\n--- 2. Testing Customer Profile & Budget CRUD ---")
    
    # Get Customer Profile
    res = session.get(f"{BASE_URL}/api/customer/profile", headers=cust_headers)
    assert res.status_code == 200, f"Get profile failed: {res.text}"
    print(f"[OK] Retrieved customer profile: {res.json()['name']}, Wedding: {res.json()['wedding_date']}")
    
    # Update Customer Profile
    updated_profile = {
        "name": "Updated Customer Name",
        "phone": "+91 8888877777",
        "wedding_date": "2027-01-01",
        "estimated_budget": 600000.0
    }
    res = session.put(f"{BASE_URL}/api/customer/profile", json=updated_profile, headers=cust_headers)
    assert res.status_code == 200, f"Update profile failed: {res.text}"
    assert res.json()["name"] == "Updated Customer Name"
    print("[OK] Updated customer profile successfully.")

    # Create Expense
    expense_data = {
        "name": "Wedding Ring",
        "category": "Jewelry",
        "cost": 50000.0,
        "paid_amount": 20000.0,
        "status": "Pending"
    }
    res = session.post(f"{BASE_URL}/api/customer/expenses", json=expense_data, headers=cust_headers)
    assert res.status_code == 200, f"Create expense failed: {res.text}"
    expense_id = res.json()["id"]
    print(f"[OK] Created expense '{res.json()['name']}' (ID: {expense_id}).")
    
    # Get Expenses
    res = session.get(f"{BASE_URL}/api/customer/expenses", headers=cust_headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1
    print(f"[OK] Retrieved expense list. Total items: {len(res.json())}")

    # Update Expense
    expense_data["paid_amount"] = 50000.0
    expense_data["status"] = "Paid"
    res = session.put(f"{BASE_URL}/api/customer/expenses/{expense_id}", json=expense_data, headers=cust_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "Paid"
    print("[OK] Updated expense successfully.")

    # Delete Expense
    res = session.delete(f"{BASE_URL}/api/customer/expenses/{expense_id}", headers=cust_headers)
    assert res.status_code == 200
    print("[OK] Deleted expense successfully.")
    
    # Verify profile budget recalculated
    res = session.get(f"{BASE_URL}/api/customer/profile", headers=cust_headers)
    assert res.json()["actual_budget"] == 0.0
    print("[OK] Budget auto-recalculated after deletion.")

    # --------------------------------------------------
    # 3. GUESTS & CHECKLIST
    # --------------------------------------------------
    print("\n--- 3. Testing Guests & Checklist Items ---")
    
    # Create Guest
    guest_data = {
        "name": "John Doe",
        "phone": "+91 9991112223",
        "email": "johndoe@gmail.com",
        "rsvp_status": "Pending",
        "invitation_sent": False
    }
    res = session.post(f"{BASE_URL}/api/customer/guests", json=guest_data, headers=cust_headers)
    assert res.status_code == 200, f"Create guest failed: {res.text}"
    guest_id = res.json()["id"]
    print(f"[OK] Created guest '{res.json()['name']}' (ID: {guest_id}).")
    
    # Update Guest
    guest_data["rsvp_status"] = "Attending"
    guest_data["invitation_sent"] = True
    res = session.put(f"{BASE_URL}/api/customer/guests/{guest_id}", json=guest_data, headers=cust_headers)
    assert res.status_code == 200
    assert res.json()["rsvp_status"] == "Attending"
    print("[OK] Updated guest successfully.")
    
    # Delete Guest
    res = session.delete(f"{BASE_URL}/api/customer/guests/{guest_id}", headers=cust_headers)
    assert res.status_code == 200
    print("[OK] Deleted guest successfully.")

    # Create Checklist Item
    item_data = {
        "title": "Book Florist",
        "category": "Decorations",
        "status": "Pending",
        "due_date": "2026-10-10"
    }
    res = session.post(f"{BASE_URL}/api/customer/checklist", json=item_data, headers=cust_headers)
    assert res.status_code == 200, f"Create checklist failed: {res.text}"
    item_id = res.json()["id"]
    print(f"[OK] Created checklist item '{res.json()['title']}' (ID: {item_id}).")
    
    # Update Checklist Item
    item_data["status"] = "Completed"
    res = session.put(f"{BASE_URL}/api/customer/checklist/{item_id}", json=item_data, headers=cust_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "Completed"
    print("[OK] Updated checklist item successfully.")
    
    # Delete Checklist Item
    res = session.delete(f"{BASE_URL}/api/customer/checklist/{item_id}", headers=cust_headers)
    assert res.status_code == 200
    print("[OK] Deleted checklist item successfully.")

    # --------------------------------------------------
    # 4. ADMIN APPROVALS & VENDOR MANAGEMENT
    # --------------------------------------------------
    print("\n--- 4. Testing Admin Portal & Vendor Approvals ---")
    
    # Login Admin
    res = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@eazeevent.com",
        "password": "admin123"
    })
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    admin_token = res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[OK] Admin login successful.")

    # Retrieve Admin Stats
    res = session.get(f"{BASE_URL}/api/admin/overview", headers=admin_headers)
    assert res.status_code == 200
    print(f"[OK] Admin Stats: Total Customers: {res.json()['total_customers']}, Total Vendors: {res.json()['total_vendors']}")

    # Get Pending/All Vendors
    res = session.get(f"{BASE_URL}/api/admin/vendors", headers=admin_headers)
    assert res.status_code == 200
    vendors = res.json()
    test_vendor_rec = next((v for v in vendors if v["email"] == "test_vendor@gmail.com"), None)
    assert test_vendor_rec is not None
    test_vendor_id = test_vendor_rec["id"]
    print(f"[OK] Found test vendor in admin list (ID: {test_vendor_id}, Status: {test_vendor_rec['status']})")
    
    # Verify/Approve Vendor if not already verified
    if test_vendor_rec["status"] == "Pending":
        res = session.post(f"{BASE_URL}/api/admin/vendors/{test_vendor_id}/verify", headers=admin_headers)
        assert res.status_code == 200
        print("[OK] Admin verified the vendor successfully.")
    else:
        print("[WARN] Vendor already verified.")

    # Log in as test vendor now - should succeed
    res = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": "test_vendor@gmail.com",
        "password": "Password123"
    })
    assert res.status_code == 200, f"Vendor login failed after verification: {res.text}"
    vend_token = res.json()["access_token"]
    vend_headers = {"Authorization": f"Bearer {vend_token}"}
    print("[OK] Verified Vendor login successful.")

    # --------------------------------------------------
    # 5. MARKETPLACE & LEAD COMMUNICATON
    # --------------------------------------------------
    print("\n--- 5. Testing Marketplace & Lead Operations ---")
    
    # Public directory search
    res = requests.get(f"{BASE_URL}/api/vendors?category=Photography&city=Udaipur")
    assert res.status_code == 200
    assert len(res.json()) >= 1
    print(f"[OK] Search directory works. Found verified Udaipur Photographers: {len(res.json())}")

    # Create Inquiry from customer to test vendor
    inquiry_payload = {
        "vendor_id": test_vendor_id,
        "pkg": "Wedding Coverage",
        "date": "Dec 25, 2026",
        "location": "Udaipur Palace",
        "budget": 150000.0
    }
    res = session.post(f"{BASE_URL}/api/customer/inquiries", json=inquiry_payload, headers=cust_headers)
    assert res.status_code == 200, f"Inquiry submission failed: {res.text}"
    inquiry_id = res.json()["id"]
    print(f"[OK] Submitted customer inquiry to vendor (Inquiry ID: {inquiry_id}).")

    # Read inquiries as vendor
    res = session.get(f"{BASE_URL}/api/vendors/portal/inquiries", headers=vend_headers)
    assert res.status_code == 200
    assert any(i["id"] == inquiry_id for i in res.json())
    print("[OK] Vendor retrieved inquiry successfully.")

    # Update inquiry status as vendor to Booked
    res = session.put(f"{BASE_URL}/api/vendors/portal/inquiries/{inquiry_id}", json={"status": "Booked"}, headers=vend_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "Booked"
    print("[OK] Vendor updated inquiry to 'Booked' successfully.")

    # Verify booking auto-created for customer
    res = session.get(f"{BASE_URL}/api/customer/bookings", headers=cust_headers)
    assert res.status_code == 200
    assert any(b["package_name"] == "Wedding Coverage" for b in res.json())
    print("[OK] Customer booking automatically generated and verified.")

    # Test PDF Invoice Generation
    customer_bookings = res.json()
    created_booking = next((b for b in customer_bookings if b["package_name"] == "Wedding Coverage"), None)
    if created_booking:
        booking_id = created_booking["id"]
        res = session.get(f"{BASE_URL}/api/invoices/booking/{booking_id}", headers=cust_headers)
        assert res.status_code == 200, f"Invoice PDF download failed: {res.text}"
        assert res.headers.get("content-type") == "application/pdf"
        assert res.content[:4] == b"%PDF"
        print(f"[OK] Customer successfully generated and downloaded Booking PDF Receipt ({len(res.content)} bytes).")

    # --------------------------------------------------
    # 6. ADMIN IMPERSONATION & SETTINGS
    # --------------------------------------------------
    print("\n--- 6. Testing Impersonation & Admin Settings ---")
    
    # Admin impersonates customer
    res = session.post(f"{BASE_URL}/api/admin/impersonate/test_customer@gmail.com", headers=admin_headers)
    assert res.status_code == 200, f"Impersonation failed: {res.text}"
    impersonate_token = res.json()["access_token"]
    assert res.json()["impersonating"] is True
    print(f"[OK] Admin generated impersonation token for customer successfully.")
    
    # Read Admin Settings
    res = session.get(f"{BASE_URL}/api/admin/settings", headers=admin_headers)
    assert res.status_code == 200
    current_settings = res.json()
    print(f"[OK] Admin Settings retrieved successfully.")

    # Update Admin Settings
    current_settings["currency_symbol"] = "$"
    current_settings["platform_name"] = "Eazeevent Luxe"
    res = session.put(f"{BASE_URL}/api/admin/settings", json=current_settings, headers=admin_headers)
    assert res.status_code == 200
    assert res.json()["currency_symbol"] == "$"
    print("[OK] Admin Settings updated successfully.")

    # Restore Admin Settings
    current_settings["currency_symbol"] = "₹"
    current_settings["platform_name"] = "Eazeevent"
    res = session.put(f"{BASE_URL}/api/admin/settings", json=current_settings, headers=admin_headers)
    assert res.status_code == 200
    print("[OK] Admin Settings restored back to defaults.")

    # --------------------------------------------------
    # 7. AI SERVICES & MATCHMAKER
    # --------------------------------------------------
    print("\n--- 7. Testing AI Services & Matchmaker ---")
    
    # Test 7.1 AI Concierge Chat (Local Heuristics Fallback Search)
    chat_payload = {
        "message": "Find verified Photography vendors in Udaipur",
        "customer_email": "test_customer@gmail.com"
    }
    res = session.post(f"{BASE_URL}/api/ai/chat", json=chat_payload)
    assert res.status_code == 200, f"AI Chat failed: {res.text}"
    assert "Test Vendor Studio" in res.json()["reply"], f"Fallback search failed: {res.json()['reply']}"
    print("[OK] AI Concierge Chat local fallback works.")
    
    # Test 7.2 AI Caption Generator
    caption_payload = {
        "prompt": "Beautiful sunset wedding at Juhu beach",
        "tone": "Romantic & Elegant"
    }
    res = session.post(f"{BASE_URL}/api/ai/generate-caption", json=caption_payload)
    assert res.status_code == 200, f"AI Caption Generator failed: {res.text}"
    assert "#" in res.json()["caption"], "Generated caption missing hashtags."
    print("[OK] AI Caption Generator works.")
    
    # Test 7.3 AI Vendor Matchmaker
    res = session.get(f"{BASE_URL}/api/ai/match-vendors", headers=cust_headers)
    assert res.status_code == 200, f"AI Matchmaker failed: {res.text}"
    assert len(res.json()) >= 1, "AI Matchmaker returned no matches."
    match_rec = res.json()[0]
    assert "match_percentage" in match_rec
    assert "business_name" in match_rec
    print(f"[OK] AI Matchmaker works. Top match: {match_rec['business_name']} ({match_rec['match_percentage']}% Match)")

    print("\n==================================================")
    print("[SUCCESS] All Eazeevent Integration Tests Passed!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
