from fastapi import APIRouter, Depends, HTTPException, status, Form, Request, BackgroundTasks, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, validator
from sqlalchemy.orm import Session
from passlib.hash import bcrypt
from jose import jwt, JWTError
from datetime import datetime, timedelta
import re
import os
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
from typing import Optional
import bleach
from slowapi import Limiter
from slowapi.util import get_remote_address
from utils.logger import logger
from db.session import get_pii_db
from db.pii_db import User, PasswordResetOTP, LoginAttempt

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# --- Configuration ---
SECRET_KEY = os.getenv("SECRET_KEY", "a_very_secret_key_for_development_12345")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
MAX_LOGIN_ATTEMPTS = 5
LOCKOUT_TIME_MINUTES = 15
IP_MAX_ATTEMPTS = 10
IP_LOCKOUT_MINUTES = 30
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
COMPANY_NAME = os.getenv("COMPANY_NAME", "SecureVault")
RECAPTCHA_SECRET_KEY = os.getenv("RECAPTCHA_SECRET_KEY")
RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"

# --- Schemas ---
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

    @validator("name", "email")
    def sanitize_inputs(cls, v):
        return bleach.clean(v, strip=True)

    @validator("password")
    def password_strong(cls, v):
        errors = []
        if len(v) < 8: errors.append("at least 8 characters")
        if not re.search(r"[A-Z]", v): errors.append("one uppercase letter")
        if not re.search(r"[a-z]", v): errors.append("one lowercase letter")
        if not re.search(r"[0-9]", v): errors.append("one number")
        if not re.search(r"[!@#$%^&*]", v): errors.append("one special character")
        if errors:
            raise ValueError(f"Password must contain {', '.join(errors)}.")
        return v

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None # <-- ADDED role to token data

# --- Helper Functions ---
def get_client_ip(request: Request): return request.client.host if request.client else "unknown"

def verify_recaptcha(token: str):
    if not RECAPTCHA_SECRET_KEY:
        print("WARN: RECAPTCHA_SECRET_KEY not set. Skipping verification.")
        return True
    try:
        response = requests.post(RECAPTCHA_VERIFY_URL, data={"secret": RECAPTCHA_SECRET_KEY, "response": token})
        return response.json().get("success", False)
    except Exception:
        return False

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    # The role is now expected to be in the data dictionary
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_password(plain_password, hashed_password):
    return bcrypt.verify(plain_password, hashed_password)

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_pii_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role") # <-- DECODE role from token
        if email is None: raise credentials_exception
        token_data = TokenData(email=email, role=role)
    except JWTError:
        raise credentials_exception
    user = get_user_by_email(db, email=token_data.email)
    if user is None: raise credentials_exception
    return user

def send_email_fully_formatted(recipient: str, subject: str, body: str):
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        print("WARN: SMTP_USERNAME or SMTP_PASSWORD not set. Skipping email.")
        return False
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = f"{COMPANY_NAME} <{SMTP_USERNAME}>"
        msg['To'] = recipient
        msg['Subject'] = subject
        msg.attach(MIMEText(re.sub('<[^<]+?>', '', body), 'plain'))
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) if SMTP_PORT == 465 else smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        if SMTP_PORT != 465: server.starttls()
            
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def check_and_handle_lockout(db: Session, email: str, ip_address: str):
    user = get_user_by_email(db, email)
    if user and user.is_locked and user.lock_until and user.lock_until > datetime.utcnow():
        raise HTTPException(status_code=429, detail="Account locked.")
    
    ip_failures = db.query(LoginAttempt).filter(
        LoginAttempt.ip_address == ip_address, LoginAttempt.successful == False, 
        LoginAttempt.attempt_time > datetime.utcnow() - timedelta(minutes=IP_LOCKOUT_MINUTES)
    ).count()
    if ip_failures >= IP_MAX_ATTEMPTS:
        raise HTTPException(status_code=429, detail="Too many failed login attempts from this IP.")

def record_login_attempt(db: Session, email: str, ip: str, success: bool):
    # --- NEW: JSON Logging for ELK Stack ---
    log_status = "success" if success else "failure"
    log_message = f"User login attempt: {log_status}"

    extra_log_data = {
        "event": "user_login",
        "status": log_status,
        "username": email,
        "ip": ip,
    }

    # Log failures as warnings and successes as info
    if success:
        logger.info(log_message, extra={'extra_data': extra_log_data})
    else:
        logger.warning(log_message, extra={'extra_data': extra_log_data})
    # --- END: JSON Logging ---

    # The rest of the function remains the same (database logic)
    db.add(LoginAttempt(username=email, ip_address=ip, successful=success))
    user = get_user_by_email(db, email)
    if user:
        if success:
            user.failed_attempts = 0
            user.is_locked = False
            user.lock_until = None
        else:
            user.failed_attempts = (user.failed_attempts or 0) + 1
            if user.failed_attempts >= MAX_LOGIN_ATTEMPTS:
                user.is_locked = True
                user.lock_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_TIME_MINUTES)
    db.commit()

