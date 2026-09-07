import json
from sqlalchemy.orm import Session
from app.database import engine, Base, SessionLocal
from app.models import (
    User, CustomerProfile, VendorProfile, AdminSettings,
    Expense, Guest, ChecklistItem, TimelineItem,
    Booking, Inquiry, Review, Transaction, ChatMessage, BlockedDate
)
from app.security import get_password_hash

def seed_db():
    # Create tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        print("[+] Initializing database with complete demo & test seed data...")
        
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
        
        # 2. Platform Admin User
        admin_user = User(
            email="admin@eazeevent.com",
            hashed_password=get_password_hash("admin123"),
            name="Platform Administrator",
            role="admin"
        )
        db.add(admin_user)
        db.flush()

        # 3. Demo Customer: Rohan & Shruti (rohan@gmail.com / Eazeevent@123)
        cust_user = User(
            email="rohan@gmail.com",
            hashed_password=get_password_hash("Eazeevent@123"),
            name="Rohan & Shruti",
            role="customer"
        )
        db.add(cust_user)
        db.flush()

        cust_profile = CustomerProfile(
            id=cust_user.id,
            phone="+91 9876543210",
            wedding_date="2026-11-12",
            estimated_budget=8500000.0,
            actual_budget=9200000.0,
            status="ON TRACK",
            risk_description="",
            proof_file="Aadhaar_RohanShruti.pdf"
        )
        db.add(cust_profile)

        # Additional Demo Customer: Arjun & Kiara (arjun@gmail.com / Eazeevent@123)
        cust2_user = User(
            email="arjun@gmail.com",
            hashed_password=get_password_hash("Eazeevent@123"),
            name="Arjun & Kiara",
            role="customer"
        )
        db.add(cust2_user)
        db.flush()

        cust2_profile = CustomerProfile(
            id=cust2_user.id,
            phone="+91 9123456789",
            wedding_date="2026-12-05",
            estimated_budget=12000000.0,
            actual_budget=10000000.0,
            status="ON TRACK",
            risk_description="",
            proof_file="Passport_ArjunKiara.pdf"
        )
        db.add(cust2_profile)

        # 4. Demo Vendor 1: Symphony Musicians (symphony@musicians.com / Eazeevent@123) - Verified
        vend1_user = User(
            email="symphony@musicians.com",
            hashed_password=get_password_hash("Eazeevent@123"),
            name="Symphony Musicians",
            role="vendor"
        )
        db.add(vend1_user)
        db.flush()

        symphony_packages = json.dumps([
            {"name": "Acoustic Trio", "price": 60000, "details": "3 artists, 2 hours, sound equipment included"},
            {"name": "Grand Symphony Band", "price": 120000, "details": "Full 7-piece live band with Bollywood & classical fusion"}
        ])

        vend1_profile = VendorProfile(
            id=vend1_user.id,
            business_name="Symphony Musicians",
            category="Videography",
            city="Mumbai",
            bookings_count=89,
            rating=4.8,
            status="Verified",
            proof_file="GSTIN_Symphony.pdf",
            profile_image="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=800",
            services_offered="Professional musical troupe performing classical, fusion, and popular Bollywood live music for grand receptions.",
            starting_price=60000.0,
            packages=symphony_packages,
            is_boosted=True
        )
        db.add(vend1_profile)

        # Demo Vendor 2: Elegance Mandap (elegance@mandap.com / Eazeevent@123) - Verified
        vend2_user = User(
            email="elegance@mandap.com",
            hashed_password=get_password_hash("Eazeevent@123"),
            name="Elegance Mandap",
            role="vendor"
        )
        db.add(vend2_user)
        db.flush()

        elegance_packages = json.dumps([
            {"name": "Royal Mandap Setup", "price": 80000, "details": "Traditional fresh flowers mandap with carved pillar setup"},
            {"name": "Palace Grand Theme", "price": 180000, "details": "Complete royal entrance, mandap, dining canopy, and stage"}
        ])

        vend2_profile = VendorProfile(
            id=vend2_user.id,
            business_name="Elegance Mandap",
            category="Decoration",
            city="Udaipur",
            bookings_count=142,
            rating=4.9,
            status="Verified",
            proof_file="GSTIN_Elegance.pdf",
            profile_image="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800",
            services_offered="Luxury mandap and floral set decorators specializing in royal destination weddings in Rajasthan.",
            starting_price=80000.0,
            packages=elegance_packages,
            is_boosted=False
        )
        db.add(vend2_profile)

        # Demo Vendor 3: Zest Culinary (zest@culinary.com / Eazeevent@123) - Verified
        vend3_user = User(
            email="zest@culinary.com",
            hashed_password=get_password_hash("Eazeevent@123"),
            name="Zest Culinary",
            role="vendor"
        )
        db.add(vend3_user)
        db.flush()

        zest_packages = json.dumps([
            {"name": "Royal Feast Buffet", "price": 1500, "details": "Per plate, 4 live counters, 6 main courses, 5 artisanal desserts"}
        ])

        vend3_profile = VendorProfile(
            id=vend3_user.id,
            business_name="Zest Culinary",
            category="Catering",
            city="Delhi",
            bookings_count=310,
            rating=4.8,
            status="Verified",
            proof_file="GSTIN_Zest.pdf",
            profile_image="https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800",
            services_offered="Elite gourmet catering offering authentic multi-cuisine dining options with live kitchen setups and artisanal desserts.",
            starting_price=1500.0,
            packages=zest_packages,
            is_boosted=False
        )
        db.add(vend3_profile)

        # Demo Vendor 4: The Grand Horizon (grand@horizon.com / Eazeevent@123) - Pending (For admin review demo)
        vend4_user = User(
            email="grand@horizon.com",
            hashed_password=get_password_hash("Eazeevent@123"),
            name="The Grand Horizon",
            role="vendor"
        )
        db.add(vend4_user)
        db.flush()

        vend4_profile = VendorProfile(
            id=vend4_user.id,
            business_name="The Grand Horizon",
            category="Venues",
            city="Goa",
            bookings_count=0,
            rating=0.0,
            status="Pending",
            proof_file="GSTIN_GrandHorizon.pdf",
            profile_image="https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=800",
            services_offered="Stunning beachside lawn and banquet property in South Goa, perfect for luxury sunsets and intimate gatherings.",
            starting_price=180000.0,
            packages="[]",
            is_boosted=False
        )
        db.add(vend4_profile)

        # 5. Customer Data for Rohan & Shruti
        # Expenses
        db.add_all([
            Expense(customer_id=cust_user.id, name="Royal Banquet Hall Advance", category="Venues", cost=500000.0, paid_amount=500000.0, status="Paid"),
            Expense(customer_id=cust_user.id, name="Mandap & Floral Stage", category="Decoration", cost=250000.0, paid_amount=100000.0, status="Pending"),
            Expense(customer_id=cust_user.id, name="Live Fusion Band Deposit", category="Entertainment", cost=120000.0, paid_amount=60000.0, status="Pending"),
            Expense(customer_id=cust_user.id, name="Cinematic Wedding Photography", category="Photography", cost=180000.0, paid_amount=180000.0, status="Paid"),
        ])

        # Guests
        db.add_all([
            Guest(customer_id=cust_user.id, name="Aarav Sharma", phone="+91 9871122334", email="aarav@gmail.com", rsvp_status="Attending", invitation_sent=True),
            Guest(customer_id=cust_user.id, name="Priya Kapoor", phone="+91 9872233445", email="priya@gmail.com", rsvp_status="Pending", invitation_sent=True),
            Guest(customer_id=cust_user.id, name="Vikram Malhotra", phone="+91 9873344556", email="vikram@gmail.com", rsvp_status="Declined", invitation_sent=True),
            Guest(customer_id=cust_user.id, name="Ananya Desai", phone="+91 9874455667", email="ananya@gmail.com", rsvp_status="Attending", invitation_sent=False),
        ])

        # Checklist Items
        db.add_all([
            ChecklistItem(customer_id=cust_user.id, title="Finalize Grand Reception Menu", category="Catering", status="Completed", due_date="2026-09-15"),
            ChecklistItem(customer_id=cust_user.id, title="Book Live Music Band & DJ", category="Entertainment", status="Completed", due_date="2026-09-20"),
            ChecklistItem(customer_id=cust_user.id, title="Send Printed Wedding Invitations", category="Invitations", status="Pending", due_date="2026-10-01"),
            ChecklistItem(customer_id=cust_user.id, title="Bridal Lehenga Fitting", category="Attire", status="Pending", due_date="2026-10-15"),
        ])

        # Timeline Items
        db.add_all([
            TimelineItem(customer_id=cust_user.id, date_or_day="2026-11-12", time="10:00 AM", description="Traditional Mehendi & Sangeet Setup"),
            TimelineItem(customer_id=cust_user.id, date_or_day="2026-11-12", time="04:00 PM", description="Baraat Arrival & Welcome Ceremony"),
            TimelineItem(customer_id=cust_user.id, date_or_day="2026-11-12", time="07:30 PM", description="Varmala & Pheras at Royal Mandap"),
            TimelineItem(customer_id=cust_user.id, date_or_day="2026-11-12", time="09:30 PM", description="Grand Banquet Dinner & Live Band Performance"),
        ])

        # 6. Sample Booking & Inquiry
        sample_booking = Booking(
            customer_id=cust_user.id,
            vendor_id=vend1_user.id,
            package_name="Acoustic Trio",
            date="2026-11-12",
            amount=60000.0,
            paid_amount=60000.0,
            status="Confirmed",
            location="Mumbai"
        )
        db.add(sample_booking)

        sample_inquiry = Inquiry(
            customer_id=cust_user.id,
            vendor_id=vend2_user.id,
            pkg="Royal Mandap Setup",
            date="2026-11-12",
            location="Udaipur",
            status="In Discussion",
            budget=80000.0
        )
        db.add(sample_inquiry)

        # 7. Sample Reviews
        db.add_all([
            Review(
                vendor_id=vend1_user.id,
                reviewer_name="Rohan & Shruti",
                rating=5.0,
                text="Symphony Musicians were phenomenal! Their acoustic trio made our reception magical.",
                date="2026-08-20",
                replied=True,
                reply_text="Thank you so much Rohan & Shruti! It was our pleasure to perform for your special day."
            ),
            Review(
                vendor_id=vend2_user.id,
                reviewer_name="Arjun & Kiara",
                rating=4.9,
                text="The mandap was truly breathtaking. Every flower was fresh and beautifully styled.",
                date="2026-07-15",
                replied=False,
                reply_text=None
            )
        ])

        db.commit()
        print("[SUCCESS] Complete database initialized and seeded successfully!")
        print("---------------------------------------------------------------")
        print("  [ADMIN] Platform Admin:")
        print("     - Email: admin@eazeevent.com")
        print("     - Password: admin123 (or admin)")
        print("---------------------------------------------------------------")
        print("  [CUSTOMER] Demo Customer:")
        print("     - Email: rohan@gmail.com")
        print("     - Password: Eazeevent@123")
        print("     - Name: Rohan & Shruti")
        print("---------------------------------------------------------------")
        print("  [VENDOR] Demo Vendor:")
        print("     - Email: symphony@musicians.com")
        print("     - Password: Eazeevent@123")
        print("     - Business: Symphony Musicians (Verified)")
        print("---------------------------------------------------------------")
        print("  [OTHER DEMO ACCOUNTS]:")
        print("     - Customer: arjun@gmail.com / Eazeevent@123")
        print("     - Vendor: elegance@mandap.com / Eazeevent@123 (Decoration, Verified)")
        print("     - Vendor: zest@culinary.com / Eazeevent@123 (Catering, Verified)")
        print("     - Vendor: grand@horizon.com / Eazeevent@123 (Venues, Pending Approval)")
        print("---------------------------------------------------------------")

    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
