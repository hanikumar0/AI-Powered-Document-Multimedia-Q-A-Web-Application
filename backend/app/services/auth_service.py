from datetime import datetime
from fastapi import HTTPException, status
from ..db.mongodb import get_database
from ..utils.password_handler import PasswordHandler
from ..utils.jwt_handler import JWTHandler
from ..schemas.auth_schema import UserCreate, UserLogin
import uuid

class AuthService:
    @staticmethod
    async def register_user(user_data: UserCreate):
        db = get_database()
        email = user_data.email.lower().strip()
        
        # Check if user exists
        existing_user = await db.users.find_one({"email": email})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        hashed_password = PasswordHandler.hash_password(user_data.password)
        
        new_user = {
            "_id": str(uuid.uuid4()),
            "name": user_data.name,
            "email": email,
            "password": hashed_password,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await db.users.insert_one(new_user)
        
        token = JWTHandler.create_access_token({"sub": email})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {"name": new_user["name"], "email": email}
        }

    @staticmethod
    async def authenticate_user(login_data: UserLogin):
        db = get_database()
        email = login_data.email.lower().strip()
        
        user = await db.users.find_one({"email": email})
        if not user or not PasswordHandler.verify_password(login_data.password, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        token = JWTHandler.create_access_token({"sub": email})
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {"name": user["name"], "email": email}
        }
