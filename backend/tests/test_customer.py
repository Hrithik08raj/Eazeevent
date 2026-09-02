import pytest


def test_customer_profile_crud(client, test_customer):
    """Get and update customer profile."""
    headers = test_customer["headers"]

    # GET profile
    res = client.get("/api/customer/profile", headers=headers)
    assert res.status_code == 200
    assert res.json()["name"] == "Ananya Roy"

    # UPDATE profile
    update_res = client.put("/api/customer/profile", headers=headers, json={
        "name": "Ananya Roy Updated",
        "phone": "+91 9000000001",
        "wedding_date": "2027-01-15",
        "estimated_budget": 700000.0,
    })
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Ananya Roy Updated"


def test_expense_crud(client, test_customer):
    """Full create → read → update → delete cycle for expenses."""
    headers = test_customer["headers"]
    expense = {
        "name": "Floral Arrangements",
        "category": "Decoration",
        "cost": 50000.0,
        "paid_amount": 20000.0,
        "status": "Partial",
    }

    # Create
    res = client.post("/api/customer/expenses", json=expense, headers=headers)
    assert res.status_code == 200
    eid = res.json()["id"]

    # Read list
    list_res = client.get("/api/customer/expenses", headers=headers)
    assert any(e["id"] == eid for e in list_res.json())

    # Update
    expense["paid_amount"] = 50000.0
    expense["status"] = "Paid"
    upd_res = client.put(f"/api/customer/expenses/{eid}", json=expense, headers=headers)
    assert upd_res.status_code == 200
    assert upd_res.json()["status"] == "Paid"

    # Delete
    del_res = client.delete(f"/api/customer/expenses/{eid}", headers=headers)
    assert del_res.status_code == 200

    # Verify budget recalculated to 0
    prof = client.get("/api/customer/profile", headers=headers)
    assert prof.json()["actual_budget"] == 0.0


def test_guest_crud(client, test_customer):
    """Full create → read → update → delete cycle for guests."""
    headers = test_customer["headers"]
    guest = {
        "name": "John Doe",
        "phone": "+91 9991112223",
        "email": "johndoe@gmail.com",
        "rsvp_status": "Pending",
        "invitation_sent": False,
    }

    # Create
    res = client.post("/api/customer/guests", json=guest, headers=headers)
    assert res.status_code == 200
    gid = res.json()["id"]
    assert res.json()["name"] == "John Doe"

    # Update
    guest["rsvp_status"] = "Attending"
    guest["invitation_sent"] = True
    upd = client.put(f"/api/customer/guests/{gid}", json=guest, headers=headers)
    assert upd.status_code == 200
    assert upd.json()["rsvp_status"] == "Attending"

    # Delete
    del_res = client.delete(f"/api/customer/guests/{gid}", headers=headers)
    assert del_res.status_code == 200


def test_checklist_crud(client, test_customer):
    """Full create → update → delete cycle for checklist items."""
    headers = test_customer["headers"]
    item = {
        "title": "Book Florist",
        "category": "Decoration",
        "status": "Pending",
        "due_date": "2026-10-01",
    }

    # Create
    res = client.post("/api/customer/checklist", json=item, headers=headers)
    assert res.status_code == 200
    iid = res.json()["id"]

    # Update
    item["status"] = "Completed"
    upd = client.put(f"/api/customer/checklist/{iid}", json=item, headers=headers)
    assert upd.status_code == 200
    assert upd.json()["status"] == "Completed"

    # Delete
    del_res = client.delete(f"/api/customer/checklist/{iid}", headers=headers)
    assert del_res.status_code == 200


def test_customer_cannot_access_admin_endpoints(client, test_customer):
    """Customer token must be rejected on admin routes."""
    headers = test_customer["headers"]
    res = client.get("/api/admin/overview", headers=headers)
    assert res.status_code == 403
