import pytest


def test_timeline_crud(client, test_customer):
    """Create and delete timeline items."""
    headers = test_customer["headers"]
    item = {
        "date_or_day": "Day 1 - Morning",
        "time": "09:00 AM",
        "description": "Baraat procession begins",
    }

    res = client.post("/api/customer/timeline", json=item, headers=headers)
    assert res.status_code == 200
    tid = res.json()["id"]
    assert res.json()["description"] == "Baraat procession begins"

    # List
    list_res = client.get("/api/customer/timeline", headers=headers)
    assert res.status_code == 200
    assert any(t["id"] == tid for t in list_res.json())

    # Delete
    del_res = client.delete(f"/api/customer/timeline/{tid}", headers=headers)
    assert del_res.status_code == 200

    # Confirm gone
    after = client.get("/api/customer/timeline", headers=headers)
    assert not any(t["id"] == tid for t in after.json())


def test_support_tickets_customer_and_admin(client, test_customer, admin_headers):
    """Customer creates a ticket; admin can list, reply, and resolve it."""
    cust_headers = test_customer["headers"]
    ticket_payload = {
        "subject": "Invoice Missing",
        "category": "Billing",
        "message": "I did not receive my invoice after payment.",
        "priority": "High",
    }

    # Customer creates ticket
    res = client.post("/api/customer/tickets", json=ticket_payload, headers=cust_headers)
    assert res.status_code == 200
    ticket_id = res.json()["id"]
    assert res.json()["status"] == "New"

    # Admin lists tickets and sees it
    admin_list = client.get("/api/admin/tickets", headers=admin_headers)
    assert admin_list.status_code == 200
    assert any(t["id"] == ticket_id for t in admin_list.json())

    # Admin replies to ticket
    reply_res = client.post(
        f"/api/admin/tickets/{ticket_id}/reply",
        json={"reply_text": "We are looking into your invoice issue."},
        headers=admin_headers,
    )
    assert reply_res.status_code == 200

    # Admin resolves ticket
    resolve_res = client.post(
        f"/api/admin/tickets/{ticket_id}/resolve",
        headers=admin_headers,
    )
    assert resolve_res.status_code == 200

    # Confirm ticket is Resolved in list
    resolved_list = client.get("/api/admin/tickets", headers=admin_headers)
    ticket_after = next(t for t in resolved_list.json() if t["id"] == ticket_id)
    assert ticket_after["status"] == "Resolved"


def test_timeline_delete_not_found(client, test_customer):
    """Deleting a non-existent timeline item returns 404."""
    res = client.delete("/api/customer/timeline/99999", headers=test_customer["headers"])
    assert res.status_code == 404


def test_timeline_requires_auth(client):
    """Timeline endpoints require authentication."""
    res = client.get("/api/customer/timeline")
    assert res.status_code in (401, 403)
