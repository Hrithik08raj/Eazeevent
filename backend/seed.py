from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models import User, CustomerProfile, VendorProfile, AdminSettings, Expense, Guest, ChecklistItem, Booking, Inquiry, Review, Transaction, ChatMessage, BlockedDate
from app.security import get_password_hash

def seed_db():
    # Create tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        print("[+] Initializing clean database for production...")
        
        # 1. Admin Settings
        settings = AdminSettings(
            platform_name="Eazeevent",
            support_email="support@eazeevent.com",
            commission_rate=5.0,
            currency_symbol="₹",
            maintenance_mode=False,
            gemini_api_key=None
        )
        db.add(settings)
        
        # 2. Main Admin User
        admin_user = User(
            email="admin@eazeevent.com",
            hashed_password=get_password_hash("admin123"),
            name="Platform Administrator",
            role="admin"
        )
        db.add(admin_user)
        
        db.commit()
        print("[SUCCESS] Production database initialized successfully!")
        print("  - Admin Email: admin@eazeevent.com")
        print("  - Admin Password: admin123")
        print("  *(Please change the admin password after logging in)*")
        
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
