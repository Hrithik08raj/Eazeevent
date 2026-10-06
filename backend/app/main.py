from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, customers, vendors, admin, ai, chat, payments, invoices
from app.database import engine, Base, SessionLocal
from app.models import User, AdminSettings
from app.security import get_password_hash

from fastapi.staticfiles import StaticFiles
import os
import logging

logger = logging.getLogger("eazeevent.startup")

# Create database tables automatically if they do not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Eazeevent API Server",
    description="Secure, production-ready backend for the Eazeevent platform",
    version="1.0.0"
)

# Ensure static/uploads directory exists
os.makedirs("static/uploads", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# CORS setup
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True if allowed_origins_env != "*" else False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(vendors.router)
app.include_router(admin.router)
app.include_router(ai.router)
app.include_router(chat.router)
app.include_router(payments.router)
app.include_router(invoices.router)


def ensure_defaults():
    """
    Run on every startup. Creates the admin account and default platform
    settings if they do not already exist. Safe to call on every boot —
    it is fully idempotent (does nothing if records are already present).
    """
    db = SessionLocal()
    try:
        # 1. Ensure the admin user exists
        admin_user = db.query(User).filter(User.role == "admin").first()
        if not admin_user:
            admin_user = User(
                email="admin@eazeevent.com",
                hashed_password=get_password_hash("admin123"),
                name="Platform Administrator",
                role="admin",
            )
            db.add(admin_user)
            logger.info("[startup] Admin account created: admin@eazeevent.com")
        else:
            logger.info("[startup] Admin account already exists — skipping creation.")

        # 2. Ensure platform settings exist
        settings = db.query(AdminSettings).first()
        if not settings:
            settings = AdminSettings(
                platform_name="Eazeevent",
                support_email="support@eazeevent.com",
                commission_rate=5.0,
                currency_symbol="₹",
                maintenance_mode=False,
                gemini_api_key=None,
            )
            db.add(settings)
            logger.info("[startup] Default platform settings created.")

        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"[startup] ensure_defaults failed: {e}")
    finally:
        db.close()


# Run startup defaults immediately when the module is loaded
ensure_defaults()


@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to the Eazeevent API. Please visit /docs for API documentation."
    }
