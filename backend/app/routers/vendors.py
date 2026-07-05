from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
import shutil
import uuid
import os
from app.database import get_db
from app.models import User, VendorProfile, Booking, Inquiry, Review, CustomerProfile, Transaction, BlockedDate
from app.schemas import (
    VendorProfileOut, VendorProfileUpdate,
    BookingOut, InquiryOut, InquiryStatusUpdate,
    ReviewOut, ReviewCreate, ReviewReply, TransactionOut, BoostRequest, BlockedDateOut, BlockedDateCreate
)
from app.deps import RoleChecker, get_current_user

router = APIRouter(prefix="/api/vendors", tags=["vendors"])
vendor_guard = RoleChecker(allowed_roles=["vendor"])
customer_guard = RoleChecker(allowed_roles=["customer"])

# --- PUBLIC DIRECTORY ENDPOINTS (No auth needed or current_user optional) ---
@router.get("", response_model=List[VendorProfileOut])
def get_all_vendors(
    category: Optional[str] = None, 
    city: Optional[str] = None, 
    q: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Only list Verified vendors on the public marketplace
    query = db.query(VendorProfile).filter(VendorProfile.status == "Verified")
    
    if category and category != "All":
        query = query.filter(VendorProfile.category == category)
    if city and city != "All":
        query = query.filter(VendorProfile.city.ilike(f"%{city}%"))
    if q:
        query = query.filter(
            (VendorProfile.business_name.ilike(f"%{q}%")) | 
            (VendorProfile.services_offered.ilike(f"%{q}%"))
        )
        
    profiles = query.all()
    out = []
    for p in profiles:
        user = db.query(User).filter(User.id == p.id).first()
        out.append({
            "id": p.id,
            "name": user.name if user else "",
            "email": user.email if user else "",
            "business_name": p.business_name,
            "category": p.category,
            "city": p.city,
            "bookings_count": p.bookings_count or 0,
            "rating": p.rating or 5.0,
            "status": p.status,
            "services_offered": p.services_offered,
            "profile_image": p.profile_image,
            "starting_price": p.starting_price or 60000.0,
            "packages": p.packages,
            "is_boosted": p.is_boosted or False
        })
    return out

@router.get("/{vendor_id}", response_model=VendorProfileOut)
def get_vendor_details(vendor_id: int, db: Session = Depends(get_db)):
    profile = db.query(VendorProfile).filter(VendorProfile.id == vendor_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Vendor not found.")
        
    user = db.query(User).filter(User.id == vendor_id).first()
    return {
        "id": profile.id,
        "name": user.name if user else "",
        "email": user.email if user else "",
        "business_name": profile.business_name,
        "category": profile.category,
        "city": profile.city,
        "bookings_count": profile.bookings_count or 0,
        "rating": profile.rating or 5.0,
        "status": profile.status,
        "services_offered": profile.services_offered,
        "profile_image": profile.profile_image,
        "starting_price": profile.starting_price or 60000.0,
        "packages": profile.packages,
        "is_boosted": profile.is_boosted or False
    }

# --- VENDOR PORTAL ENDPOINTS (Authenticated Vendor Only) ---
@router.get("/portal/profile", response_model=VendorProfileOut)
def get_vendor_portal_profile(current_user: User = Depends(vendor_guard), db: Session = Depends(get_db)):
    profile = db.query(VendorProfile).filter(VendorProfile.id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Vendor profile not found.")
    return {
        "id": profile.id,
        "name": current_user.name,
        "email": current_user.email,
        "business_name": profile.business_name,
        "category": profile.category,
        "city": profile.city,
        "bookings_count": profile.bookings_count or 0,
        "rating": profile.rating or 5.0,
        "status": profile.status,
        "services_offered": profile.services_offered,
        "profile_image": profile.profile_image,
        "starting_price": profile.starting_price or 60000.0,
        "packages": profile.packages,
        "is_boosted": profile.is_boosted or False
    }

@router.put("/portal/profile", response_model=VendorProfileOut)
def update_vendor_portal_profile(
    payload: VendorProfileUpdate, 
    current_user: User = Depends(vendor_guard), 
    db: Session = Depends(get_db)
):
    profile = db.query(VendorProfile).filter(VendorProfile.id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Vendor profile not found.")
        
    current_user.name = payload.name
    profile.business_name = payload.business_name
    profile.category = payload.category
    profile.city = payload.city
    profile.services_offered = payload.services_offered
    if payload.starting_price is not None:
        profile.starting_price = payload.starting_price
    if payload.packages is not None:
        profile.packages = payload.packages
    
    db.commit()
    db.refresh(profile)
    return {
        "id": profile.id,
        "name": current_user.name,
        "email": current_user.email,
        "business_name": profile.business_name,
        "category": profile.category,
        "city": profile.city,
        "bookings_count": profile.bookings_count or 0,
        "rating": profile.rating or 5.0,
        "status": profile.status,
        "services_offered": profile.services_offered,
        "profile_image": profile.profile_image,
        "starting_price": profile.starting_price or 60000.0,
        "packages": profile.packages,
        "is_boosted": profile.is_boosted or False
    }


@router.get("/portal/bookings", response_model=List[BookingOut])
def get_vendor_bookings(current_user: User = Depends(vendor_guard), db: Session = Depends(get_db)):
    bookings = db.query(Booking).filter(Booking.vendor_id == current_user.id).all()
    out = []
    for b in bookings:
        c_user = db.query(User).filter(User.id == b.customer_id).first()
        out.append({
            "id": b.id,
            "customer_id": b.customer_id,
            "customer_name": c_user.name if c_user else "Unknown Customer",
            "vendor_id": b.vendor_id,
            "vendor_name": current_user.name,
            "package_name": b.package_name,
            "date": b.date,
            "amount": b.amount,
            "paid_amount": b.paid_amount,
            "status": b.status,
            "location": b.location
        })
    return out

@router.get("/portal/inquiries", response_model=List[InquiryOut])
def get_vendor_inquiries(current_user: User = Depends(vendor_guard), db: Session = Depends(get_db)):
    inquiries = db.query(Inquiry).filter(Inquiry.vendor_id == current_user.id).all()
    out = []
    for i in inquiries:
        c_user = db.query(User).filter(User.id == i.customer_id).first()
        out.append({
            "id": i.id,
            "customer_id": i.customer_id,
            "customer_name": c_user.name if c_user else "Unknown Customer",
            "vendor_id": i.vendor_id,
            "vendor_name": current_user.name,
            "pkg": i.pkg,
            "date": i.date,
            "location": i.location,
            "status": i.status,
            "budget": i.budget
        })
    return out

@router.put("/portal/inquiries/{inquiry_id}", response_model=InquiryOut)
def update_inquiry_status(
    inquiry_id: int, 
    payload: InquiryStatusUpdate, 
    current_user: User = Depends(vendor_guard), 
    db: Session = Depends(get_db)
):
    inquiry = db.query(Inquiry).filter(Inquiry.id == inquiry_id, Inquiry.vendor_id == current_user.id).first()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found.")
        
    inquiry.status = payload.status
    
    # Auto-generate Booking when status moves to "Booked"
    if payload.status == "Booked":
        # Check if booking already exists for this inquiry details
        existing_booking = db.query(Booking).filter(
            Booking.customer_id == inquiry.customer_id,
            Booking.vendor_id == inquiry.vendor_id,
            Booking.package_name == inquiry.pkg,
            Booking.date == inquiry.date
        ).first()
        
        if not existing_booking:
            new_booking = Booking(
                customer_id=inquiry.customer_id,
                vendor_id=inquiry.vendor_id,
                package_name=inquiry.pkg,
                date=inquiry.date,
                amount=inquiry.budget,
                paid_amount=0.0,
                status="Confirmed",
                location=inquiry.location
            )
            db.add(new_booking)
            db.flush()
            
            # Create corresponding Transaction in escrow
            import datetime
            cust_user = db.query(User).filter(User.id == inquiry.customer_id).first()
            vend_profile = db.query(VendorProfile).filter(VendorProfile.id == inquiry.vendor_id).first()
            
            new_txn = Transaction(
                booking_id=new_booking.id,
                vendor_id=inquiry.vendor_id,
                amount=inquiry.budget,
                type="deposit",
                status="Pending",
                date=datetime.date.today().strftime("%b %d, %Y"),
                client_name=cust_user.name if cust_user else "Client",
                vendor_name=vend_profile.business_name if vend_profile else "Vendor"
            )
            db.add(new_txn)
            
            profile = db.query(VendorProfile).filter(VendorProfile.id == current_user.id).first()
            if profile:
                profile.bookings_count = (profile.bookings_count or 0) + 1
                
    db.commit()
    db.refresh(inquiry)
    
    c_user = db.query(User).filter(User.id == inquiry.customer_id).first()
    return {
        "id": inquiry.id,
        "customer_id": inquiry.customer_id,
        "customer_name": c_user.name if c_user else "Unknown Customer",
        "vendor_id": inquiry.vendor_id,
        "vendor_name": current_user.name,
        "pkg": inquiry.pkg,
        "date": inquiry.date,
        "location": inquiry.location,
        "status": inquiry.status,
        "budget": inquiry.budget
    }

# --- REVIEWS & FEEDBACK ---
@router.get("/{vendor_id}/reviews", response_model=List[ReviewOut])
def get_vendor_reviews(vendor_id: int, db: Session = Depends(get_db)):
    return db.query(Review).filter(Review.vendor_id == vendor_id).all()

@router.post("/{vendor_id}/reviews", response_model=ReviewOut)
def leave_review(
    vendor_id: int, 
    payload: ReviewCreate, 
    current_user: User = Depends(customer_guard), 
    db: Session = Depends(get_db)
):
    profile = db.query(VendorProfile).filter(VendorProfile.id == vendor_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Vendor not found.")
        
    # Security: Verify that the customer has actually booked or contacted this vendor
    booking = db.query(Booking).filter(
        Booking.customer_id == current_user.id,
        Booking.vendor_id == vendor_id
    ).first()
    inquiry = db.query(Inquiry).filter(
        Inquiry.customer_id == current_user.id,
        Inquiry.vendor_id == vendor_id
    ).first()
    if not booking and not inquiry:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="You can only leave reviews for vendors you have booked or contacted."
        )
        
    import datetime
    new_review = Review(
        vendor_id=vendor_id,
        reviewer_name=current_user.name,
        rating=payload.rating,
        text=payload.text,
        date=datetime.date.today().strftime("%b %Y"),
        replied=False
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    
    # Update vendor average rating
    all_reviews = db.query(Review).filter(Review.vendor_id == vendor_id).all()
    if all_reviews:
        total_rating = sum(r.rating for r in all_reviews)
        profile.rating = round(total_rating / len(all_reviews), 1)
        db.commit()
        
    return new_review

@router.post("/portal/reviews/{review_id}/reply", response_model=ReviewOut)
def reply_to_review(
    review_id: int, 
    payload: ReviewReply, 
    current_user: User = Depends(vendor_guard), 
    db: Session = Depends(get_db)
):
    review = db.query(Review).filter(Review.id == review_id, Review.vendor_id == current_user.id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found.")
        
    review.replied = True
    review.reply_text = payload.reply_text
    db.commit()
    db.refresh(review)
    return review

# --- VENDOR PORTAL TRANSACTIONS & EARNINGS ---
from app.models import AdminSettings

@router.get("/portal/transactions", response_model=List[TransactionOut])
def get_vendor_transactions(current_user: User = Depends(vendor_guard), db: Session = Depends(get_db)):
    return db.query(Transaction).filter(Transaction.vendor_id == current_user.id).all()

@router.get("/portal/earnings")
def get_vendor_earnings_summary(current_user: User = Depends(vendor_guard), db: Session = Depends(get_db)):
    settings = db.query(AdminSettings).first()
    comm_rate = settings.commission_rate if settings else 5.0
    currency = settings.currency_symbol if settings else "₹"
    
    txns = db.query(Transaction).filter(Transaction.vendor_id == current_user.id).all()
    
    total_released = 0.0
    total_pending = 0.0
    
    for t in txns:
        # Payout is amount minus platform commission
        net_amount = t.amount * (1.0 - comm_rate / 100.0)
        if t.status == "Released":
            total_released += net_amount
        elif t.status == "Pending":
            total_pending += net_amount
            
    bookings_count = db.query(Booking).filter(Booking.vendor_id == current_user.id).count()
    
    return {
        "total_earnings": total_released,
        "escrow_balance": total_pending,
        "total_bookings": bookings_count,
        "currency_symbol": currency
    }

@router.post("/portal/boost")
def activate_boost(
    payload: BoostRequest,
    current_user: User = Depends(vendor_guard),
    db: Session = Depends(get_db)
):
    profile = db.query(VendorProfile).filter(VendorProfile.id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
        
    prices = [999.0, 1799.0, 2999.0]
    if payload.plan_index < 0 or payload.plan_index >= len(prices):
        raise HTTPException(status_code=400, detail="Invalid plan selected.")
        
    amount = prices[payload.plan_index]
    profile.is_boosted = True
    
    # Create transaction record for platform payment
    import datetime
    new_txn = Transaction(
        booking_id=0,
        vendor_id=current_user.id,
        amount=amount,
        type="debit",
        status="Released",
        date=datetime.date.today().strftime("%b %d, %Y"),
        client_name="Platform Boost Fee",
        vendor_name=profile.business_name
    )
    db.add(new_txn)
    db.commit()
    return {"message": "Boost activated successfully."}

@router.post("/upload")
def upload_file(
    file: UploadFile = File(...)
):
    upload_dir = "static/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_ext = os.path.splitext(file.filename)[1]
    new_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, new_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"file_url": f"http://127.0.0.1:8000/static/uploads/{new_filename}"}

@router.get("/portal/calendar/blocked", response_model=List[BlockedDateOut])
def get_blocked_dates(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(VendorProfile).filter(VendorProfile.id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Vendor profile not found.")
    return db.query(BlockedDate).filter(BlockedDate.vendor_id == current_user.id).all()

@router.post("/portal/calendar/toggle-block")
def toggle_blocked_date(payload: BlockedDateCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(VendorProfile).filter(VendorProfile.id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Vendor profile not found.")
        
    existing = db.query(BlockedDate).filter(
        BlockedDate.vendor_id == current_user.id,
        BlockedDate.date == payload.date
    ).first()
    
    if existing:
        db.delete(existing)
        db.commit()
        return {"status": "unblocked", "message": f"Date {payload.date} unblocked successfully."}
    else:
        new_block = BlockedDate(
            vendor_id=current_user.id,
            date=payload.date
        )
        db.add(new_block)
        db.commit()
        return {"status": "blocked", "message": f"Date {payload.date} blocked successfully."}
