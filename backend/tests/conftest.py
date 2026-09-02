import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
import os

# Ensure SECRET_KEY is set for test execution before any app imports
os.environ["SECRET_KEY"] = "8fa64efbeccde2a19ffb0162548cb4592baea698c9f0b182fb78e2448ad41dfb"

from app.database import Base, get_db
from app.main import app
from app.models import AdminSettings, User, CustomerProfile, VendorProfile
from app.security import get_password_hash

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def _override_get_db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(autouse=True)
def init_database():
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()

    # Seed AdminSettings
    if not db.query(AdminSettings).first():
        db.add(AdminSettings(
            platform_name="Eazeevent",
            support_email="support@eazeevent.com",
            commission_rate=5.0,
            currency_symbol="INR",
        ))

    # Seed admin user
    if not db.query(User).filter(User.email == "admin@eazeevent.com").first():
        db.add(User(
            email="admin@eazeevent.com",
            hashed_password=get_password_hash("admin123"),
            name="Platform Administrator",
            role="admin",
        ))

    db.commit()
    db.close()

    app.dependency_overrides[get_db] = _override_get_db
    yield
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)

    # Clear in-memory auth state (rate limiters, OTP store) between tests
    from app.routers import auth as auth_router
    auth_router.login_attempts.clear()
    auth_router.reset_otps.clear()
    auth_router.otp_request_timestamps.clear()


@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def admin_token(client):
    res = client.post("/api/auth/login", json={
        "email": "admin@eazeevent.com",
        "password": "admin123",
    })
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    return res.json()["access_token"]


@pytest.fixture
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture
def test_customer(client):
    # Register
    reg = client.post("/api/auth/register/customer", json={
        "email": "customer@gmail.com",
        "password": "Password123",
        "name": "Ananya Roy",
        "phone": "+91 9876543210",
        "wedding_date": "2026-11-25",
        "estimated_budget": 600000.0,
    })
    assert reg.status_code == 201, f"Customer registration failed: {reg.text}"

    # Login
    login = client.post("/api/auth/login", json={
        "email": "customer@gmail.com",
        "password": "Password123",
    })
    assert login.status_code == 200, f"Customer login failed: {login.text}"
    token = login.json()["access_token"]
    return {
        "email": "customer@gmail.com",
        "name": "Ananya Roy",
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
    }


@pytest.fixture
def test_vendor(client, admin_headers, db):
    # Register
    reg = client.post("/api/auth/register/vendor", json={
        "email": "vendor@gmail.com",
        "password": "Password123",
        "name": "Karan Singhania",
        "business_name": "Lumiere Photo Studio",
        "category": "Photography",
        "city": "Mumbai",
    })
    assert reg.status_code == 201, f"Vendor registration failed: {reg.text}"

    # Look up vendor ID from DB (registration response doesn't include it)
    user = db.query(User).filter(User.email == "vendor@gmail.com").first()
    assert user is not None
    vendor_id = user.id

    # Admin verifies vendor
    verify = client.post(f"/api/admin/vendors/{vendor_id}/verify", headers=admin_headers)
    assert verify.status_code == 200, f"Vendor verification failed: {verify.text}"

    # Login
    login = client.post("/api/auth/login", json={
        "email": "vendor@gmail.com",
        "password": "Password123",
    })
    assert login.status_code == 200, f"Vendor login failed: {login.text}"
    token = login.json()["access_token"]
    return {
        "id": vendor_id,
        "email": "vendor@gmail.com",
        "business_name": "Lumiere Photo Studio",
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
    }
