import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

from config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL, SMTP_FROM_NAME

logger = logging.getLogger(__name__)


async def send_email(to_email: str, subject: str, html_body: str):
    if not SMTP_HOST or not SMTP_USER or not SMTP_PASSWORD:
        logger.warning(f"[EMAIL MOCK] SMTP not configured. To: {to_email}, Subject: {subject}")
        return False

    msg = MIMEMultipart("alternative")
    msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL or SMTP_USER}>"
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html"))

    try:
        await aiosmtplib.send(
            msg,
            hostname=SMTP_HOST,
            port=SMTP_PORT,
            start_tls=True,
            username=SMTP_USER,
            password=SMTP_PASSWORD,
        )
        logger.info(f"[EMAIL SENT] To: {to_email}, Subject: {subject}")
        return True
    except Exception as e:
        logger.error(f"[EMAIL FAILED] To: {to_email}, Error: {e}")
        return False


def build_reset_password_email(reset_url: str) -> str:
    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f5f5f4; margin: 0; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <div style="background: linear-gradient(135deg, #E2725B, #B5503D); padding: 32px; text-align: center;">
      <h1 style="color: white; font-size: 24px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">MarocSphere</h1>
    </div>
    <div style="padding: 32px;">
      <h2 style="color: #1e293b; font-size: 20px; margin: 0 0 12px;">Reset Your Password</h2>
      <p style="color: #57534e; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        We received a request to reset your password. Click the button below to create a new password. This link expires in 1 hour.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="{reset_url}" style="display: inline-block; background: linear-gradient(135deg, #E2725B, #B5503D); color: white; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px;">
          Reset Password
        </a>
      </div>
      <p style="color: #a8a29e; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
        If you didn't request this, you can safely ignore this email. Your password will not change.
      </p>
      <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 24px 0;" />
      <p style="color: #a8a29e; font-size: 12px; text-align: center; margin: 0;">
        This link can also be pasted in your browser:<br>
        <span style="color: #78716c; word-break: break-all;">{reset_url}</span>
      </p>
    </div>
    <div style="background: #fafaf9; padding: 20px; text-align: center; border-top: 1px solid #e7e5e4;">
      <p style="color: #a8a29e; font-size: 12px; margin: 0;">
        MarocSphere — AI-Powered Morocco Travel<br>
        <a href="https://marocsphere.com" style="color: #E2725B; text-decoration: none;">marocsphere.com</a>
      </p>
    </div>
  </div>
</body>
</html>"""
