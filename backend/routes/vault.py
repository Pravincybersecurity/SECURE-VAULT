from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from collections import defaultdict
import os
import re

from backup_script import create_database_backup
from db.session import get_key_db, get_pii_db
from db.key_db import FieldKey
from db.pii_db import User, BasicIdentifiers, GovernmentIdentifiers, FinancialInfo, EmploymentEducation, HealthInsurance
from services.crypto_service import generate_dek, encrypt_value, decrypt_value
from services.classification import sensitivity_map
from utils.key_management import wrap_dek_with_kms, unwrap_dek_with_kms
from utils.logger import log_pii_action
from utils.validation import validate_and_sanitize
from routes.auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

# --- Define the canonical order for display ---
CANONICAL_CATEGORY_ORDER = [
    "Basic Identifiers", "Government Identifiers", "Financial Info",
    "Employment Education", "Health Insurance"
]

CANONICAL_FIELD_ORDER = {
    "Basic Identifiers": ["fullname", "dob", "phone", "email", "address"],
    "Government Identifiers": ["adhar", "passport", "pan", "license", "smartcard", "professionallicence"],
    "Financial Info": ["accnum", "creditnum", "cvv", "tax", "pension", "tradingacc"],
    "Employment Education": ["empid", "workemail", "emis", "umis"],
    "Health Insurance": ["health_insurance", "patientid", "disability_certificate", "emergency_contact"]
}

def overwrite(buf: bytearray):
    """Securely zero out a mutable bytearray."""
    for i in range(len(buf)):
        buf[i] = 0

class EncryptRequest(BaseModel):
    category: str
    field_name: str
    value: str

class DecryptRequest(BaseModel):
    category: str
    field_name: str

class UpdateFieldRequest(BaseModel):
    category: str
    field_name: str
    new_value: str

class DeleteFieldRequest(BaseModel):
    category: str
    field_name: str
    
CATEGORY_MODEL_MAP = {
    "Basic Identifiers": BasicIdentifiers, "Government Identifiers": GovernmentIdentifiers,
    "Financial Info": FinancialInfo, "Employment Education": EmploymentEducation,
    "Health Insurance": HealthInsurance,
}

def normalize_pii_value(field_name: str, value: str) -> str:
    clean_value = value.strip()
    if field_name == "phone":
        digits = re.sub(r'[\s-]', '', clean_value)
        if digits.startswith('+'): return f"+{digits[1:3]}-{digits[3:]}"
        elif len(digits) == 10: return f"+91-{digits}"
        return clean_value
    elif field_name == "adhar":
        digits = re.sub(r'[\s-]', '', clean_value)
        if len(digits) == 12: return f"{digits[0:4]}-{digits[4:8]}-{digits[8:12]}"
        return clean_value
    elif field_name == "creditnum":
        digits = re.sub(r'[\s-]', '', clean_value)
        if len(digits) == 16: return f"{digits[0:4]}-{digits[4:8]}-{digits[8:12]}-{digits[12:16]}"
        return clean_value
    elif field_name == "pan":
        return clean_value.upper()
    return clean_value

@router.get("/")
async def get_vault_contents(
    key_db: Session = Depends(get_key_db), pii_db: Session = Depends(get_pii_db),
    current_user: User = Depends(get_current_user)
):
    user_keys = key_db.query(FieldKey).filter(FieldKey.user_id == current_user.id).all()
    if not user_keys: return []
    
    grouped_by_category = defaultdict(list)
    for key in user_keys: grouped_by_category[key.category].append(key.field_name)

    all_records = []
    for category_name, fields in grouped_by_category.items():
        PiiModel = CATEGORY_MODEL_MAP.get(category_name)
        if not PiiModel: continue
        pii_record_tuple = pii_db.query(PiiModel.created_at).filter(PiiModel.user_id == current_user.id).first()
        
        field_order_map = {field: i for i, field in enumerate(CANONICAL_FIELD_ORDER.get(category_name, []))}
        sorted_fields = sorted(fields, key=lambda f: field_order_map.get(f, float('inf')))

        all_records.append({
            "id": category_name, "name": f"User {current_user.id} {category_name}",
            "type": category_name, "dateAdded": pii_record_tuple[0].strftime("%Y-%m-%d") if pii_record_tuple else "N/A",
            "status": "encrypted", "fields": sorted_fields,
        })
    
    category_order_map = {category: i for i, category in enumerate(CANONICAL_CATEGORY_ORDER)}
    sorted_all_records = sorted(all_records, key=lambda r: category_order_map.get(r['type'], float('inf')))
    
    return sorted_all_records

