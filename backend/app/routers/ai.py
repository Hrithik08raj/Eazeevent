from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
import requests

from app.database import get_db
from app.models import User, CustomerProfile, VendorProfile, AdminSettings, Expense, Guest, ChecklistItem
from app.deps import RoleChecker

router = APIRouter(prefix="/api/ai", tags=["ai"])
customer_guard = RoleChecker(allowed_roles=["customer"])

class ChatRequest(BaseModel):
    message: str
    customer_email: Optional[str] = None

class CaptionRequest(BaseModel):
    prompt: str
    tone: str

# Helper to call GeminiREST API
def call_gemini(api_key: str, system_prompt: str, user_message: str) -> Optional[str]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    full_prompt = f"{system_prompt}\n\nUser Question: {user_message}"
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": full_prompt}
                ]
            }
        ]
    }
    
    try:
        res = requests.post(url, json=payload, headers=headers, timeout=10)
        if res.status_code == 200:
            data = res.json()
            # Extract content from response
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return text.strip()
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
    return None

@router.post("/chat")
def chat_concierge(payload: ChatRequest, db: Session = Depends(get_db)):
    # 1. Fetch settings
    settings = db.query(AdminSettings).first()
    api_key = settings.gemini_api_key if settings else None
    
    # 2. Build vendor directory context
    verified_vendors = db.query(VendorProfile).filter(VendorProfile.status == "Verified").all()
    vendor_context = []
    for v in verified_vendors:
        user = db.query(User).filter(User.id == v.id).first()
        vendor_context.append(
            f"- {v.business_name} ({v.category} in {v.city}). Rating: {v.rating or 5.0}/5. Starting Price: {v.starting_price or 60000} INR. Services: {v.services_offered or ''}"
        )
    vendor_context_str = "\n".join(vendor_context)
    
    # 3. Build customer context if email is provided
    customer_context_str = "User: Anonymous Guest"
    if payload.customer_email:
        cust = db.query(User).filter(User.email == payload.customer_email, User.role == "customer").first()
        if cust and cust.customer_profile:
            p = cust.customer_profile
            rem_budget = p.estimated_budget - p.actual_budget
            checklist = db.query(ChecklistItem).filter(ChecklistItem.customer_id == cust.id).all()
            checklist_str = ", ".join([f"{item.title} ({item.status})" for item in checklist])
            
            customer_context_str = (
                f"User: {cust.name}\n"
                f"- Wedding Date: {p.wedding_date or 'Not set'}\n"
                f"- Estimated Budget: INR {p.estimated_budget:,.2f}\n"
                f"- Remaining Budget: INR {rem_budget:,.2f}\n"
                f"- Current Status: {p.status}\n"
                f"- Checklist Items: {checklist_str or 'None'}"
            )
            
    system_prompt = (
        "You are Eazee AI, the warm, intelligent event concierge for the Eazeevent platform.\n"
        "Your task is to answer user questions about event planning, vendor matchmaking, and platform settings.\n"
        "Always be concise, professional, supportive, and formatted cleanly using markdown (bolding, bullet points).\n\n"
        f"--- CURRENT DATABASE VENDORS ---\n{vendor_context_str}\n\n"
        f"--- CURRENT CUSTOMER PROFILE ---\n{customer_context_str}\n\n"
        "If recommending vendors, prefer recommending verified vendors listed above that match the user's category and city. "
        "Keep responses friendly and under 150 words."
    )
    
    # 4. Try Gemini or Fallback
    if api_key:
        reply = call_gemini(api_key, system_prompt, payload.message)
        if reply:
            return {"reply": reply}
            
    # Local fallback logic
    message_lower = payload.message.lower()
    
    # Identify category
    categories = ["photography", "catering", "venue", "decoration", "lighting", "videography", "makeup"]
    matched_category = next((c for c in categories if c in message_lower), None)
    
    # Identify city
    cities = ["udaipur", "mumbai", "goa", "delhi", "jaipur"]
    matched_city = next((city for city in cities if city in message_lower), None)
    
    if matched_category or matched_city:
        query = db.query(VendorProfile).filter(VendorProfile.status == "Verified")
        if matched_category:
            query = query.filter(VendorProfile.category.ilike(f"%{matched_category}%"))
        if matched_city:
            query = query.filter(VendorProfile.city.ilike(f"%{matched_city}%"))
            
        matches = query.all()
        if matches:
            response_text = f"✨ **Eazee AI concierge search results:**\n\nI found these verified options in our directory matching your inquiry:\n"
            for m in matches:
                price_text = f"starts at ₹{m.starting_price or 60000:,.0f}" if m.starting_price else "pricing on request"
                response_text += f"- **{m.business_name}** ({m.category} in {m.city}) — ⭐ {m.rating or 5.0} | {price_text}\n"
            response_text += "\n*Setup a valid Gemini API Key in Settings to enable natural conversational AI!*"
            return {"reply": response_text}
            
    # Default local reply
    return {
        "reply": (
            "👋 Hello! I am **Eazee AI**, your automated event concierge.\n\n"
            "To enable live, conversational AI reasoning, please enter a valid **Gemini API Key** in the **Admin Settings** tab.\n\n"
            "In the meantime, you can search for local vendors by asking me about specific categories and cities! "
            "For example: *'Show me photographers in Udaipur'* or *'Are there caterers in Delhi?'*"
        )
    }

