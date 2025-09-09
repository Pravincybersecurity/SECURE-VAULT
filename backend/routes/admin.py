from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from db.session import get_pii_db, get_key_db
from db.pii_db import User
from db.key_db import FieldKey
from routes.auth import get_current_admin_user # Use the admin-specific dependency

router = APIRouter()

def mask_email(email: str) -> str:
    """Masks an email address securely."""
    try:
        local_part, domain = email.split('@')
        masked_local = f"{local_part[0]}***{local_part[-1]}" if len(local_part) > 2 else f"{local_part[0]}***"
        return f"{masked_local}@{domain}"
    except:
        return "m***@e***.com"

@router.get("/users-data", response_model=List[Dict[str, Any]])
def get_all_users_data(
    db: Session = Depends(get_pii_db),
    key_db: Session = Depends(get_key_db),
    current_admin: User = Depends(get_current_admin_user)
):
    all_users = db.query(User).all()
    response_data = []

    for user in all_users:
        all_keys = key_db.query(FieldKey).filter(FieldKey.user_id == user.id).all()
        
        records_by_category = {}
        for key in all_keys:
            if key.category not in records_by_category:
                records_by_category[key.category] = {
                    "type": key.category,
                    "fields": [],
                    "maskedData": {}
                }
            records_by_category[key.category]["fields"].append(key.field_name)
            records_by_category[key.category]["maskedData"][key.field_name] = "********"

        user_data = {
            "id": user.id,
            "username": user.name,
            "email": mask_email(user.email),
            "joinDate": user.created_at.isoformat(),
            "recordsCount": len(all_keys),
            "lastActive": user.created_at.isoformat(),
            "status": "active",
            "records": list(records_by_category.values())
        }
        response_data.append(user_data)

    return response_data

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_pii_db),
    current_admin: User = Depends(get_current_admin_user)
):
    user_to_delete = db.query(User).filter(User.id == user_id).first()
    
    if not user_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # --- NEW SECURITY CHECKS ---
    # 1. Prevent an admin from deleting themselves
    if user_to_delete.id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrators cannot delete their own accounts."
        )

    # 2. Prevent an admin from deleting another admin
    if user_to_delete.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrators cannot delete other administrators."
        )

    # If checks pass, proceed with deletion
    db.delete(user_to_delete)
    db.commit()
    
    return None
