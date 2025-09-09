import re

# Regular expressions to validate the format of specific PII fields.
# This map is now comprehensive for all collected data.
REGEX_MAP = {
    # Basic Identifiers
    "fullname": r"^[a-zA-Z\s\.\']{2,100}$",
    "dob": r"^\d{4}-\d{2}-\d{2}$",
    "phone": r"^\+?[0-9\s-]{10,15}$",
    "email": r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$",
    "address": r"^[a-zA-Z0-9\s,.'-]{10,255}$",

    # Government Identifiers
    # CORRECTED: Allow optional hyphens or spaces to match frontend format
    "adhar": r"^\d{4}[-\s]?\d{4}[-\s]?\d{4}$",
    "passport": r"^[A-Z0-9-]{6,20}$",
    "pan": r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$",
    "license": r"^[A-Z0-9-]{5,20}$",
    "smartcard": r"^[a-zA-Z0-9]{10,20}$",
    "professionallicence": r"^[a-zA-Z0-9-/\s]{5,30}$",

    # Financial Info
    "accnum": r"^[0-9-]{8,20}$",
    # CORRECTED: Allow optional hyphens or spaces for 16-digit cards
    "creditnum": r"^\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}$",
    "cvv": r"^[0-9]{3,4}$",
    "tax": r"^[a-zA-Z0-9-]{10,30}$",
    "pension": r"^[a-zA-Z0-9-]{10,25}$",
    "tradingacc": r"^[a-zA-Z0-9-]{8,20}$",

    # Employment & Education
    "empid": r"^[a-zA-Z0-9-]{3,20}$",
    "workemail": r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]++$",
    "emis": r"^[0-9]{10,20}$",
    "umis": r"^[a-zA-Z0-9]{10,20}$",

    # Health & Insurance
    "health_insurance": r"^[a-zA-Z0-9-]{10,30}$",
    "patientid": r"^[a-zA-Z0-9-]{5,25}$",
    "disability_certificate": r"^[a-zA-Z0-9-/\s]{10,30}$",
    "emergency_contact": r"^[a-zA-Z0-9\s,.'-:+()]{10,100}$",
}

def sanitize_input(value: str) -> str:
    """
    Strips any characters that could be used for HTML/script injection (XSS).
    """
    if not isinstance(value, str):
        return ""
    return re.sub(r'[<>/&"\'`]', '', value)

def validate_and_sanitize(field_name: str, value: str) -> (bool, str):
    """
    Validates a given value against a predefined regex and sanitizes it.
    """
    sanitized_value = sanitize_input(value)
    if field_name in REGEX_MAP:
        if not re.match(REGEX_MAP[field_name], sanitized_value):
            return (False, sanitized_value)
    return (True, sanitized_value)
