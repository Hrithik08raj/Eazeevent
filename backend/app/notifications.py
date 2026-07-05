import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

def send_notification_email(to_email: str, subject: str, body: str) -> bool:
    """
    Sends an SMTP email notification.
    If SMTP settings (user/password) are not filled in, it logs the email in console (Local fallback).
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print("\n" + "="*50)
        print("📨 [LOCAL EMAIL NOTIFICATION SIMULATOR]")
        print(f"  To:      {to_email}")
        print(f"  From:    {settings.SMTP_FROM_EMAIL}")
        print(f"  Subject: {subject}")
        print(f"  Content:\n{body}")
        print("="*50 + "\n")
        return True

    try:
        msg = MIMEMultipart()
        msg['From'] = settings.SMTP_FROM_EMAIL
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))
        
        # Connect to SMTP server
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
        server.quit()
        print(f"[SMTP SUCCESS] Email notification sent to {to_email} successfully!")
        return True
    except Exception as e:
        print(f"[SMTP ERROR] Failed to send email to {to_email}: {e}")
        return False
