from sqlalchemy import Column, Integer, String, Float, Boolean, Date, ForeignKey, Text, Table
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False) # 'customer', 'vendor', 'admin'
    is_active = Column(Boolean, default=True)

    # Relationships
    customer_profile = relationship("CustomerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    vendor_profile = relationship("VendorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    
    # Relationships for transactions
    expenses = relationship("Expense", back_populates="customer", cascade="all, delete-orphan")
    guests = relationship("Guest", back_populates="customer", cascade="all, delete-orphan")
    checklist_items = relationship("ChecklistItem", back_populates="customer", cascade="all, delete-orphan")
    timeline_items = relationship("TimelineItem", back_populates="customer", cascade="all, delete-orphan")
    
    # Bookings & Inquiries
    customer_bookings = relationship("Booking", foreign_keys="[Booking.customer_id]", back_populates="customer", cascade="all, delete-orphan")
    vendor_bookings = relationship("Booking", foreign_keys="[Booking.vendor_id]", back_populates="vendor", cascade="all, delete-orphan")
    
    customer_inquiries = relationship("Inquiry", foreign_keys="[Inquiry.customer_id]", back_populates="customer", cascade="all, delete-orphan")
    vendor_inquiries = relationship("Inquiry", foreign_keys="[Inquiry.vendor_id]", back_populates="vendor", cascade="all, delete-orphan")

class CustomerProfile(Base):
    __tablename__ = "customer_profiles"
    
    id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    phone = Column(String, nullable=True)
    wedding_date = Column(String, nullable=True)
    estimated_budget = Column(Float, default=0.0)
    actual_budget = Column(Float, default=0.0)
    status = Column(String, default="ON TRACK") # 'ON TRACK', 'AT RISK'
    risk_description = Column(String, nullable=True)
    proof_file = Column(String, nullable=True)
    
    user = relationship("User", back_populates="customer_profile")

class VendorProfile(Base):
    __tablename__ = "vendor_profiles"
    
    id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    business_name = Column(String, nullable=False)
    category = Column(String, nullable=False) # 'Photography', 'Decoration', 'Catering', etc.
    city = Column(String, nullable=False)
    bookings_count = Column(Integer, default=0)
    rating = Column(Float, default=5.0)
    status = Column(String, default="Pending") # 'Pending', 'Verified'
    proof_file = Column(String, nullable=True)
    profile_image = Column(String, nullable=True)
    services_offered = Column(Text, nullable=True)
    starting_price = Column(Float, default=60000.0)
    packages = Column(Text, nullable=True) # JSON list of packages
    is_boosted = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="vendor_profile")
    reviews = relationship("Review", back_populates="vendor", cascade="all, delete-orphan")

class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    cost = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    status = Column(String, default="Unpaid") # 'Paid', 'Pending', 'Unpaid'
    
    customer = relationship("User", back_populates="expenses")

class Guest(Base):
    __tablename__ = "guests"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    rsvp_status = Column(String, default="Pending") # 'Attending', 'Declined', 'Pending'
    invitation_sent = Column(Boolean, default=False)
    
    customer = relationship("User", back_populates="guests")

class ChecklistItem(Base):
    __tablename__ = "checklist_items"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    status = Column(String, default="Pending") # 'Completed', 'Pending'
    due_date = Column(String, nullable=True)
    
    customer = relationship("User", back_populates="checklist_items")

class Booking(Base):
    __tablename__ = "bookings"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    package_name = Column(String, nullable=False)
    date = Column(String, nullable=False)
    amount = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    status = Column(String, default="Confirmed") # 'Confirmed', 'Completed', 'Cancelled'
    location = Column(String, nullable=True)
    
    customer = relationship("User", foreign_keys=[customer_id], back_populates="customer_bookings")
    vendor = relationship("User", foreign_keys=[vendor_id], back_populates="vendor_bookings")

class Inquiry(Base):
    __tablename__ = "inquiries"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    pkg = Column(String, nullable=False) # e.g. 'Pre-wedding Shoot'
    date = Column(String, nullable=False)
    location = Column(String, nullable=False)
    status = Column(String, default="New Request") # 'New Request', 'In Discussion', 'Booked', 'Declined'
    budget = Column(Float, default=0.0)
    
    customer = relationship("User", foreign_keys=[customer_id], back_populates="customer_inquiries")
    vendor = relationship("User", foreign_keys=[vendor_id], back_populates="vendor_inquiries")

class Review(Base):
    __tablename__ = "reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendor_profiles.id"), nullable=False)
    reviewer_name = Column(String, nullable=False)
    rating = Column(Float, default=5.0)
    text = Column(Text, nullable=False)
    date = Column(String, nullable=False)
    replied = Column(Boolean, default=False)
    reply_text = Column(Text, nullable=True)
    
    vendor = relationship("VendorProfile", back_populates="reviews")

class AdminSettings(Base):
    __tablename__ = "admin_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    platform_name = Column(String, default="Eazeevent")
    support_email = Column(String, default="support@eazeevent.com")
    commission_rate = Column(Float, default=5.0)
    currency_symbol = Column(String, default="₹")
    maintenance_mode = Column(Boolean, default=False)
    gemini_api_key = Column(String, nullable=True)

class TimelineItem(Base):
    __tablename__ = "timeline_items"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date_or_day = Column(String, nullable=False)
    time = Column(String, nullable=False)
    description = Column(String, nullable=False)
    
    customer = relationship("User", back_populates="timeline_items")

class SupportTicket(Base):
    __tablename__ = "support_tickets"
    
    id = Column(Integer, primary_key=True, index=True)
    client_name = Column(String, nullable=False)
    client_email = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    priority = Column(String, nullable=False)
    status = Column(String, default="New") # 'New', 'Resolved'
    date = Column(String, nullable=False)
    replies = Column(Text, nullable=True) # JSON list serialized to text

class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, nullable=False)
    time = Column(String, nullable=False)
    type = Column(String, nullable=False)

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(String, default="deposit") # "deposit", "payout", "refund"
    status = Column(String, default="Pending") # "Pending", "Released", "Refunded"
    date = Column(String, nullable=False)
    client_name = Column(String, nullable=False)
    vendor_name = Column(String, nullable=False)

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    inquiry_id = Column(Integer, ForeignKey("inquiries.id", ondelete="CASCADE"), nullable=False)
    sender_role = Column(String, nullable=False) # "customer" or "vendor"
    text = Column(Text, nullable=False)
    time = Column(String, nullable=False)

class BlockedDate(Base):
    __tablename__ = "blocked_dates"
    
    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    date = Column(String, nullable=False) # Store as "YYYY-MM-DD"
