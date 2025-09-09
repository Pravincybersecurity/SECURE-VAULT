from sqlalchemy import Column, Integer, String, LargeBinary, ForeignKey, TIMESTAMP, func, Boolean, DateTime
from sqlalchemy.orm import declarative_base

Base = declarative_base()



class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    # --- MODIFICATION: Removed the redundant 'salt' column ---
    # salt = Column(String(255), nullable=False) 
    role = Column(String(50), nullable=False, default="user")
    is_locked = Column(Boolean, default=False)
    lock_until = Column(DateTime, nullable=True)
    failed_attempts = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, server_default=func.now())

class PasswordResetOTP(Base):
    __tablename__ = "password_reset_otps"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False, index=True)
    otp_code = Column(String(6), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    expires_at = Column(DateTime, nullable=False, index=True)
    is_used = Column(Boolean, default=False)

class LoginAttempt(Base):
    __tablename__ = "login_attempts"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), nullable=True, index=True)
    ip_address = Column(String(45), nullable=False, index=True)
    attempt_time = Column(TIMESTAMP, server_default=func.now(), index=True)
    successful = Column(Boolean, default=False)
    user_agent = Column(String(255), nullable=True)


class BasicIdentifiers(Base):
    __tablename__ = "basic_identifiers"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    fullname = Column(LargeBinary, nullable=True)
    dob = Column(LargeBinary, nullable=True)
    phone = Column(LargeBinary, nullable=True)
    email = Column(LargeBinary, nullable=True)
    address = Column(LargeBinary, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

class GovernmentIdentifiers(Base):
    __tablename__ = "government_identifiers"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    adhar = Column(LargeBinary, nullable=True)
    passport = Column(LargeBinary, nullable=True)
    pan = Column(LargeBinary, nullable=True)
    license = Column(LargeBinary, nullable=True)
    smartcard = Column(LargeBinary, nullable=True)
    professionallicence = Column(LargeBinary, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

class FinancialInfo(Base):
    __tablename__ = "financial_info"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    accnum = Column(LargeBinary, nullable=True)
    creditnum = Column(LargeBinary, nullable=True)
    cvv = Column(LargeBinary, nullable=True)
    tax = Column(LargeBinary, nullable=True)
    pension = Column(LargeBinary, nullable=True)
    tradingacc = Column(LargeBinary, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

class EmploymentEducation(Base):
    __tablename__ = "employment_education"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    empid = Column(LargeBinary, nullable=True)
    workemail = Column(LargeBinary, nullable=True)
    emis = Column(LargeBinary, nullable=True)
    umis = Column(LargeBinary, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

class HealthInsurance(Base):
    __tablename__ = "health_insurance"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    health_insurance = Column(LargeBinary, nullable=True)
    patientid = Column(LargeBinary, nullable=True)
    disability_certificate = Column(LargeBinary, nullable=True)
    emergency_contact = Column(LargeBinary, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
