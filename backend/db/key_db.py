from sqlalchemy import Column, Integer, String, Enum, LargeBinary, ForeignKey
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class FieldKey(Base):
    __tablename__ = "field_keys"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    category = Column(String(100), nullable=False)
    field_name = Column(String(100), nullable=False)
    sensitivity = Column(Enum("medium", "high"), nullable=False)
    wrapped_dek = Column(LargeBinary, nullable=False)
    iv = Column(LargeBinary, nullable=False)
    auth_tag = Column(LargeBinary, nullable=False)
    key_salt = Column(LargeBinary, nullable=False)