@router.post("/decrypt")
async def decrypt_data(
    req: DecryptRequest, key_db: Session = Depends(get_key_db),
    pii_db: Session = Depends(get_pii_db), current_user: User = Depends(get_current_user)
):
    key_record = key_db.query(FieldKey).filter(FieldKey.user_id == current_user.id, FieldKey.field_name == req.field_name).first()
    if not key_record: raise HTTPException(status_code=404, detail="Key not found.")
    PiiModel = CATEGORY_MODEL_MAP.get(req.category)
    if not PiiModel: raise HTTPException(status_code=400, detail="Invalid category.")
    pii_record = pii_db.query(PiiModel).filter(PiiModel.user_id == current_user.id).first()
    if not pii_record: raise HTTPException(status_code=404, detail="PII record not found.")
    ciphertext = getattr(pii_record, req.field_name, None)
    if ciphertext is None: raise HTTPException(status_code=404, detail="Field has no data.")
    dek_buffer = None
    try:
        dek_bytes = unwrap_dek_with_kms(key_record.wrapped_dek)
        dek_buffer = bytearray(dek_bytes)
        plaintext = decrypt_value(ciphertext, key_record.iv, key_record.auth_tag, dek_buffer)
        return {"plaintext": plaintext}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Decryption failed: {e}")
    finally:
        if dek_buffer:
            overwrite(dek_buffer)
            del dek_buffer