@router.post("/generate-caption")
def generate_social_caption(payload: CaptionRequest, db: Session = Depends(get_db)):
    settings = db.query(AdminSettings).first()
    api_key = settings.gemini_api_key if settings else None
    
    prompt_desc = payload.prompt or "Beautiful wedding event"
    tone = payload.tone or "Romantic & Elegant"
    
    system_prompt = (
        f"You are a professional social media manager. Generate a high-converting social media caption with a {tone} tone "
        "based on the description provided. Return ONLY the caption text, including relevant emojis and hashtags. Do not wrap in quotes."
    )
    
    if api_key:
        reply = call_gemini(api_key, system_prompt, prompt_desc)
        if reply:
            return {"caption": reply}
            
    # Fallback caption templates
    fallbacks = {
        "Romantic & Elegant": [
            f"✨ Forever starts today. Captured in the beautiful settings: {prompt_desc}. 💕 #WeddingGoals #LumiereFilms #TrueLove",
            f"A love story written in the stars and captured in frames. 💫 {prompt_desc}. #ElegantWeddings #EternalFrames"
        ],
        "Fun & Playful": [
            f"🎉 Less bitter, more glitter! Loving every moment of this: {prompt_desc}. 📸 #EventVibes #GoodTimesOnly #InstaGood",
            f"Making memories we will never forget! 🥳 {prompt_desc}. #PartyVibes #WeddingPhotography"
        ],
        "Professional & Formal": [
            f"💼 Professional coverage of {prompt_desc}. Custom packages available for destination weddings. #EventProduction #CorporateEvents",
            f"Excellence in production. {prompt_desc}. Book your slot with us today. #LumiereFilms #PhotographyService"
        ],
        "Emotional & Heartfelt": [
            f"🥹 Tears of joy, laughter of love. A beautiful highlight of {prompt_desc}. 💛 #HeartfeltMoments #FamilyLove #WeddingDay",
            f"The moments that matter the most. {prompt_desc}. 🤍 #EmotionalTribute #LoveAlways"
        ]
    }
    
    import random
    selected = fallbacks.get(tone, fallbacks["Romantic & Elegant"])
    caption = random.choice(selected)
    return {"caption": caption}

@router.get("/match-vendors")
def get_matched_vendors(current_user: User = Depends(customer_guard), db: Session = Depends(get_db)):
    profile = db.query(CustomerProfile).filter(CustomerProfile.id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")
        
    cust_city = profile.phone.split(" ")[-1] if profile.phone else "" # simple fallback city parsing
    rem_budget = profile.estimated_budget - profile.actual_budget
    
    verified_vendors = db.query(VendorProfile).filter(VendorProfile.status == "Verified").all()
    recommendations = []
    
    for v in verified_vendors:
        score = 80 # base score
        
        # Check if city matches
        if cust_city and cust_city.lower() in v.city.lower():
            score += 12
        elif v.city.lower() in "udaipur": # default Udaipur destination boost
            score += 5
            
        # Check budget constraint (starts under remaining budget)
        vendor_price = v.starting_price or 60000
        if vendor_price <= rem_budget:
            score += 6
        else:
            score -= 10
            
        # Add rating boost
        score += int((v.rating or 5.0) * 0.4)
        
        # Cap score at 99%
        score = min(max(score, 50), 99)
        
        recommendations.append({
            "id": v.id,
            "business_name": v.business_name,
            "category": v.category,
            "city": v.city,
            "rating": v.rating or 5.0,
            "starting_price": vendor_price,
            "match_percentage": score,
            "services": v.services_offered or f"{v.category} specialist in {v.city}",
            "profile_image": v.profile_image or "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800"
        })
        
    # Sort by match percentage
    recommendations.sort(key=lambda x: x["match_percentage"], reverse=True)
    return recommendations[:3] # return top 3
