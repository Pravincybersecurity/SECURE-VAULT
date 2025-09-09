import subprocess
import os
from dotenv import load_dotenv
from urllib.parse import urlparse, unquote

# Load environment variables from .env file
load_dotenv()

# --- Configuration ---
# Securely get database URLs from environment variables
PII_DB_URL = os.getenv("PII_DATABASE_URL")
KEY_DB_URL = os.getenv("KEY_DATABASE_URL")

BACKUP_DIR = r"C:\DailyDBBackups" # Raw string to prevent path issues
BACKUP_FILENAME = "latest_full_backup.sql"

def parse_db_url(url: str):
    """Parses a SQLAlchemy-style database URL to extract components."""
    if not url:
        return None
    try:
        parsed = urlparse(url)
        return {
            "user": unquote(parsed.username),
            "password": unquote(parsed.password),
            "host": parsed.hostname,
            "port": str(parsed.port or 3306),
            "db_name": parsed.path.lstrip('/'),
        }
    except Exception as e:
        print(f"Error parsing database URL: {e}")
        return None

def create_database_backup():
    """
    Deletes the previous backup and creates a new one for all configured databases.
    """
    pii_db_creds = parse_db_url(PII_DB_URL)
    key_db_creds = parse_db_url(KEY_DB_URL)

    if not pii_db_creds or not key_db_creds:
        print("Error: Database URLs are not configured correctly in the .env file.")
        return False

    # Since both databases are on different servers, we must back them up separately
    # and append them to the same file.

    if not os.path.exists(BACKUP_DIR):
        print(f"Backup directory not found. Creating {BACKUP_DIR}...")
        os.makedirs(BACKUP_DIR)

    latest_backup_path = os.path.join(BACKUP_DIR, BACKUP_FILENAME)
    if os.path.exists(latest_backup_path):
        try:
            os.remove(latest_backup_path)
            print(f"Previous backup file deleted: {latest_backup_path}")
        except OSError as e:
            print(f"Error deleting previous backup file: {e}")

    print(f"Starting new backup to {latest_backup_path}...")
    success = True
    
    # Backup each database
    for creds in [pii_db_creds, key_db_creds]:
        try:
            command = [
                "mysqldump",
                f"--user={creds['user']}",
                f"--password={creds['password']}",
                f"--host={creds['host']}",
                f"--port={creds['port']}",
                "--single-transaction", # Good practice for consistent backups
                creds['db_name']
            ]

            # Use 'a' to append the second DB backup to the same file
            with open(latest_backup_path, "a") as f:
                process = subprocess.Popen(
                    command, stdout=f, stderr=subprocess.PIPE, text=True
                )
                _, stderr = process.communicate()
                
                if process.returncode != 0:
                    print(f"Backup failed for {creds['db_name']}. Error: {stderr.strip()}")
                    success = False

        except FileNotFoundError:
            print("Error: 'mysqldump' command not found. Please ensure MySQL Client is installed and in your system's PATH.")
            return False
        except Exception as e:
            print(f"An unexpected error occurred during backup for {creds['db_name']}: {e}")
            return False

    if success:
        print(f"New backup completed successfully to {latest_backup_path}")
    
    return success

# This block allows you to run the script directly for testing.
if __name__ == "__main__":
    if create_database_backup():
        print("Backup process finished.")
    else:
        print("Backup process encountered an error.")