@router.post("/encrypt")
async def encrypt_data(
    req: EncryptRequest, key_db: Session = Depends(get_key_db),
    pii_db: Session = Depends(get_pii_db), current_user: User = Depends(get_current_user)
):
    existing_field = key_db.query(FieldKey).filter(
        FieldKey.user_id == current_user.id, FieldKey.field_name == req.field_name
    ).first()
    if existing_field:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"The field '{req.field_name}' already exists.")
    
    is_valid, sanitized_value = validate_and_sanitize(req.field_name, req.value)
    if not is_valid: raise HTTPException(status_code=422, detail=f"Invalid format for '{req.field_name}'.")
    
    normalized_value = normalize_pii_value(req.field_name, sanitized_value)
    sensitivity = sensitivity_map.get(req.field_name)
    if not sensitivity: raise HTTPException(status_code=400, detail="Unknown field for classification")

    dek_buffer, wrapped_dek = None, None
    try:
        if sensitivity == 'high':
            dek_buffer = bytearray(generate_dek())
            wrapped_dek = wrap_dek_with_kms(dek_buffer)
        elif sensitivity == 'medium':
            existing_key = key_db.query(FieldKey).filter_by(user_id=current_user.id, category=req.category, sensitivity='medium').first()
            if existing_key:
                wrapped_dek = existing_key.wrapped_dek
                dek_bytes = unwrap_dek_with_kms(wrapped_dek)
                dek_buffer = bytearray(dek_bytes)
            else:
                dek_buffer = bytearray(generate_dek())
                wrapped_dek = wrap_dek_with_kms(dek_buffer)
        
        if not dek_buffer or not wrapped_dek: raise ValueError("DEK generation or wrapping failed.")
        ciphertext, iv, auth_tag = encrypt_value(normalized_value, dek_buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Key management or encryption failed: {e}")
    finally:
        if dek_buffer: overwrite(dek_buffer)

    key_db.add(FieldKey(user_id=current_user.id, category=req.category, field_name=req.field_name, sensitivity=sensitivity, wrapped_dek=wrapped_dek, iv=iv, auth_tag=auth_tag, key_salt=os.urandom(16)))
    key_db.commit()

    PiiModel = CATEGORY_MODEL_MAP.get(req.category)
    user_record = pii_db.query(PiiModel).filter(PiiModel.user_id == current_user.id).first()
    if user_record:
        setattr(user_record, req.field_name, ciphertext)
    else:
        pii_db.add(PiiModel(**{"user_id": current_user.id, req.field_name: ciphertext}))
    pii_db.commit()

    create_database_backup()
    log_pii_action(current_user.id, current_user.name, req.category, req.field_name, sensitivity, "encrypted")
    return {"status": "success", "message": f"{req.field_name} encrypted successfully"}

@router.put("/field")
async def update_field(
    req: UpdateFieldRequest, key_db: Session = Depends(get_key_db),
    pii_db: Session = Depends(get_pii_db), current_user: User = Depends(get_current_user)
):
    is_valid, sanitized_value = validate_and_sanitize(req.field_name, req.new_value)
    if not is_valid: raise HTTPException(status_code=422, detail=f"Invalid format for '{req.field_name}'.")
    
    normalized_value = normalize_pii_value(req.field_name, sanitized_value)
    key_record = key_db.query(FieldKey).filter(FieldKey.user_id == current_user.id, FieldKey.field_name == req.field_name).first()
    if not key_record: raise HTTPException(status_code=404, detail="Key not found.")

    dek_buffer = None
    try:
        dek_bytes = unwrap_dek_with_kms(key_record.wrapped_dek)
        dek_buffer = bytearray(dek_bytes)
        new_ciphertext, new_iv, new_auth_tag = encrypt_value(normalized_value, dek_buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Encryption failed: {e}")
    finally:
        if dek_buffer: overwrite(dek_buffer)

    PiiModel = CATEGORY_MODEL_MAP.get(req.category)
    pii_record = pii_db.query(PiiModel).filter(PiiModel.user_id == current_user.id).first()
    if not pii_record: raise HTTPException(status_code=404, detail="PII record not found.")
    
    setattr(pii_record, req.field_name, new_ciphertext)
    pii_db.commit()

    key_record.iv, key_record.auth_tag = new_iv, new_auth_tag
    key_db.commit()

    create_database_backup()
    log_pii_action(current_user.id, current_user.name, req.category, req.field_name, key_record.sensitivity, "updated")
    return {"status": "success", "message": f"{req.field_name} updated successfully."}

@router.delete("/field")
async def delete_field(
    req: DeleteFieldRequest, key_db: Session = Depends(get_key_db),
    pii_db: Session = Depends(get_pii_db), current_user: User = Depends(get_current_user)
):
    key_record = key_db.query(FieldKey).filter(FieldKey.user_id == current_user.id, FieldKey.field_name == req.field_name).first()
    if not key_record: raise HTTPException(status_code=404, detail="Field not found.")
    
    sensitivity = key_record.sensitivity
    key_db.delete(key_record)
    key_db.commit()
    
    PiiModel = CATEGORY_MODEL_MAP.get(req.category)
    pii_record = pii_db.query(PiiModel).filter(PiiModel.user_id == current_user.id).first()
    if pii_record:
        setattr(pii_record, req.field_name, None)
        pii_db.commit()
    
    create_database_backup()
    log_pii_action(current_user.id, current_user.name, req.category, req.field_name, sensitivity, "deleted_field")
    return {"status": "success", "message": f"{req.field_name} deleted."}

@router.delete("/category/{category_name}")
async def delete_category(
    category_name: str, key_db: Session = Depends(get_key_db),
    pii_db: Session = Depends(get_pii_db), current_user: User = Depends(get_current_user)
):
    deleted_count = key_db.query(FieldKey).filter(FieldKey.user_id == current_user.id, FieldKey.category == category_name).delete()
    if deleted_count == 0: raise HTTPException(status_code=404, detail="No records found in this category.")
    key_db.commit()

    PiiModel = CATEGORY_MODEL_MAP.get(category_name)
    if PiiModel:
        pii_record = pii_db.query(PiiModel).filter(PiiModel.user_id == current_user.id).first()
        if pii_record:
            pii_db.delete(pii_record)
            pii_db.commit()

    create_database_backup()
    log_pii_action(current_user.id, current_user.name, category_name, "ALL_FIELDS", "N/A", "deleted_category")
    return {"status": "success", "message": f"Category '{category_name}' deleted."}