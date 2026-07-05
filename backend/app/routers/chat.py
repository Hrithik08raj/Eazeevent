from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import datetime
from app.database import get_db
from app.models import User, Inquiry, ChatMessage
from app.schemas import ChatMessageOut, ChatMessageCreate
from app.deps import get_current_user

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.get("/{inquiry_id}", response_model=List[ChatMessageOut])
def get_chat_messages(
    inquiry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify user belongs to this inquiry
    inquiry = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found.")
        
    if current_user.id != inquiry.customer_id and current_user.id != inquiry.vendor_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this chat.")
        
    return db.query(ChatMessage).filter(ChatMessage.inquiry_id == inquiry_id).all()

@router.post("/{inquiry_id}", response_model=ChatMessageOut)
def send_chat_message(
    inquiry_id: int,
    payload: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    inquiry = db.query(Inquiry).filter(Inquiry.id == inquiry_id).first()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found.")
        
    if current_user.id != inquiry.customer_id and current_user.id != inquiry.vendor_id:
        raise HTTPException(status_code=403, detail="Not authorized to send messages here.")
        
    sender_role = "customer" if current_user.role == "customer" else "vendor"
    
    msg = ChatMessage(
        inquiry_id=inquiry_id,
        sender_role=sender_role,
        text=payload.text,
        time=datetime.datetime.now().strftime("%I:%M %p")
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
