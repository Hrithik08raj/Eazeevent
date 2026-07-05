from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, CustomerProfile, Expense, Guest, ChecklistItem, Booking, Inquiry, VendorProfile, AdminSettings, TimelineItem, SupportTicket
from app.schemas import (
    CustomerProfileOut, CustomerProfileUpdate,
    ExpenseOut, ExpenseCreate,
    GuestOut, GuestCreate,
    ChecklistItemOut, ChecklistItemCreate,
    BookingOut, InquiryOut, InquiryCreate,
    TimelineItemOut, TimelineItemCreate,
    SupportTicketOut, SupportTicketCreate
)
from app.deps import RoleChecker

router = APIRouter(prefix="/api/customer", tags=["customer"])
customer_guard = RoleChecker(allowed_roles=["customer"])

# Helper helper to update customer actual budget total
def recalculate_actual_budget(customer_id: int, db: Session):
    total = 0.0
    expenses = db.query(Expense).filter(Expense.customer_id == customer_id).all()
    for e in expenses:
        total += e.cost
    
    profile = db.query(CustomerProfile).filter(CustomerProfile.id == customer_id).first()
    if profile:
        profile.actual_budget = total
        # Determine status
        if profile.estimated_budget > 0 and total > profile.estimated_budget:
            settings = db.query(AdminSettings).first()
            currency = settings.currency_symbol if settings else "₹"
            profile.status = "AT RISK"
            profile.risk_description = f"Overbudget by {currency} {total - profile.estimated_budget:,.2f}"
        else:
            profile.status = "ON TRACK"
            profile.risk_description = ""
        db.commit()

