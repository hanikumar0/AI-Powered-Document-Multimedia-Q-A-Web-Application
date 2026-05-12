import pytest
from app.services.auth_service import AuthService
from app.schemas.auth_schema import UserCreate, UserLogin
from app.utils.password_handler import PasswordHandler
from app.utils.jwt_handler import JWTHandler
import uuid

@pytest.mark.asyncio
async def test_register_user_success(mock_db, monkeypatch):
    # Mock database is already passed as fixture and patched in conftest
    user_data = UserCreate(
        name="Test User",
        email="test@example.com",
        password="password123"
    )
    
    result = await AuthService.register_user(user_data)
    
    assert "access_token" in result
    assert result["user"]["email"] == "test@example.com"
    
    # Check if user is in DB
    user_in_db = await mock_db.users.find_one({"email": "test@example.com"})
    assert user_in_db is not None
    assert user_in_db["name"] == "Test User"
    assert PasswordHandler.verify_password("password123", user_in_db["password"])

@pytest.mark.asyncio
async def test_register_duplicate_email(mock_db, monkeypatch):
    user_data = UserCreate(
        name="Test User",
        email="test@example.com",
        password="password123"
    )
    
    # First registration
    await AuthService.register_user(user_data)
    
    # Second registration with same email
    with pytest.raises(Exception) as excinfo:
        await AuthService.register_user(user_data)
    
    assert "Email already registered" in str(excinfo.value)

@pytest.mark.asyncio
async def test_authenticate_user_success(mock_db, monkeypatch):
    # Pre-register user
    hashed_password = PasswordHandler.hash_password("password123")
    await mock_db.users.insert_one({
        "_id": str(uuid.uuid4()),
        "name": "Test User",
        "email": "test@example.com",
        "password": hashed_password
    })
    
    login_data = UserLogin(email="test@example.com", password="password123")
    result = await AuthService.authenticate_user(login_data)
    
    assert "access_token" in result
    assert result["user"]["email"] == "test@example.com"

@pytest.mark.asyncio
async def test_authenticate_invalid_password(mock_db, monkeypatch):
    # Pre-register user
    hashed_password = PasswordHandler.hash_password("password123")
    await mock_db.users.insert_one({
        "_id": str(uuid.uuid4()),
        "name": "Test User",
        "email": "test@example.com",
        "password": hashed_password
    })
    
    login_data = UserLogin(email="test@example.com", password="wrongpassword")
    with pytest.raises(Exception) as excinfo:
        await AuthService.authenticate_user(login_data)
    
    assert "Invalid email or password" in str(excinfo.value)

def test_jwt_token_generation_and_validation():
    payload = {"sub": "test@example.com"}
    token = JWTHandler.create_access_token(payload)
    assert token is not None
    
    decoded = JWTHandler.decode_token(token)
    assert decoded["sub"] == "test@example.com"

def test_jwt_custom_expiry():
    from datetime import timedelta
    token = JWTHandler.create_access_token({"sub": "exp"}, expires_delta=timedelta(minutes=1))
    assert token is not None

def test_jwt_decode_invalid():
    assert JWTHandler.decode_token("not-a-token") is None

def test_password_hashing():
    password = "secret_password"
    hashed = PasswordHandler.hash_password(password)
    assert hashed != password
    assert PasswordHandler.verify_password(password, hashed)
    assert not PasswordHandler.verify_password("wrong_password", hashed)
