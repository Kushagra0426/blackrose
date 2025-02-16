from fastapi import FastAPI, WebSocket, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from auth import create_token, validate_token
from random_generator import start_random_number_generator
from crud import perform_crud_operation, fetch_csv
from models import LoginRequest, LoginResponse, CRUDRequest, CRUDResponse
from database import create_tables, store_user_session, get_latest_random_number
import asyncio
from datetime import datetime
import os
import glob

app = FastAPI()
security = HTTPBearer()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # React dev server URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store the background task
background_task = None

# Start the random number generator
@app.on_event("startup")
async def startup_event():
    await create_tables()  # Ensure tables exist
    global background_task
    background_task = asyncio.create_task(start_random_number_generator())

# Shutdown handler to cancel the background task
@app.on_event("shutdown")
async def shutdown_event():
    if background_task:
        background_task.cancel()
        try:
            await background_task
        except asyncio.CancelledError:
            print("Background task cancelled.")

# Login endpoint
@app.post("/login", response_model=LoginResponse)
async def login(login_request: LoginRequest):
    # Accept any username and password
    print(login_request.username)
    token = create_token(login_request.username)
    await store_user_session(login_request.username, token)  # Store session in the database
    return {"token": token}

# WebSocket for real-time random number streaming
@app.websocket("/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    token = websocket.query_params.get("token")
    if not token:
        # Extract the token from the WebSocket headers
        headers = dict(websocket.headers)
        token = headers.get("authorization") or headers.get("Authorization")
    if not token:
        await websocket.close(code=1008, reason="Authorization token missing")
        return

    # Validate the token
    try:
        # Remove "Bearer " prefix if present
        if token.startswith("Bearer "):
            token = token.split("Bearer ")[1]
        if not validate_token(token):
            await websocket.close(code=1008, reason="Invalid token")
            return
    except Exception as e:
        await websocket.close(code=1008, reason=f"Token validation failed: {e}")
        return

    # Send random numbers every second
    while True:
        try:
            random_number = await get_latest_random_number()
            await websocket.send_json({"timestamp": datetime.now().isoformat(), "value": random_number})
            await asyncio.sleep(1)
        except Exception as e:
            print(f"WebSocket error: {e}")
            await websocket.close(code=1011, reason="Internal server error")
            break

# Fetch CSV file
@app.get("/fetch_csv")
async def get_csv(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    if not validate_token(token):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return fetch_csv()

# CRUD operations
@app.post("/crud", response_model=CRUDResponse)
async def crud_operation(crud_request: CRUDRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    if not validate_token(token):
        raise HTTPException(status_code=401, detail="Unauthorized")
    result = perform_crud_operation(crud_request.operation, crud_request.data)
    return {"status": "success", "data": result}

# Recovery endpoint
@app.post("/recover")
async def recover(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    if not validate_token(token):
        raise HTTPException(status_code=401, detail="Unauthorized")
    try:
        # Find the latest backup file
        backup_files = glob.glob(os.path.join("backups", "backup_*.csv"))
        if not backup_files:
            raise HTTPException(status_code=404, detail="No backup files found")

        # Get the most recent backup file
        latest_backup = max(backup_files, key=os.path.getmtime)

        # Copy the latest backup to overwrite the current CSV file
        with open(latest_backup, "r") as backup, open("backend_table.csv", "w") as current:
            current.write(backup.read())

        return {"status": "success", "message": f"Recovered from {latest_backup}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recovery failed: {e}")