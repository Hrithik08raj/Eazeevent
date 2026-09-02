import pytest


def test_admin_overview_stats(client, admin_headers, test_customer, test_vendor):
    """Admin overview returns correct stat fields."""
    res = client.get("/api/admin/overview", headers=admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total_customers" in data
    assert "total_vendors" in data
    assert "verified_vendors" in data
    assert "commission_earned" in data
    assert data["total_customers"] >= 1
    assert data["total_vendors"] >= 1


def test_admin_vendor_list_and_verify(client, admin_headers, db):
    """Admin can list vendors and verify a pending one."""
    from app.models import User

    # Register a new vendor
    reg = client.post("/api/auth/register/vendor", json={
        "email": "new_vendor@test.com",
        "password": "Password123",
        "name": "New Vendor",
        "business_name": "New Vendor Studio",
        "category": "Catering",
        "city": "Jaipur",
    })
    assert reg.status_code == 201

    # Get vendor ID from DB (not returned in registration response)
    user = db.query(User).filter(User.email == "new_vendor@test.com").first()
    assert user is not None
    vendor_id = user.id

    # Admin sees vendor in list
    list_res = client.get("/api/admin/vendors", headers=admin_headers)
    assert list_res.status_code == 200
    found = next((v for v in list_res.json() if v["id"] == vendor_id), None)
    assert found is not None
    assert found["status"] == "Pending"

    # Admin verifies
    verify_res = client.post(f"/api/admin/vendors/{vendor_id}/verify", headers=admin_headers)
    assert verify_res.status_code == 200

    # Status updated
    list_after = client.get("/api/admin/vendors", headers=admin_headers)
    updated = next(v for v in list_after.json() if v["id"] == vendor_id)
    assert updated["status"] == "Verified"


def test_admin_customer_status_update(client, admin_headers, test_customer):
    """Admin can update customer risk status."""
    res = client.put(
        f"/api/admin/customers/{test_customer['email']}/status",
        json={"status": "Flagged", "risk_description": "Suspicious activity"},
        headers=admin_headers,
    )
    assert res.status_code == 200

    # Verify via customer list
    customers = client.get("/api/admin/customers", headers=admin_headers)
    cust = next((c for c in customers.json() if c["email"] == test_customer["email"]), None)
    assert cust["status"] == "Flagged"
    assert cust["risk_description"] == "Suspicious activity"


def test_admin_impersonation(client, admin_headers, test_customer):
    """Admin impersonation returns a valid token for the target customer."""
    res = client.post(
        f"/api/admin/impersonate/{test_customer['email']}",
        headers=admin_headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["impersonating"] is True
    assert data["role"] == "customer"

    # Impersonation token can access customer profile
    imp_headers = {"Authorization": f"Bearer {data['access_token']}"}
    profile_res = client.get("/api/customer/profile", headers=imp_headers)
    assert profile_res.status_code == 200


def test_admin_settings_crud(client, admin_headers):
    """Admin can read and update platform settings."""
    # Read
    res = client.get("/api/admin/settings", headers=admin_headers)
    assert res.status_code == 200
    settings = res.json()
    assert settings["platform_name"] == "Eazeevent"

    # Update
    settings["platform_name"] = "Eazeevent Pro"
    settings["commission_rate"] = 7.5
    upd = client.put("/api/admin/settings", json=settings, headers=admin_headers)
    assert upd.status_code == 200
    assert upd.json()["platform_name"] == "Eazeevent Pro"

    # Restore
    settings["platform_name"] = "Eazeevent"
    settings["commission_rate"] = 5.0
    client.put("/api/admin/settings", json=settings, headers=admin_headers)


def test_non_admin_cannot_access_admin_routes(client, test_customer, test_vendor):
    """Neither customer nor vendor can access admin endpoints."""
    for headers in (test_customer["headers"], test_vendor["headers"]):
        res = client.get("/api/admin/overview", headers=headers)
        assert res.status_code == 403
