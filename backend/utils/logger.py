import logging
import json
from datetime import datetime
import os

# Create a custom JSON Formatter
class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_object = {
            "timestamp": datetime.utcfromtimestamp(record.created).isoformat() + "Z",
            "level": record.levelname,
            "message": record.getMessage(),
            "source_file": os.path.basename(record.pathname),
        }
        if hasattr(record, 'extra_data'):
            log_object.update(record.extra_data)
        return json.dumps(log_object)

# Get the main logger instance
logger = logging.getLogger("secure_vault_logger")
logger.setLevel(logging.INFO)
logger.propagate = False

# Configure handlers only if they haven't been added already
if not logger.handlers:
    json_file_handler = logging.FileHandler("app_logs.json")
    json_file_handler.setFormatter(JSONFormatter())
    
    console_handler = logging.StreamHandler()
    console_formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    console_handler.setFormatter(console_formatter)
    
    logger.addHandler(json_file_handler)
    logger.addHandler(console_handler)

def log_pii_action(user_id: int, username: str, category: str, field_name: str, sensitivity: str, action: str):
    """Logs metadata about PII actions, including the username."""
    extra_data = {
        "event": "pii_action",
        "user_id": user_id,
        "username": username,  # <-- ADDED
        "details": {
            "category": category,
            "field_name": field_name,
            "sensitivity": sensitivity,
            "action": action
        }
    }
    # Updated message to include the username for clarity
    message = f"PII action '{action}' by user '{username}' (ID: {user_id})"
    logger.info(message, extra={'extra_data': extra_data})