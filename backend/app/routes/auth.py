from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from bson import ObjectId
from app.core.database import get_database
from app.core.security import verify_password, create_access_token
from app.models.user import UserResponse
from app.routes.dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login")
async def login(request: Request):
    content_type = request.headers.get("content-type", "")
    username = None
    password = None

    if "application/json" in content_type:
        try:
            data = await request.json()
            username = data.get("username") or data.get("email")
            password = data.get("password")
        except Exception:
            pass
    else:
        try:
            form = await request.form()
            username = form.get("username") or form.get("email")
            password = form.get("password")
        except Exception:
            pass

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password required"
        )

    db = get_database()
    user_doc = await db.users.find_one({"email": username})
    if not user_doc or not verify_password(password, user_doc["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
    
    if user_doc.get("enrollment_status") != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive or suspended"
        )

    access_token = create_access_token(subject=user_doc["_id"])
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user_doc["role"],
        "name": user_doc["name"],
        "department": user_doc.get("department")
    }

@router.post("/login-json")
async def login_json(data: dict):
    email = data.get("email")
    password = data.get("password")
    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password required"
        )
        
    db = get_database()
    user_doc = await db.users.find_one({"email": email})
    if not user_doc or not verify_password(password, user_doc["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password"
        )
        
    if user_doc.get("enrollment_status") != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive or suspended"
        )

    access_token = create_access_token(subject=user_doc["_id"])
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user_doc["role"],
        "name": user_doc["name"],
        "department": user_doc.get("department")
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    return current_user
