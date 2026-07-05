from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from app.database import get_db
from app.models import User, CustomerProfile, VendorProfile, Booking, AdminSettings, SupportTicket, ActivityLog, Transaction
from app.schemas import (
    CustomerProfileOut, VendorProfileOut, AdminSettingsOut, AdminSettingsUpdate, AdminOverviewStats,
    SupportTicketOut, ActivityLogOut, ActivityLogBase, TransactionOut
)
from app.deps import RoleChecker
from app.security import create_access_token
from app.notifications import send_notification_email

router = APIRouter(prefix="/api/admin", tags=["admin"])
admin_guard = RoleChecker(allowed_roles=["admin"])

@router.get("/overview", response_model=AdminOverviewStats)
def get_admin_overview_stats(current_user: User = Depends(admin_guard), db: Session = Depends(get_db)):
    total_customers = db.query(User).filter(User.role == "customer").count()
    total_vendors = db.query(User).filter(User.role == "vendor").count()
    verified_vendors = db.query(VendorProfile).filter(VendorProfile.status == "Verified").count()
    pending_approvals = db.query(VendorProfile).filter(VendorProfile.status == "Pending").count()
    
    # Calculate revenue from bookings
    bookings = db.query(Booking).filter(Booking.status != "Cancelled").all()
    total_revenue = sum(b.amount for b in bookings)
    
    settings = db.query(AdminSettings).first()
    commission_rate = settings.commission_rate if settings else 5.0
    commission_earned = total_revenue * (commission_rate / 100.0)
    
    return {
        "total_revenue": total_revenue,
        "total_customers": total_customers,
        "total_vendors": total_vendors,
        "verified_vendors": verified_vendors,
        "commission_earned": commission_earned,
        "pending_approvals_count": pending_approvals
    }

@router.get("/customers", response_model=List[CustomerProfileOut])
def get_all_customers(current_user: User = Depends(admin_guard), db: Session = Depends(get_db)):
    customers = db.query(CustomerProfile).all()
    out = []
    for c in customers:
        user = db.query(User).filter(User.id == c.id).first()
        out.append({
            "email": user.email if user else "",
            "name": user.name if user else "",
            "phone": c.phone,
            "wedding_date": c.wedding_date,
            "estimated_budget": c.estimated_budget,
            "actual_budget": c.actual_budget,
            "status": c.status,
            "risk_description": c.risk_description
        })
    return out

@router.get("/vendors", response_model=List[VendorProfileOut])
def get_all_vendors_admin(current_user: User = Depends(admin_guard), db: Session = Depends(get_db)):
    vendors = db.query(VendorProfile).all()
    out = []
    for v in vendors:
        user = db.query(User).filter(User.id == v.id).first()
        out.append({
            "id": v.id,
            "name": user.name if user else "",
            "email": user.email if user else "",
            "business_name": v.business_name,
            "category": v.category,
            "city": v.city,
            "bookings_count": v.bookings_count or 0,
            "rating": v.rating or 5.0,
            "status": v.status,
            "services_offered": v.services_offered,
            "profile_image": v.profile_image,
            "starting_price": v.starting_price or 0.0,
            "packages": v.packages
        })
    return out

@router.post("/vendors/{vendor_id}/verify")
def verify_vendor(vendor_id: int, current_user: User = Depends(admin_guard), db: Session = Depends(get_db)):
    profile = db.query(VendorProfile).filter(VendorProfile.id == vendor_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Vendor profile not found.")
        
    profile.status = "Verified"
    db.commit()
    
    # Send activation email to vendor
    vendor_user = db.query(User).filter(User.id == vendor_id).first()
    if vendor_user:
        send_notification_email(
            to_email=vendor_user.email,
            subject="Congratulations! Your Eazeevent Vendor Profile is Active 🎉",
            body=f"Hi {vendor_user.name},\n\nWe are pleased to inform you that your vendor profile '{profile.business_name}' has been successfully verified by our administrator!\n\nYou can now log in to the vendor portal and start accepting bookings, discussing details with customers, and publishing your packages.\n\nBest Regards,\nThe Eazeevent Team"
        )
        
    return {"message": "Vendor verified successfully."}

@router.get("/settings", response_model=AdminSettingsOut)
def get_admin_settings(current_user: User = Depends(admin_guard), db: Session = Depends(get_db)):
    settings = db.query(AdminSettings).first()
    if not settings:
        # Create default settings if not exists
        settings = AdminSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@router.put("/settings", response_model=AdminSettingsOut)
def update_admin_settings(
    payload: AdminSettingsUpdate, 
    current_user: User = Depends(admin_guard), 
    db: Session = Depends(get_db)
):
    settings = db.query(AdminSettings).first()
    if not settings:
        settings = AdminSettings()
        db.add(settings)
        
    settings.platform_name = payload.platform_name
    settings.support_email = payload.support_email
    settings.commission_rate = payload.commission_rate
    settings.currency_symbol = payload.currency_symbol
    settings.maintenance_mode = payload.maintenance_mode
    settings.gemini_api_key = payload.gemini_api_key
    
    db.commit()
    db.refresh(settings)
    return settings

@router.post("/impersonate/{customer_email}")
def impersonate_customer(
    customer_email: str, 
    current_user: User = Depends(admin_guard), 
    db: Session = Depends(get_db)
):
    customer = db.query(User).filter(User.email == customer_email, User.role == "customer").first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found.")
        
    # Generate customer-scoped token
    token = create_access_token(
        subject=customer.email,
        role="customer",
        name=customer.name
    )
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": "customer",
        "name": customer.name,
        "email": customer.email,
        "impersonating": True
    }

