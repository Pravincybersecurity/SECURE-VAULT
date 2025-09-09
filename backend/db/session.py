import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from urllib.parse import quote_plus
from .pii_db import Base as PiiBase
from .key_db import Base as KeyBase
from dotenv import load_dotenv

load_dotenv()

MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "password")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")

# 2. URL-encode the password to handle special characters safely
encoded_password = quote_plus(MYSQL_PASSWORD)


PII_DB_NAME = "pii_db"
KEY_DB_NAME = "key_storage_db"

# 3. Use the encoded_password in the connection URL
PII_DB_URL = f"mysql+pymysql://{MYSQL_USER}:{encoded_password}@{MYSQL_HOST}:{MYSQL_PORT}/{PII_DB_NAME}"
KEY_DB_URL = f"mysql+pymysql://{MYSQL_USER}:{encoded_password}@{MYSQL_HOST}:{MYSQL_PORT}/{KEY_DB_NAME}"

pii_engine = create_engine(PII_DB_URL)
key_engine = create_engine(KEY_DB_URL)

PiiSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=pii_engine)
KeySessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=key_engine)

def init_db():
    print("Initializing MySQL tables...")
    PiiBase.metadata.create_all(bind=pii_engine)
    KeyBase.metadata.create_all(bind=key_engine)
    print("Tables initialized.")

def get_pii_db():
    db = PiiSessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_key_db():
    db = KeySessionLocal()
    try:
        yield db
    finally:
        db.close()