import pytest


def _make_booking(client, test_customer, test_vendor):
    """Helper: customer submits inquiry → vendor marks Booked → booking is auto-created."""
    cust_headers = test_customer["headers"]
    vend_headers = test_vendor["headers"]
    vendor_id = test_vendor["id"]

    # Customer submits inquiry
    inq_res = client.post("/api/customer/inquiries", json={
        "vendor_id": vendor_id,
        "pkg": "Royal Package",
        "date": "2026-12-20",
        "location": "Mumbai Palace",
        "budget": 200000.0,
    }, headers=cust_headers)
    assert inq_res.status_code == 200
    inquiry_id = inq_res.json()["id"]

    # Vendor marks inquiry as Booked
    upd = client.put(
        f"/api/vendors/portal/inquiries/{inquiry_id}",
        json={"status": "Booked"},
        headers=vend_headers,
    )
    assert upd.status_code == 200

    # Get booking
    bookings = client.get("/api/customer/bookings", headers=cust_headers)
    booking = next((b for b in bookings.json() if b["package_name"] == "Royal Package"), None)
    assert booking is not None
    return booking, inquiry_id


def test_marketplace_vendor_search(client, test_vendor):
    """Public vendor directory endpoint filters by category and city."""
    res = client.get("/api/vendors?category=Photography&city=Mumbai")
    assert res.status_code == 200
    vendors = res.json()
    assert any(v["business_name"] == "Lumiere Photo Studio" for v in vendors)


def test_inquiry_and_booking_flow(client, test_customer, test_vendor):
    """Customer inquiry → vendor marks Booked → booking auto-created."""
    booking, _ = _make_booking(client, test_customer, test_vendor)
    assert booking["status"] == "Confirmed"


def test_vendor_can_read_inquiry(client, test_customer, test_vendor):
    """Vendor sees inquiry in their portal."""
    cust_headers = test_customer["headers"]
    vend_headers = test_vendor["headers"]

    inq_res = client.post("/api/customer/inquiries", json={
        "vendor_id": test_vendor["id"],
        "pkg": "Basic Coverage",
        "date": "2027-02-14",
        "location": "Bandra",
        "budget": 80000.0,
    }, headers=cust_headers)
    assert inq_res.status_code == 200
    inq_id = inq_res.json()["id"]

    vend_inqs = client.get("/api/vendors/portal/inquiries", headers=vend_headers)
    assert vend_inqs.status_code == 200
    assert any(i["id"] == inq_id for i in vend_inqs.json())


def test_pdf_invoice_generation(client, test_customer, test_vendor):
    """Customer can download a valid PDF invoice for their booking."""
    booking, _ = _make_booking(client, test_customer, test_vendor)
    booking_id = booking["id"]

    res = client.get(
        f"/api/invoices/booking/{booking_id}",
        headers=test_customer["headers"],
    )
    assert res.status_code == 200
    assert res.headers.get("content-type") == "application/pdf"
    assert res.content[:4] == b"%PDF"
    assert len(res.content) > 500


def test_invoice_ownership_enforced(client, test_customer, test_vendor, admin_headers):
    """A different customer cannot access another customer's invoice."""
    booking, _ = _make_booking(client, test_customer, test_vendor)
    booking_id = booking["id"]

    # Register a second customer
    client.post("/api/auth/register/customer", json={
        "email": "other@gmail.com",
        "password": "OtherPass123",
        "name": "Other Customer",
    })
    other_login = client.post("/api/auth/login", json={
        "email": "other@gmail.com",
        "password": "OtherPass123",
    })
    other_headers = {"Authorization": f"Bearer {other_login.json()['access_token']}"}

    res = client.get(f"/api/invoices/booking/{booking_id}", headers=other_headers)
    assert res.status_code == 403
