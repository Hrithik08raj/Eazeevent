from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional, List

# --- AUTH SCHEMAS ---
class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    name: str
    email: str

class CustomerRegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    phone: Optional[str] = None
    wedding_date: Optional[str] = None
    estimated_budget: Optional[float] = 0.0
    proof_file: Optional[str] = None

class VendorRegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    business_name: str
    category: str
    city: str
    proof_file: Optional[str] = None
    profile_image: Optional[str] = None

# --- EXPENSE SCHEMAS ---
class ExpenseBase(BaseModel):
    name: str
    category: str
    cost: float
    paid_amount: float
    status: str

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseOut(ExpenseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int

# --- GUEST SCHEMAS ---
class GuestBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    rsvp_status: str
    invitation_sent: bool

class GuestCreate(GuestBase):
    pass

class GuestOut(GuestBase):
    model_config = ConfigDict(from_attributes=True)

    id: int

# --- CHECKLIST SCHEMAS ---
class ChecklistItemBase(BaseModel):
    title: str
    category: str
    status: str
    due_date: Optional[str] = None

class ChecklistItemCreate(ChecklistItemBase):
    pass

class ChecklistItemOut(ChecklistItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int

# --- INQUIRY SCHEMAS ---
class InquiryCreate(BaseModel):
    vendor_id: int
    pkg: str
    date: str
    location: str
    budget: float

class InquiryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    customer_name: Optional[str] = None
    vendor_id: int
    vendor_name: Optional[str] = None
    pkg: str
    date: str
    location: str
    status: str
    budget: float

class InquiryStatusUpdate(BaseModel):
    status: str

# --- REVIEW SCHEMAS ---
class ReviewCreate(BaseModel):
    rating: float
    text: str

class ReviewReply(BaseModel):
    reply_text: str

class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reviewer_name: str
    rating: float
    text: str
    date: str
    replied: bool
    reply_text: Optional[str] = None

# --- BOOKING SCHEMAS ---
class BookingCreate(BaseModel):
    vendor_id: int
    package_name: str
    date: str
    amount: float
    paid_amount: float
    location: Optional[str] = None

class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    customer_id: int
    customer_name: Optional[str] = None
    vendor_id: int
    vendor_name: Optional[str] = None
    package_name: str
    date: str
    amount: float
    paid_amount: float
    status: str
    location: Optional[str] = None

# --- PROFILE SCHEMAS ---
class CustomerProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    email: str
    name: str
    phone: Optional[str] = None
    wedding_date: Optional[str] = None
    estimated_budget: float
    actual_budget: float
    status: str
    risk_description: Optional[str] = None

class CustomerProfileUpdate(BaseModel):
    name: str
    phone: Optional[str] = None
    wedding_date: Optional[str] = None
    estimated_budget: Optional[float] = None

class VendorProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    business_name: str
    category: str
    city: str
    bookings_count: int
    rating: float
    status: str
    services_offered: Optional[str] = None
    profile_image: Optional[str] = None
    starting_price: float
    packages: Optional[str] = None
    is_boosted: Optional[bool] = False

class VendorProfileUpdate(BaseModel):
    name: str
    business_name: str
    category: str
    city: str
    services_offered: Optional[str] = None
    starting_price: Optional[float] = None
    packages: Optional[str] = None

class BoostRequest(BaseModel):
    plan_index: int

class BoostVerifyRequest(BaseModel):
    plan_index: int
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


# --- ADMIN SETTINGS & STATS ---
class AdminSettingsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    platform_name: str
    support_email: str
    commission_rate: float
    currency_symbol: str
    maintenance_mode: bool
    gemini_api_key: Optional[str] = None

class AdminSettingsUpdate(BaseModel):
    platform_name: str
    support_email: str
    commission_rate: float
    currency_symbol: str
    maintenance_mode: bool
    gemini_api_key: Optional[str] = None

class AdminOverviewStats(BaseModel):
    total_revenue: float
    total_customers: int
    total_vendors: int
    verified_vendors: int
    commission_earned: float
    pending_approvals_count: int

# --- TIMELINE SCHEMAS ---
class TimelineItemBase(BaseModel):
    date_or_day: str
    time: str
    description: str

class TimelineItemCreate(TimelineItemBase):
    pass

class TimelineItemOut(TimelineItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: int

# --- SUPPORT TICKET SCHEMAS ---
class SupportTicketBase(BaseModel):
    subject: str
    category: str
    message: str

class SupportTicketCreate(SupportTicketBase):
    priority: str

class SupportTicketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    client_name: str
    client_email: str
    subject: str
    message: str
    category: str
    priority: str
    status: str
    date: str
    replies: Optional[str] = None

# --- ACTIVITY LOG SCHEMAS ---
class ActivityLogBase(BaseModel):
    text: str
    time: str
    type: str

class ActivityLogOut(ActivityLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: int

# --- TRANSACTION SCHEMAS ---
class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    booking_id: int
    vendor_id: int
    amount: float
    type: str
    status: str
    date: str
    client_name: str
    vendor_name: str

# --- CHAT MESSAGES SCHEMAS ---
class ChatMessageCreate(BaseModel):
    text: str

class ChatMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    inquiry_id: int
    sender_role: str
    text: str
    time: str

# --- PASSWORD RESET SCHEMAS ---
class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    email: str
    otp: str
    new_password: str

# --- BLOCKED DATES SCHEMAS ---
class BlockedDateCreate(BaseModel):
    date: str

class BlockedDateOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    vendor_id: int
    date: str
