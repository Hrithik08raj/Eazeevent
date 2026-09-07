from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, CustomerProfile, VendorProfile
from app.schemas import LoginRequest, TokenResponse, CustomerRegisterRequest, VendorRegisterRequest, PasswordResetRequest, PasswordResetConfirm
from app.security import verify_password, get_password_hash, create_access_token
from app.deps import get_db
from app.notifications import send_notification_email

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register/customer", status_code=status.HTTP_201_CREATED)
def register_customer(payload: CustomerRegisterRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )
        
    hashed_pwd = get_password_hash(payload.password)
    
    # Create main user record
    new_user = User(
        email=payload.email,
        hashed_password=hashed_pwd,
        name=payload.name,
        role="customer"
    )
    db.add(new_user)
    db.flush() # flush to get user.id
    
    # Create customer profile record
    new_profile = CustomerProfile(
        id=new_user.id,
        phone=payload.phone,
        wedding_date=payload.wedding_date,
        estimated_budget=payload.estimated_budget,
        actual_budget=0.0,
        status="ON TRACK",
        proof_file=payload.proof_file
    )
    db.add(new_profile)
    db.commit()
    
    # Send welcome email notification
    send_notification_email(
        to_email=payload.email,
        subject="Welcome to Eazeevent! 🎉",
        body=f"Hi {payload.name},\n\nThank you for registering on Eazeevent! Your account is active, and you can now start planning your wedding budget, checklist, timeline, and search for peak-season vendors.\n\nBest Regards,\nThe Eazeevent Team"
    )
    
    return {"message": "Customer registered successfully."}

@router.post("/register/vendor", status_code=status.HTTP_201_CREATED)
def register_vendor(payload: VendorRegisterRequest, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )
        
    hashed_pwd = get_password_hash(payload.password)
    
    # Create main user record
    new_user = User(
        email=payload.email,
        hashed_password=hashed_pwd,
        name=payload.name,
        role="vendor"
    )
    db.add(new_user)
    db.flush()
    
    # Create vendor profile record
    new_profile = VendorProfile(
        id=new_user.id,
        business_name=payload.business_name,
        category=payload.category,
        city=payload.city,
        bookings_count=0,
        rating=5.0,
        status="Pending", # Requires admin approval
        proof_file=payload.proof_file,
        profile_image=payload.profile_image
    )
    db.add(new_profile)
    db.commit()
    
    # 1. Send confirmation email to Vendor
    send_notification_email(
        to_email=payload.email,
        subject="Vendor Registration Received 📝",
        body=f"Hi {payload.name},\n\nYour vendor registration for '{payload.business_name}' has been received successfully!\n\nOur administration team is currently reviewing your uploaded certificate: {payload.proof_file}.\nYou will receive another email alert as soon as your profile is verified and active.\n\nBest Regards,\nThe Eazeevent Team"
    )
    
    # 2. Send email alert to Admin
    send_notification_email(
        to_email="admin@eazeevent.com",
        subject="⚠️ Action Required: New Vendor Pending Verification",
        body=f"Hello Admin,\n\nA new vendor '{payload.business_name}' has registered under the category '{payload.category}' in '{payload.city}'.\n\nProof Document Url: {payload.proof_file}\n\nPlease log in to the admin panel to review and approve/verify this profile.\n\nBest,\nEazeevent Platform"
    )
    
    return {"message": "Vendor registered successfully. Please wait for admin approval."}

import time
login_attempts = {}

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    # Rate limit check
    now = time.time()
    attempts = login_attempts.get(payload.email, [])
    attempts = [t for t in attempts if now - t < 60]
    login_attempts[payload.email] = attempts
    
    if len(attempts) >= 5:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again in 1 minute."
        )
    login_attempts[payload.email].append(now)

    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
        
    # Security Rule: Pending vendors cannot log in until approved
    if user.role == "vendor":
        profile = db.query(VendorProfile).filter(VendorProfile.id == user.id).first()
        if profile and profile.status != "Verified":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="🔒 Your vendor profile is pending verification. Please wait for admin approval."
            )
            
    # Create token
    access_token = create_access_token(
        subject=user.email,
        role=user.role,
        name=user.name
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "name": user.name,
        "email": user.email
    }

import secrets
import time
reset_otps = {}  # In-memory dictionary for OTP store: {email: {"otp": otp, "expires_at": expires_at, "attempts": attempts}}
otp_request_timestamps = {}  # Rate-limit store: {email: last_request_time}
OTP_REQUEST_COOLDOWN_SECONDS = 60  # Minimum seconds between OTP requests per email

@router.post("/password-reset/request")
def request_password_reset(payload: PasswordResetRequest, db: Session = Depends(get_db)):
    # Rate-limit OTP requests: max 1 request per email per 60 seconds
    now = time.time()
    last_request = otp_request_timestamps.get(payload.email, 0)
    if now - last_request < OTP_REQUEST_COOLDOWN_SECONDS:
        wait_seconds = int(OTP_REQUEST_COOLDOWN_SECONDS - (now - last_request))
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Please wait {wait_seconds} seconds before requesting another reset code."
        )
    otp_request_timestamps[payload.email] = now
    
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # Prevent email enumeration by returning a success message regardless
        return {"message": "If this email is registered, a password reset code has been sent."}
        
    # Generate a cryptographically secure random 6-digit OTP
    otp = f"{secrets.randbelow(900000) + 100000}"
    reset_otps[payload.email] = {
        "otp": otp,
        "expires_at": time.time() + 600,  # 10 minutes expiry
        "attempts": 0
    }
    
    # Send email
    send_notification_email(
        to_email=payload.email,
        subject="Password Reset Verification Code - Eazeevent Key 🔑",
        body=f"Hello,\n\nWe received a request to reset your Eazeevent account password.\n\nYour 6-digit password reset verification code is:\n\n{otp}\n\nPlease enter this code in the app to choose a new password. Do not share this code with anyone.\n\nBest,\nThe Eazeevent Security Team"
    )
    
    return {"message": "If this email is registered, a password reset code has been sent."}

@router.post("/password-reset/confirm")
def confirm_password_reset(payload: PasswordResetConfirm, db: Session = Depends(get_db)):
    otp_data = reset_otps.get(payload.email)
    if not otp_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code not found or expired. Please request a new one."
        )
        
    # Check expiry
    if time.time() > otp_data["expires_at"]:
        reset_otps.pop(payload.email, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new one."
        )
        
    # Increment attempts and check limit
    otp_data["attempts"] += 1
    if otp_data["attempts"] > 5:
        reset_otps.pop(payload.email, None)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many failed verification attempts. Please request a new code."
        )
        
    if otp_data["otp"] != payload.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code."
        )
        
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    user.hashed_password = get_password_hash(payload.new_password)
    db.commit()
    
    # Remove OTP from memory
    reset_otps.pop(payload.email, None)
    
    # Send confirmation email
    send_notification_email(
        to_email=payload.email,
        subject="Password Reset Successful 🛡️",
        body=f"Hello {user.name},\n\nThis is a confirmation that your Eazeevent account password has been successfully updated.\n\nIf you did not make this change, please contact our support team immediately.\n\nBest,\nThe Eazeevent Security Team"
    )
    
    return {"message": "Password reset successfully."}

