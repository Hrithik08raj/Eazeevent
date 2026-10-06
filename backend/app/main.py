from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, customers, vendors, admin, ai, chat, payments, invoices
from app.database import engine, Base

from fastapi.staticfiles import StaticFiles
import os

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

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to the Eazeevent API. Please visit /docs for API documentation."
    }
