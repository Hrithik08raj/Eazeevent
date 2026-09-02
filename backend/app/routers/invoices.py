from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
import io
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from app.database import get_db
from app.models import User, CustomerProfile, VendorProfile, Booking, AdminSettings
from app.deps import get_current_user

router = APIRouter(prefix="/api/invoices", tags=["invoices"])

@router.get("/booking/{booking_id}")
def generate_booking_invoice(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Fetch booking record
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Booking record not found."
        )

    # 2. Ownership verification (must belong to customer, vendor, or admin)
    if booking.customer_id != current_user.id and booking.vendor_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this invoice."
        )

    # 3. Fetch related customer, vendor, and platform settings
    customer_user = db.query(User).filter(User.id == booking.customer_id).first()
    customer_profile = db.query(CustomerProfile).filter(CustomerProfile.id == booking.customer_id).first()
    vendor_user = db.query(User).filter(User.id == booking.vendor_id).first()
    vendor_profile = db.query(VendorProfile).filter(VendorProfile.id == booking.vendor_id).first()
    settings = db.query(AdminSettings).first()

    # 4. Resolve branding and identity attributes
    platform_name = settings.platform_name if settings and settings.platform_name else "Eazeevent"
    support_email = settings.support_email if settings and settings.support_email else "support@eazeevent.com"
    currency_symbol = settings.currency_symbol if settings and settings.currency_symbol else "₹"
    currency_text = "INR" if currency_symbol == "₹" else currency_symbol

    customer_name = customer_user.name if customer_user else "Valued Client"
    customer_email = customer_user.email if customer_user else "N/A"
    customer_phone = customer_profile.phone if customer_profile and customer_profile.phone else "N/A"

    vendor_business = vendor_profile.business_name if vendor_profile else (vendor_user.name if vendor_user else "Vendor Partner")
    vendor_cat = vendor_profile.category if vendor_profile else "Specialist Service"
    vendor_city = vendor_profile.city if vendor_profile else "India"
    location_str = booking.location or vendor_city

    total_amount = float(booking.amount or 0.0)
    paid_amount = float(booking.paid_amount or 0.0)
    balance_due = max(0.0, total_amount - paid_amount)

    if paid_amount >= total_amount and total_amount > 0:
        payment_status_badge = '<font color="#059669"><b>FULLY PAID</b></font>'
    elif paid_amount > 0:
        payment_status_badge = '<font color="#d97706"><b>PARTIALLY PAID</b></font>'
    else:
        payment_status_badge = '<font color="#dc2626"><b>PAYMENT PENDING</b></font>'

    issue_date = datetime.date.today().strftime("%b %d, %Y")

    # 5. Build PDF Document with ReportLab
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        pdf_buffer, 
        pagesize=letter, 
        rightMargin=36, 
        leftMargin=36, 
        topMargin=36, 
        bottomMargin=36
    )
    styles = getSampleStyleSheet()

    primary_color = colors.HexColor('#004c4c')
    text_dark = colors.HexColor('#101818')
    muted_color = colors.HexColor('#5e8d8d')
    light_bg = colors.HexColor('#f0f5f5')
    border_color = colors.HexColor('#e0e8e8')

    brand_style = ParagraphStyle(
        'BrandTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=primary_color
    )

    right_header_style = ParagraphStyle(
        'RightHeader',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        alignment=2,
        textColor=text_dark
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=primary_color
    )

    body_text = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=text_dark
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.white
    )

    story = []

    # --- Header: Brand & Invoice Title ---
    header_data = [
        [
            Paragraph(f"<b>{platform_name}</b><br/><font size=9 color='#5e8d8d'>{support_email}</font>", brand_style),
            Paragraph(
                f"<font size=16 color='#004c4c'><b>BOOKING INVOICE & RECEIPT</b></font><br/>"
                f"<font color='#5e8d8d'>Invoice Ref:</font> <b>INV-{booking.id:05d}</b><br/>"
                f"<font color='#5e8d8d'>Issue Date:</font> {issue_date}<br/>"
                f"<font color='#5e8d8d'>Booking Status:</font> <b>{booking.status}</b>",
                right_header_style
            )
        ]
    ]
    header_table = Table(header_data, colWidths=[270, 270])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(header_table)
    story.append(HRFlowable(width="100%", thickness=2, color=primary_color, spaceAfter=14))

    # --- Parties Summary (Customer & Vendor) ---
    parties_data = [
        [
            Paragraph("<b>BILLED TO (CUSTOMER):</b>", section_heading),
            Paragraph("<b>SERVICE PROVIDER (VENDOR):</b>", section_heading)
        ],
        [
            Paragraph(
                f"<b>Client Name:</b> {customer_name}<br/>"
                f"<b>Email:</b> {customer_email}<br/>"
                f"<b>Phone:</b> {customer_phone}",
                body_text
            ),
            Paragraph(
                f"<b>Business:</b> {vendor_business}<br/>"
                f"<b>Category:</b> {vendor_cat}<br/>"
                f"<b>City/Base:</b> {vendor_city}",
                body_text
            )
        ]
    ]
    parties_table = Table(parties_data, colWidths=[270, 270])
    parties_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BACKGROUND', (0, 0), (-1, -1), light_bg),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('BOX', (0, 0), (-1, -1), 1, border_color),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, border_color),
    ]))
    story.append(parties_table)
    story.append(Spacer(1, 14))

    # --- Booking Services Table ---
    services_data = [
        [
            Paragraph("<b>Package / Service Details</b>", table_header),
            Paragraph("<b>Event Date</b>", table_header),
            Paragraph("<b>Location</b>", table_header),
            Paragraph("<b>Payment Status</b>", table_header),
            Paragraph("<b>Amount</b>", table_header)
        ],
        [
            Paragraph(f"<b>{booking.package_name}</b><br/><font size=8 color='#5e8d8d'>{vendor_cat} Services provided by {vendor_business}</font>", body_text),
            Paragraph(str(booking.date), body_text),
            Paragraph(location_str, body_text),
            Paragraph(payment_status_badge, body_text),
            Paragraph(f"<b>{currency_text} {total_amount:,.2f}</b>", body_text)
        ]
    ]
    services_table = Table(services_data, colWidths=[180, 80, 100, 90, 90])
    services_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), primary_color),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 7),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
    ]))
    story.append(services_table)
    story.append(Spacer(1, 10))

    # --- Financial Summary Breakdown Table ---
    summary_data = [
        ["", "", "Total Booking Amount:", f"{currency_text} {total_amount:,.2f}"],
        ["", "", "Total Amount Paid:", f"{currency_text} {paid_amount:,.2f}"],
        ["", "", "Outstanding Balance Due:", f"{currency_text} {balance_due:,.2f}"]
    ]
    summary_table = Table(summary_data, colWidths=[180, 80, 150, 130])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTNAME', (3, 0), (3, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (2, 0), (3, 0), text_dark),
        ('TEXTCOLOR', (2, 1), (3, 1), colors.HexColor('#059669')),
        ('TEXTCOLOR', (2, 2), (3, 2), primary_color),
        ('FONTSIZE', (2, 0), (-1, -1), 9),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('LINEABOVE', (2, 0), (3, 0), 1, primary_color),
        ('LINEBELOW', (2, -1), (3, -1), 1.5, primary_color),
    ]))
    story.append(summary_table)

    # --- Footer & Legal Notice ---
    story.append(Spacer(1, 28))
    story.append(HRFlowable(width="100%", thickness=0.5, color=muted_color, spaceAfter=8))
    footer_style = ParagraphStyle('InvoiceFooter', parent=styles['Normal'], alignment=1, fontSize=8, leading=11, textColor=muted_color)
    story.append(Paragraph(
        f"Thank you for planning with {platform_name}! This is an official digital booking receipt.<br/>"
        f"For any inquiries or dispute resolution, contact our support desk at {support_email}.",
        footer_style
    ))

    # 6. Render PDF
    doc.build(story)
    pdf_bytes = pdf_buffer.getvalue()
    pdf_buffer.close()

    filename = f"invoice_booking_{booking.id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
