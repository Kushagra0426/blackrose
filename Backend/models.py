from pydantic import BaseModel
from typing import Optional

# Model for login request
class LoginRequest(BaseModel):
    username: str
    password: str

# Model for login response
class LoginResponse(BaseModel):
    token: str

# Model for CRUD operation request
class CRUDRequest(BaseModel):
    operation: str  # "create", "read", "update", or "delete"
    data: dict      # Data for the operation (e.g., {"id": 1, "name": "John"})

# Model for CRUD operation response
class CRUDResponse(BaseModel):
    status: str
    message: Optional[str] = None
    data: Optional[dict] = None

# Model for random number response
class RandomNumberResponse(BaseModel):
    timestamp: str
    value: int