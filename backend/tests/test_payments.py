import pytest
from unittest.mock import MagicMock, patch


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _create_partial_booking(client, test_customer, test_vendor):
    """Create a booking with a balance due (paid < total) via inquiry flow."""
    cust_h = test_customer["headers"]
    vend_h = test_vendor["headers"]

    inq = client.post("/api/customer/inquiries", json={
        "vendor_id": test_vendor["id"],
        "pkg": "Platinum Wedding Coverage",
        "date": "2027-03-10",
        "location": "Pune",
        "budget": 300000.0,
    }, headers=cust_h)
    assert inq.status_code == 200
    inq_id = inq.json()["id"]

    client.put(f"/api/vendors/portal/inquiries/{inq_id}", json={"status": "Booked"}, headers=vend_h)

    bookings = client.get("/api/customer/bookings", headers=cust_h)
    booking = next((b for b in bookings.json() if b["package_name"] == "Platinum Wedding Coverage"), None)
    assert booking is not None
    return booking


# ---------------------------------------------------------------------------
# Payment Tests (with mocked Razorpay)
# ---------------------------------------------------------------------------
def test_create_order_derives_amount_from_booking(client, test_customer, test_vendor):
    """
    create-order must derive the amount from the booking DB record,
    not trust any client-supplied value. Confirms the correct amount_due
    is sent to the mocked Razorpay client.
    """
    booking = _create_partial_booking(client, test_customer, test_vendor)
    booking_id = booking["id"]
    amount_total = booking["amount"]
    amount_paid = booking["paid_amount"]
    expected_due = amount_total - amount_paid
    expected_paise = int(expected_due * 100)

    mock_order = {"id": "order_test_001", "amount": expected_paise, "currency": "INR"}

    with patch("app.routers.payments.razorpay.Client") as MockClient:
        mock_rz = MagicMock()
        mock_rz.order.create.return_value = mock_order
        MockClient.return_value = mock_rz

        res = client.post("/api/payments/create-order", json={"booking_id": booking_id},
                          headers=test_customer["headers"])
        assert res.status_code == 200
        data = res.json()
        assert data["order_id"] == "order_test_001"
        # The returned `amount` must be the amount DUE, not the full booking amount
        assert abs(data["amount"] - expected_due) < 0.01

        # Verify the amount passed to Razorpay matches what the DB says
        call_args = mock_rz.order.create.call_args[1]["data"]
        assert call_args["amount"] == expected_paise


def test_create_order_rejects_unauthorized_customer(client, test_customer, test_vendor):
    """A customer cannot create an order for another customer's booking."""
    booking = _create_partial_booking(client, test_customer, test_vendor)
    booking_id = booking["id"]

    # Register a different customer
    client.post("/api/auth/register/customer", json={
        "email": "intruder@gmail.com",
        "password": "IntruderPass123",
        "name": "Intruder",
    })
    intruder_login = client.post("/api/auth/login", json={
        "email": "intruder@gmail.com",
        "password": "IntruderPass123",
    })
    intruder_headers = {"Authorization": f"Bearer {intruder_login.json()['access_token']}"}

    with patch("app.routers.payments.razorpay.Client"):
        res = client.post("/api/payments/create-order", json={"booking_id": booking_id},
                          headers=intruder_headers)
    assert res.status_code == 403


def test_create_order_rejects_already_fully_paid(client, test_customer, test_vendor, db):
    """create-order must return 400 when the booking is already fully paid."""
    from app.models import Booking

    booking = _create_partial_booking(client, test_customer, test_vendor)
    booking_id = booking["id"]

    # Force booking to fully paid in DB
    b = db.query(Booking).filter(Booking.id == booking_id).first()
    b.paid_amount = b.amount
    db.commit()

    with patch("app.routers.payments.razorpay.Client"):
        res = client.post("/api/payments/create-order", json={"booking_id": booking_id},
                          headers=test_customer["headers"])
    assert res.status_code == 400
    assert "already fully paid" in res.json()["detail"].lower()


def test_verify_signature_rejects_bad_signature(client, test_customer, test_vendor):
    """verify-signature must reject a tampered/bad HMAC signature."""
    booking = _create_partial_booking(client, test_customer, test_vendor)
    booking_id = booking["id"]

    def fake_verify(params):
        raise Exception("Invalid payment signature")  # razorpay SDK raises on bad sig

    with patch("app.routers.payments.razorpay.Client") as MockClient:
        mock_rz = MagicMock()
        mock_rz.utility.verify_payment_signature.side_effect = fake_verify
        MockClient.return_value = mock_rz

        res = client.post("/api/payments/verify-signature", json={
            "booking_id": booking_id,
            "razorpay_order_id": "order_FAKE123",
            "razorpay_payment_id": "pay_FAKE456",
            "razorpay_signature": "badsignature",
        }, headers=test_customer["headers"])

    assert res.status_code == 400
    assert "verification failed" in res.json()["detail"].lower()


def test_verify_signature_success_updates_booking(client, test_customer, test_vendor):
    """
    verify-signature with valid mock: booking paid_amount is updated
    and a transaction record is created.
    """
    booking = _create_partial_booking(client, test_customer, test_vendor)
    booking_id = booking["id"]
    amount_due = booking["amount"] - booking["paid_amount"]
    amount_paise = int(amount_due * 100)

    with patch("app.routers.payments.razorpay.Client") as MockClient:
        mock_rz = MagicMock()
        mock_rz.utility.verify_payment_signature.return_value = None  # no exception = verified
        mock_rz.payment.fetch.return_value = {"amount": amount_paise}  # matches amount_due
        MockClient.return_value = mock_rz

        res = client.post("/api/payments/verify-signature", json={
            "booking_id": booking_id,
            "razorpay_order_id": "order_VALID001",
            "razorpay_payment_id": "pay_VALID001",
            "razorpay_signature": "validsignature",
        }, headers=test_customer["headers"])

    assert res.status_code == 200
    assert res.json()["status"] == "success"

    # Confirm booking is now fully/partially paid
    bookings = client.get("/api/customer/bookings", headers=test_customer["headers"])
    updated = next(b for b in bookings.json() if b["id"] == booking_id)
    assert updated["paid_amount"] > booking["paid_amount"]