# --- Endpoints ---
@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("10/hour")
def register(request: Request, name: str = Form(...), email: str = Form(...), password: str = Form(...), recaptcha_token: str = Form(...), db: Session = Depends(get_pii_db)):
    if not verify_recaptcha(recaptcha_token):
        raise HTTPException(status_code=400, detail="Invalid reCAPTCHA.")
    try:
        user_data = UserCreate(name=name, email=email, password=password)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    if get_user_by_email(db, email=user_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Note: We removed the manual 'salt' creation here.
    new_user = User(name=user_data.name, email=user_data.email, hashed_password=bcrypt.hash(user_data.password))
    db.add(new_user)
    db.commit()
    return {"message": "User registered successfully"}

@router.post("/login", response_model=Token)
@limiter.limit("20/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_pii_db)):
    client_ip = get_client_ip(request)
    recaptcha_token = request.headers.get("X-Recaptcha-Token")
    if not recaptcha_token or not verify_recaptcha(recaptcha_token):
       raise HTTPException(status_code=400, detail="Invalid or missing reCAPTCHA token.")
    
    sanitized_username = bleach.clean(form_data.username, strip=True)
    check_and_handle_lockout(db, sanitized_username, client_ip)
    user = get_user_by_email(db, email=sanitized_username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        record_login_attempt(db, sanitized_username, client_ip, success=False)
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    record_login_attempt(db, sanitized_username, client_ip, success=True)
    # --- MODIFICATION: Added user's name and role to the token payload ---
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id, "name": user.name, "role": user.role}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/forgot-password")
@limiter.limit("5/hour")
async def forgot_password(request: Request, background_tasks: BackgroundTasks, email: str = Form(...), db: Session = Depends(get_pii_db)):
    sanitized_email = bleach.clean(email, strip=True)
    user = get_user_by_email(db, sanitized_email)
    if user:
        otp = "".join(random.choices(string.digits, k=6))
        expires_at = datetime.utcnow() + timedelta(minutes=10)
        db.add(PasswordResetOTP(email=sanitized_email, otp_code=otp, expires_at=expires_at))
        db.commit()
        email_body = f"""<div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px; margin: auto;"><h2 style="color: #333;">Password Reset Code</h2><p style="color: #555;">Your password reset code is:</p><p style="font-size: 28px; font-weight: bold; letter-spacing: 5px; background: #f0f0f0; padding: 15px 20px; border-radius: 5px; display: inline-block; margin: 20px 0;">{otp}</p><p style="color: #777; font-size: 14px;">This code expires in 10 minutes. If you did not request this, please ignore this email.</p></div>"""
        background_tasks.add_task(send_email_fully_formatted, sanitized_email, f"{COMPANY_NAME} Password Reset", email_body)
    return {"message": "If an account with that email exists, a password reset OTP has been sent."}

@router.post("/verify-otp")
@limiter.limit("10/minute")
async def verify_otp(request: Request, email: str = Form(...), otp: str = Form(...), db: Session = Depends(get_pii_db)):
    sanitized_email = bleach.clean(email, strip=True)
    sanitized_otp = bleach.clean(otp, strip=True)
    otp_record = db.query(PasswordResetOTP).filter(PasswordResetOTP.email == sanitized_email, PasswordResetOTP.otp_code == sanitized_otp, PasswordResetOTP.expires_at > datetime.utcnow(), PasswordResetOTP.is_used == False).first()
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")
    return {"message": "OTP verified successfully."}

@router.post("/reset-password")
@limiter.limit("5/hour")
async def reset_password(request: Request, email: str = Form(...), otp: str = Form(...), new_password: str = Form(...), db: Session = Depends(get_pii_db)):
    sanitized_email = bleach.clean(email, strip=True)
    sanitized_otp = bleach.clean(otp, strip=True)
    otp_record = db.query(PasswordResetOTP).filter(PasswordResetOTP.email == sanitized_email, PasswordResetOTP.otp_code == sanitized_otp, PasswordResetOTP.expires_at > datetime.utcnow(), PasswordResetOTP.is_used == False).first()
    if not otp_record: raise HTTPException(status_code=400, detail="Invalid or expired OTP.")
    try:
        UserCreate(name="dummy_user", email="dummy@email.com", password=new_password)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {e}")

    user = get_user_by_email(db, sanitized_email)
    if not user: raise HTTPException(status_code=404, detail="User not found.")
    
    user.hashed_password = bcrypt.hash(new_password)
    otp_record.is_used = True
    db.commit()
    return {"message": "Password has been reset successfully."}

# --- NEW: Dependency to check for Admin Role ---
def get_current_admin_user(current_user: User = Depends(get_current_user)):
    """
    Dependency that checks if the current user is an admin.
    Raises a 403 Forbidden error if not.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have the necessary privileges"
        )
    return current_user

