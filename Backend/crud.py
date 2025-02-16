import csv
import os
import filelock
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

CSV_FILE = os.getenv('CSV_FILE')
BACKUP_DIR = "backups"

def fetch_csv():
    try:
        with open(CSV_FILE, "r") as file:
            return list(csv.DictReader(file))
    except FileNotFoundError:
        print(f"CSV file '{CSV_FILE}' not found.")
        raise
    except Exception as e:
        print(f"Failed to read CSV file: {e}")
        raise

def sanitize_filename(timestamp: str) -> str:
    """
    Sanitize the timestamp to make it a valid filename.
    Replace colons (:) and other invalid characters with underscores (_).
    """
    return timestamp.replace(":", "_").replace(".", "_")

def perform_crud_operation(operation: str, data: dict):
    lock = filelock.FileLock(f"{CSV_FILE}.lock")
    try:
        with lock:
            # Create backup before modifying the file
            timestamp = datetime.now().isoformat()
            sanitized_timestamp = sanitize_filename(timestamp)
            backup_file = os.path.join(BACKUP_DIR, f"backup_{sanitized_timestamp}.csv")
            os.makedirs(BACKUP_DIR, exist_ok=True)
            print(f"Creating backup: {backup_file}")
            with open(CSV_FILE, "r") as original, open(backup_file, "w") as backup:
                backup.write(original.read())

            # Perform CRUD operation
            rows = fetch_csv()
            if operation == "create":
                # Ensure the input data matches the CSV fieldnames
                fieldnames = rows[0].keys() if rows else ["user", "broker", "API key", "API secret", "pnl", "margin", "max_risk"]
                new_row = {field: data.get(field, "") for field in fieldnames}
                rows.append(new_row)
            elif operation == "update":
                for row in rows:
                    if row["user"] == data.get("user"):  # Use "user" as the unique identifier
                        row.update({field: data.get(field, row[field]) for field in row.keys()})
                        break
            elif operation == "delete":
                rows = [row for row in rows if row["user"] != data.get("user")]  # Use "user" as the unique identifier
            else:
                raise ValueError("Invalid operation")

            # Write updated data to CSV
            with open(CSV_FILE, "w", newline="") as file:
                fieldnames = rows[0].keys() if rows else ["user", "broker", "API key", "API secret", "pnl", "margin", "max_risk"]
                writer = csv.DictWriter(file, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(rows)

        return {"status": "success"}
    except Exception as e:
        print(f"Failed to perform CRUD operation: {e}")
        raise