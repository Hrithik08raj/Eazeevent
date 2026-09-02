import pytest
from unittest.mock import MagicMock, patch


def _setup_inquiry(client, test_customer, test_vendor):
    """Return an inquiry_id between test_customer and test_vendor."""
    inq = client.post("/api/customer/inquiries", json={
        "vendor_id": test_vendor["id"],
        "pkg": "Gold Package",
        "date": "2027-04-01",
        "location": "Hyderabad",
        "budget": 100000.0,
    }, headers=test_customer["headers"])
    assert inq.status_code == 200
    return inq.json()["id"]


def test_chat_get_empty(client, test_customer, test_vendor):
    """Fresh inquiry has no chat messages."""
    inq_id = _setup_inquiry(client, test_customer, test_vendor)
    res = client.get(f"/api/chat/{inq_id}", headers=test_customer["headers"])
    assert res.status_code == 200
    assert res.json() == []


def test_chat_send_and_read_messages(client, test_customer, test_vendor):
    """Customer sends a message; vendor can read it; vendor replies; customer reads."""
    inq_id = _setup_inquiry(client, test_customer, test_vendor)
    cust_h = test_customer["headers"]
    vend_h = test_vendor["headers"]

    # Customer sends message
    send_res = client.post(f"/api/chat/{inq_id}", json={"text": "Hi, is this date available?"},
                           headers=cust_h)
    assert send_res.status_code == 200
    assert send_res.json()["sender_role"] == "customer"
    assert send_res.json()["text"] == "Hi, is this date available?"

    # Vendor reads messages
    vend_read = client.get(f"/api/chat/{inq_id}", headers=vend_h)
    assert vend_read.status_code == 200
    assert len(vend_read.json()) == 1

    # Vendor replies
    reply = client.post(f"/api/chat/{inq_id}", json={"text": "Yes, the date is available!"},
                        headers=vend_h)
    assert reply.status_code == 200
    assert reply.json()["sender_role"] == "vendor"

    # Customer reads both messages
    cust_read = client.get(f"/api/chat/{inq_id}", headers=cust_h)
    assert len(cust_read.json()) == 2


def test_chat_unauthorized_third_party_blocked(client, test_customer, test_vendor):
    """A third customer cannot access a chat they are not part of."""
    inq_id = _setup_inquiry(client, test_customer, test_vendor)

    # Register unrelated user
    client.post("/api/auth/register/customer", json={
        "email": "stranger@gmail.com",
        "password": "StrangerPass123",
        "name": "Stranger",
    })
    stranger_login = client.post("/api/auth/login", json={
        "email": "stranger@gmail.com",
        "password": "StrangerPass123",
    })
    stranger_headers = {"Authorization": f"Bearer {stranger_login.json()['access_token']}"}

    res = client.get(f"/api/chat/{inq_id}", headers=stranger_headers)
    assert res.status_code == 403


def test_chat_nonexistent_inquiry(client, test_customer):
    """Chat on a non-existent inquiry returns 404."""
    res = client.get("/api/chat/99999", headers=test_customer["headers"])
    assert res.status_code == 404


# ---------------------------------------------------------------------------
# Boost payment tests (mocked Razorpay)
# ---------------------------------------------------------------------------
def test_boost_create_order_valid_plan(client, test_vendor):
    """Vendor can create a boost order for a valid plan index."""
    PRICES = [999.0, 1799.0, 2999.0]
    plan_index = 1  # 1799 INR plan

    mock_order = {"id": "order_boost_001", "amount": int(PRICES[plan_index] * 100)}
    with patch("app.routers.vendors.razorpay.Client") as MockClient:
        mock_rz = MagicMock()
        mock_rz.order.create.return_value = mock_order
        MockClient.return_value = mock_rz

        res = client.post("/api/vendors/portal/boost/create-order",
                          json={"plan_index": plan_index},
                          headers=test_vendor["headers"])

    assert res.status_code == 200
    data = res.json()
    assert data["order_id"] == "order_boost_001"
    assert abs(data["amount"] - PRICES[plan_index]) < 0.01


def test_boost_create_order_invalid_plan(client, test_vendor):
    """Boost order with an out-of-range plan_index is rejected with 400."""
    with patch("app.routers.vendors.razorpay.Client"):
        res = client.post("/api/vendors/portal/boost/create-order",
                          json={"plan_index": 99},
                          headers=test_vendor["headers"])
    assert res.status_code == 400


def test_boost_verify_signature_bad_sig(client, test_vendor):
    """Boost verify-signature rejects a bad signature."""
    with patch("app.routers.vendors.razorpay.Client") as MockClient:
        mock_rz = MagicMock()
        mock_rz.utility.verify_payment_signature.side_effect = Exception("Invalid signature")
        MockClient.return_value = mock_rz

        res = client.post("/api/vendors/portal/boost/verify-signature", json={
            "plan_index": 0,
            "razorpay_order_id": "order_boost_FAKE",
            "razorpay_payment_id": "pay_boost_FAKE",
            "razorpay_signature": "badsig",
        }, headers=test_vendor["headers"])

    assert res.status_code == 400
    assert "verification failed" in res.json()["detail"].lower()


def test_boost_verify_signature_success_activates_boost(client, test_vendor):
    """Successful boost payment marks vendor profile as boosted."""
    with patch("app.routers.vendors.razorpay.Client") as MockClient:
        mock_rz = MagicMock()
        mock_rz.utility.verify_payment_signature.return_value = None
        MockClient.return_value = mock_rz

        res = client.post("/api/vendors/portal/boost/verify-signature", json={
            "plan_index": 0,
            "razorpay_order_id": "order_boost_VALID",
            "razorpay_payment_id": "pay_boost_VALID",
            "razorpay_signature": "validsig",
        }, headers=test_vendor["headers"])

    assert res.status_code == 200
    assert res.json()["status"] == "success"
