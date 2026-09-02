import pytest
from app.routers import auth as auth_router
from app.models import User


def test_customer_registration_and_login(client):
    """Customer registers (201 + message), then logs in to get a token."""
    payload = {
        "email": "priya@gmail.com",
        "password": "SecurePassword123",
        "name": "Priya Patel",
        "phone": "+91 9123456780",
        "wedding_date": "2026-12-10",
        "estimated_budget": 750000.0,
    }
    # Register
    res = client.post("/api/auth/register/customer", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert "message" in data
    assert "successfully" in data["message"].lower()

    # Duplicate registration should be rejected
    res_dup = client.post("/api/auth/register/customer", json=payload)
    assert res_dup.status_code == 400
    assert "already" in res_dup.json()["detail"].lower()

    # Login with correct credentials returns token
    login_res = client.post("/api/auth/login", json={
        "email": "priya@gmail.com",
        "password": "SecurePassword123",
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()
    assert login_res.json()["role"] == "customer"

    # Login with invalid password returns 401
    bad_login = client.post("/api/auth/login", json={
        "email": "priya@gmail.com",
        "password": "WrongPassword",
    })
    assert bad_login.status_code == 401


def test_vendor_registration_and_approval_flow(client, db, admin_headers):
    """Vendor registers as Pending, cannot login until admin approves."""
    payload = {
        "email": "sharma_decor@gmail.com",
        "password": "DecorPassword123",
        "name": "Rajesh Sharma",
        "business_name": "Sharma Wedding Decors",
        "category": "Decoration",
        "city": "Delhi",
    }
    res = client.post("/api/auth/register/vendor", json=payload)
    assert res.status_code == 201
    assert "successfully" in res.json()["message"].lower()

    # Look up vendor ID from DB (not in response)
    user = db.query(User).filter(User.email == "sharma_decor@gmail.com").first()
    assert user is not None
    vendor_id = user.id

    # Unapproved vendor cannot login
    login_attempt = client.post("/api/auth/login", json={
        "email": "sharma_decor@gmail.com",
        "password": "DecorPassword123",
    })
    assert login_attempt.status_code == 403
    assert "pending" in login_attempt.json()["detail"].lower()

    # Admin approves vendor
    verify_res = client.post(f"/api/admin/vendors/{vendor_id}/verify", headers=admin_headers)
    assert verify_res.status_code == 200

    # Approved vendor can now login
    login_success = client.post("/api/auth/login", json={
        "email": "sharma_decor@gmail.com",
        "password": "DecorPassword123",
    })
    assert login_success.status_code == 200
    assert login_success.json()["role"] == "vendor"
    assert "access_token" in login_success.json()


def test_protected_route_requires_auth(client):
    """Accessing a protected endpoint without a token returns 401 or 403."""
    res = client.get("/api/customer/profile")
    assert res.status_code in (401, 403)


def test_password_reset_flow(client):
    """Full OTP password-reset cycle: request → bad OTP rejected → correct OTP accepted."""
    # Register
    client.post("/api/auth/register/customer", json={
        "email": "reset_user@gmail.com",
        "password": "InitialPass123",
        "name": "Reset User",
    })

    # Request OTP
    req_res = client.post("/api/auth/password-reset/request", json={"email": "reset_user@gmail.com"})
    assert req_res.status_code == 200

    # Peek OTP from in-memory store (test-only shortcut)
    assert "reset_user@gmail.com" in auth_router.reset_otps
    otp = auth_router.reset_otps["reset_user@gmail.com"]["otp"]
    assert len(otp) == 6

    # Bad OTP is rejected
    bad = client.post("/api/auth/password-reset/confirm", json={
        "email": "reset_user@gmail.com",
        "otp": "000000",
        "new_password": "NewStrongPass123",
    })
    assert bad.status_code == 400

    # Correct OTP is accepted
    good = client.post("/api/auth/password-reset/confirm", json={
        "email": "reset_user@gmail.com",
        "otp": otp,
        "new_password": "NewStrongPass123",
    })
    assert good.status_code == 200
    assert "successfully" in good.json()["message"].lower()

    # Login with new password works
    new_login = client.post("/api/auth/login", json={
        "email": "reset_user@gmail.com",
        "password": "NewStrongPass123",
    })
    assert new_login.status_code == 200
    assert "access_token" in new_login.json()