class CustomerStatusUpdate(BaseModel):
    status: str
    risk_description: Optional[str] = None

@router.put("/customers/{customer_email}/status")
def update_customer_status(
    customer_email: str, 
    payload: CustomerStatusUpdate, 
    current_user: User = Depends(admin_guard), 
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == customer_email, User.role == "customer").first()
    if not user or not user.customer_profile:
        raise HTTPException(status_code=404, detail="Customer profile not found.")
    user.customer_profile.status = payload.status
    user.customer_profile.risk_description = payload.risk_description
    db.commit()
    return {"message": "Status updated successfully."}

@router.delete("/customers/{customer_email}")
def delete_customer(
    customer_email: str, 
    current_user: User = Depends(admin_guard), 
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == customer_email, User.role == "customer").first()
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found.")
    db.delete(user)
    db.commit()
    return {"message": "Customer deleted successfully."}

# --- ADMIN SUPPORT TICKETS ---
@router.get("/tickets", response_model=List[SupportTicketOut])
def get_all_tickets(current_user: User = Depends(admin_guard), db: Session = Depends(get_db)):
    return db.query(SupportTicket).all()

class TicketReplyPayload(BaseModel):
    reply_text: str

@router.post("/tickets/{ticket_id}/reply")
def reply_to_ticket(
    ticket_id: int,
    payload: TicketReplyPayload,
    current_user: User = Depends(admin_guard),
    db: Session = Depends(get_db)
):
    import json
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")
    
    replies = []
    if ticket.replies:
        try:
            replies = json.loads(ticket.replies)
        except Exception:
            replies = []
            
    replies.append(f"Admin replied: {payload.reply_text}")
    ticket.replies = json.dumps(replies)
    db.commit()
    return {"message": "Reply added successfully."}

@router.post("/tickets/{ticket_id}/resolve")
def resolve_ticket(
    ticket_id: int,
    current_user: User = Depends(admin_guard),
    db: Session = Depends(get_db)
):
    import json
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found.")
    
    ticket.status = "Resolved"
    
    replies = []
    if ticket.replies:
        try:
            replies = json.loads(ticket.replies)
        except Exception:
            replies = []
    replies.append("System notice: Ticket resolved by administrator Sharma.")
    ticket.replies = json.dumps(replies)
    
    db.commit()
    return {"message": "Ticket resolved successfully."}

# --- ADMINISTRATIVE ACTIVITY LOGS ---
@router.get("/activities", response_model=List[ActivityLogOut])
def get_activities(current_user: User = Depends(admin_guard), db: Session = Depends(get_db)):
    return db.query(ActivityLog).order_by(ActivityLog.id.desc()).limit(20).all()

@router.post("/activities", response_model=ActivityLogOut)
def log_activity(
    payload: ActivityLogBase,
    current_user: User = Depends(admin_guard),
    db: Session = Depends(get_db)
):
    log = ActivityLog(
        text=payload.text,
        time=payload.time,
        type=payload.type
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

# --- TRANSACTION LEDGER ---
@router.get("/transactions", response_model=List[TransactionOut])
def get_transactions_admin(current_user: User = Depends(admin_guard), db: Session = Depends(get_db)):
    return db.query(Transaction).all()

@router.post("/transactions/{transaction_id}/release")
def release_escrow(transaction_id: int, current_user: User = Depends(admin_guard), db: Session = Depends(get_db)):
    txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found.")
    
    txn.status = "Released"
    # Update corresponding booking status to Paid
    booking = db.query(Booking).filter(Booking.id == txn.booking_id).first()
    if booking:
        booking.paid_amount = booking.amount
        
    db.commit()
    return {"message": "Escrow funds released successfully."}

@router.post("/transactions/{transaction_id}/refund")
def refund_escrow(transaction_id: int, current_user: User = Depends(admin_guard), db: Session = Depends(get_db)):
    txn = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found.")
    
    txn.status = "Refunded"
    booking = db.query(Booking).filter(Booking.id == txn.booking_id).first()
    if booking:
        booking.status = "Cancelled"
        
    db.commit()
    return {"message": "Escrow funds refunded successfully."}

