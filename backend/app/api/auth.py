from fastapi import APIRouter, Depends, status
from ..schemas.auth_schema import UserCreate, UserLogin, Token
from ..services.auth_service import AuthService
from ..dependencies.auth_dependency import get_current_user

router = APIRouter(tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    return await AuthService.register_user(user_data)

@router.post("/login", response_model=Token)
async def login(login_data: UserLogin):
    return await AuthService.authenticate_user(login_data)

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    # Remove sensitive data
    user_data = {k: v for k, v in current_user.items() if k != "password"}
    return user_data

@router.post("/logout")
async def logout():
    # In JWT, logout is handled by the client by deleting the token
    return {"message": "Logged out successfully"}