# --- PROFILE ENDPOINTS ---
@router.get("/profile", response_model=CustomerProfileOut)
def get_customer_profile(current_user: User = Depends(customer_guard), db: Session = Depends(get_db)):
    profile = db.query(CustomerProfile).filter(CustomerProfile.id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
    return {
        "email": current_user.email,
        "name": current_user.name,
        "phone": profile.phone,
        "wedding_date": profile.wedding_date,
        "estimated_budget": profile.estimated_budget,
        "actual_budget": profile.actual_budget,
        "status": profile.status,
        "risk_description": profile.risk_description
    }

@router.put("/profile", response_model=CustomerProfileOut)
def update_customer_profile(
    payload: CustomerProfileUpdate, 
    current_user: User = Depends(customer_guard), 
    db: Session = Depends(get_db)
):
    profile = db.query(CustomerProfile).filter(CustomerProfile.id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
        
    current_user.name = payload.name
    if payload.phone is not None:
        profile.phone = payload.phone
    if payload.wedding_date is not None:
        profile.wedding_date = payload.wedding_date
    if payload.estimated_budget is not None:
        profile.estimated_budget = payload.estimated_budget
        
    db.commit()
    recalculate_actual_budget(current_user.id, db)
    db.refresh(profile)
    
    return {
        "email": current_user.email,
        "name": current_user.name,
        "phone": profile.phone,
        "wedding_date": profile.wedding_date,
        "estimated_budget": profile.estimated_budget,
        "actual_budget": profile.actual_budget,
        "status": profile.status,
        "risk_description": profile.risk_description
    }

# --- EXPENSES ENDPOINTS ---
@router.get("/expenses", response_model=List[ExpenseOut])
def get_expenses(current_user: User = Depends(customer_guard), db: Session = Depends(get_db)):
    return db.query(Expense).filter(Expense.customer_id == current_user.id).all()

@router.post("/expenses", response_model=ExpenseOut)
def create_expense(
    payload: ExpenseCreate, 
    current_user: User = Depends(customer_guard), 
    db: Session = Depends(get_db)
):
    new_expense = Expense(
        customer_id=current_user.id,
        name=payload.name,
        category=payload.category,
        cost=payload.cost,
        paid_amount=payload.paid_amount,
        status=payload.status
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    recalculate_actual_budget(current_user.id, db)
    return new_expense

@router.put("/expenses/{expense_id}", response_model=ExpenseOut)
def update_expense(
    expense_id: int, 
    payload: ExpenseCreate, 
    current_user: User = Depends(customer_guard), 
    db: Session = Depends(get_db)
):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.customer_id == current_user.id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found.")
        
    expense.name = payload.name
    expense.category = payload.category
    expense.cost = payload.cost
    expense.paid_amount = payload.paid_amount
    expense.status = payload.status
    
    db.commit()
    db.refresh(expense)
    recalculate_actual_budget(current_user.id, db)
    return expense

@router.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, current_user: User = Depends(customer_guard), db: Session = Depends(get_db)):
    expense = db.query(Expense).filter(Expense.id == expense_id, Expense.customer_id == current_user.id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found.")
        
    db.delete(expense)
    db.commit()
    recalculate_actual_budget(current_user.id, db)
    return {"message": "Expense deleted successfully."}

# --- GUESTS ENDPOINTS ---
@router.get("/guests", response_model=List[GuestOut])
def get_guests(current_user: User = Depends(customer_guard), db: Session = Depends(get_db)):
    return db.query(Guest).filter(Guest.customer_id == current_user.id).all()

@router.post("/guests", response_model=GuestOut)
def create_guest(
    payload: GuestCreate, 
    current_user: User = Depends(customer_guard), 
    db: Session = Depends(get_db)
):
    new_guest = Guest(
        customer_id=current_user.id,
        name=payload.name,
        phone=payload.phone,
        email=payload.email,
        rsvp_status=payload.rsvp_status,
        invitation_sent=payload.invitation_sent
    )
    db.add(new_guest)
    db.commit()
    db.refresh(new_guest)
    return new_guest

@router.put("/guests/{guest_id}", response_model=GuestOut)
def update_guest(
    guest_id: int, 
    payload: GuestCreate, 
    current_user: User = Depends(customer_guard), 
    db: Session = Depends(get_db)
):
    guest = db.query(Guest).filter(Guest.id == guest_id, Guest.customer_id == current_user.id).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found.")
        
    guest.name = payload.name
    guest.phone = payload.phone
    guest.email = payload.email
    guest.rsvp_status = payload.rsvp_status
    guest.invitation_sent = payload.invitation_sent
    
    db.commit()
    db.refresh(guest)
    return guest

@router.delete("/guests/{guest_id}")
def delete_guest(guest_id: int, current_user: User = Depends(customer_guard), db: Session = Depends(get_db)):
    guest = db.query(Guest).filter(Guest.id == guest_id, Guest.customer_id == current_user.id).first()
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found.")
        
    db.delete(guest)
    db.commit()
    return {"message": "Guest deleted successfully."}

# --- CHECKLIST ENDPOINTS ---
@router.get("/checklist", response_model=List[ChecklistItemOut])
def get_checklist(current_user: User = Depends(customer_guard), db: Session = Depends(get_db)):
    return db.query(ChecklistItem).filter(ChecklistItem.customer_id == current_user.id).all()

@router.post("/checklist", response_model=ChecklistItemOut)
def create_checklist_item(
    payload: ChecklistItemCreate, 
    current_user: User = Depends(customer_guard), 
    db: Session = Depends(get_db)
):
    new_item = ChecklistItem(
        customer_id=current_user.id,
        title=payload.title,
        category=payload.category,
        status=payload.status,
        due_date=payload.due_date
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.put("/checklist/{item_id}", response_model=ChecklistItemOut)
def update_checklist_item(
    item_id: int, 
    payload: ChecklistItemCreate, 
    current_user: User = Depends(customer_guard), 
    db: Session = Depends(get_db)
):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id, ChecklistItem.customer_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")
        
    item.title = payload.title
    item.category = payload.category
    item.status = payload.status
    item.due_date = payload.due_date
    
    db.commit()
    db.refresh(item)
    return item

@router.delete("/checklist/{item_id}")
def delete_checklist_item(item_id: int, current_user: User = Depends(customer_guard), db: Session = Depends(get_db)):
    item = db.query(ChecklistItem).filter(ChecklistItem.id == item_id, ChecklistItem.customer_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")
        
    db.delete(item)
    db.commit()
    return {"message": "Checklist item deleted successfully."}

# --- BOOKINGS & LEADS ENDPOINTS ---
@router.get("/bookings", response_model=List[BookingOut])
def get_customer_bookings(current_user: User = Depends(customer_guard), db: Session = Depends(get_db)):
    bookings = db.query(Booking).filter(Booking.customer_id == current_user.id).all()
    out = []
    for b in bookings:
        v_user = db.query(User).filter(User.id == b.vendor_id).first()
        v_profile = db.query(VendorProfile).filter(VendorProfile.id == b.vendor_id).first()
        out.append({
            "id": b.id,
            "customer_id": b.customer_id,
            "customer_name": current_user.name,
            "vendor_id": b.vendor_id,
            "vendor_name": v_profile.business_name if v_profile else (v_user.name if v_user else "Unknown Vendor"),
            "package_name": b.package_name,
            "date": b.date,
            "amount": b.amount,
            "paid_amount": b.paid_amount,
            "status": b.status,
            "location": b.location
        })
    return out

@router.get("/inquiries", response_model=List[InquiryOut])
def get_customer_inquiries(current_user: User = Depends(customer_guard), db: Session = Depends(get_db)):
    inquiries = db.query(Inquiry).filter(Inquiry.customer_id == current_user.id).all()
    out = []
    for i in inquiries:
        v_profile = db.query(VendorProfile).filter(VendorProfile.id == i.vendor_id).first()
        out.append({
            "id": i.id,
            "customer_id": i.customer_id,
            "customer_name": current_user.name,
            "vendor_id": i.vendor_id,
            "vendor_name": v_profile.business_name if v_profile else "Unknown Vendor",
            "pkg": i.pkg,
            "date": i.date,
            "location": i.location,
            "status": i.status,
            "budget": i.budget
        })
    return out

@router.post("/inquiries", response_model=InquiryOut)
def create_customer_inquiry(
    payload: InquiryCreate, 
    current_user: User = Depends(customer_guard), 
    db: Session = Depends(get_db)
):
    v_profile = db.query(VendorProfile).filter(VendorProfile.id == payload.vendor_id).first()
    if not v_profile:
        raise HTTPException(status_code=404, detail="Vendor not found.")
        
    new_inquiry = Inquiry(
        customer_id=current_user.id,
        vendor_id=payload.vendor_id,
        pkg=payload.pkg,
        date=payload.date,
        location=payload.location,
        budget=payload.budget,
        status="New Request"
    )
    db.add(new_inquiry)
    db.commit()
    db.refresh(new_inquiry)
    
    return {
        "id": new_inquiry.id,
        "customer_id": new_inquiry.customer_id,
        "customer_name": current_user.name,
        "vendor_id": new_inquiry.vendor_id,
        "vendor_name": v_profile.business_name,
        "pkg": new_inquiry.pkg,
        "date": new_inquiry.date,
        "location": new_inquiry.location,
        "status": new_inquiry.status,
        "budget": new_inquiry.budget
    }

# --- TIMELINE ENDPOINTS ---
@router.get("/timeline", response_model=List[TimelineItemOut])
def get_timeline(current_user: User = Depends(customer_guard), db: Session = Depends(get_db)):
    return db.query(TimelineItem).filter(TimelineItem.customer_id == current_user.id).all()

@router.post("/timeline", response_model=TimelineItemOut)
def create_timeline_item(
    payload: TimelineItemCreate, 
    current_user: User = Depends(customer_guard), 
    db: Session = Depends(get_db)
):
    new_item = TimelineItem(
        customer_id=current_user.id,
        date_or_day=payload.date_or_day,
        time=payload.time,
        description=payload.description
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.delete("/timeline/{item_id}")
def delete_timeline_item(item_id: int, current_user: User = Depends(customer_guard), db: Session = Depends(get_db)):
    item = db.query(TimelineItem).filter(TimelineItem.id == item_id, TimelineItem.customer_id == current_user.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")
    db.delete(item)
    db.commit()
    return {"message": "Timeline item deleted successfully."}

# --- SUPPORT TICKETS ---
@router.post("/tickets", response_model=SupportTicketOut)
def create_support_ticket(
    payload: SupportTicketCreate,
    current_user: User = Depends(customer_guard),
    db: Session = Depends(get_db)
):
    import datetime
    new_ticket = SupportTicket(
        client_name=current_user.name,
        client_email=current_user.email,
        subject=payload.subject,
        message=payload.message,
        category=payload.category,
        priority=payload.priority,
        status="New",
        date=datetime.date.today().strftime("%b %d, %Y"),
        replies="[]"
    )
    db.add(new_ticket)
    db.commit()
    db.refresh(new_ticket)
    return new_ticket
