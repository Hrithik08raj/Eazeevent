from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
import razorpay
import datetime
from app.database import get_db
from app.config import settings
from app.models import User, Booking, Transaction, VendorProfile
from app.deps import get_current_user

router = APIRouter(prefix="/api/payments", tags=["payments"])

class CreateOrderRequest(BaseModel):
    booking_id: int
    amount: float

class VerifyPaymentRequest(BaseModel):
    booking_id: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@router.post("/create-order")
def create_payment_order(payload: CreateOrderRequest, current_user: User = Depends(get_current_user)):
    try:
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        
        # Razorpay amount is in paise (1 INR = 100 paise)
        amount_paise = int(payload.amount * 100)
        
        order_data = {
            "amount": amount_paise,
            "currency": "INR",
            "receipt": f"receipt_booking_{payload.booking_id}",
            "payment_capture": 1 # Auto capture payment
        }
        
        order = client.order.create(data=order_data)
        return {
            "order_id": order["id"],
            "amount": payload.amount,
            "currency": "INR",
            "key_id": settings.RAZORPAY_KEY_ID
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create payment order: {str(e)}"
        )

@router.post("/verify-signature")
def verify_payment_signature(
    payload: VerifyPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        
        # Verify the signature
        params_dict = {
            'razorpay_order_id': payload.razorpay_order_id,
            'razorpay_payment_id': payload.razorpay_payment_id,
            'razorpay_signature': payload.razorpay_signature
        }
        
        client.utility.verify_payment_signature(params_dict)
        
        # Signature is verified, process booking & transaction
        booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found.")
            
        # Update paid amount
        booking.paid_amount = booking.amount
        booking.status = "Confirmed"
        
        # Record escrow deposit transaction
        cust_user = db.query(User).filter(User.id == booking.customer_id).first()
        vend_profile = db.query(VendorProfile).filter(VendorProfile.id == booking.vendor_id).first()
        
        new_txn = Transaction(
            booking_id=booking.id,
            vendor_id=booking.vendor_id,
            amount=booking.amount,
            type="deposit",
            status="Pending", # Held in escrow until released by admin
            date=datetime.date.today().strftime("%b %d, %Y"),
            client_name=cust_user.name if cust_user else "Client",
            vendor_name=vend_profile.business_name if vend_profile else "Vendor"
        )
        db.add(new_txn)
        db.commit()
        
        return {"status": "success", "message": "Payment verified and recorded in escrow."}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Signature verification failed: {str(e)}"
        )
