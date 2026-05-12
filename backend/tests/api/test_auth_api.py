import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.utils.jwt_handler import JWTHandler
from app.utils.password_handler import PasswordHandler
import uuid

@pytest.mark.asyncio
async def test_register_success(client, mock_db):
    response = client.post(
        "/api/auth/register",
        json={"name": "New User", "email": "new@example.com", "password": "password123"}
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "new@example.com"

@pytest.mark.asyncio
async def test_register_duplicate(client, mock_db):
    # Pre-register
    await mock_db.users.insert_one({
        "_id": "u1",
        "name": "Existing",
        "email": "existing@example.com",
        "password": "hashed"
    })
    
    response = client.post(
        "/api/auth/register",
        json={"name": "New", "email": "existing@example.com", "password": "password"}
    )
    assert response.status_code == 400
    assert "Email already registered" in response.json()["detail"]

@pytest.mark.asyncio
async def test_login_success(client, mock_db):
    hashed = PasswordHandler.hash_password("password123")
    await mock_db.users.insert_one({
        "_id": "u2",
        "name": "Login User",
        "email": "login@example.com",
        "password": hashed
    })
    
    response = client.post(
        "/api/auth/login",
        json={"email": "login@example.com", "password": "password123"}
    )
    assert response.status_code == 200
    assert "access_token" in response.json()

@pytest.mark.asyncio
async def test_login_failure(client, mock_db):
    response = client.post(
        "/api/auth/login",
        json={"email": "nonexistent@example.com", "password": "wrong"}
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

@pytest.mark.asyncio
async def test_get_me_success(client, mock_db):
    email = "me@example.com"
    hashed = PasswordHandler.hash_password("pass")
    await mock_db.users.insert_one({
        "_id": "u3",
        "name": "Me",
        "email": email,
        "password": hashed
    })
    
    token = JWTHandler.create_access_token({"sub": email})
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    if response.status_code != 200:
        print(f"DEBUG AUTH FAIL: {response.json()}")
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == email
    assert "password" not in data

@pytest.mark.asyncio
async def test_get_me_unauthorized(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_logout(client):
    response = client.post("/api/auth/logout")
    assert response.status_code == 200
    assert response.json()["message"] == "Logged out successfully"

@pytest.mark.asyncio
async def test_get_me_invalid_token(client):
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 401
    assert "validate credentials" in response.json()["detail"]

@pytest.mark.asyncio
async def test_get_me_user_not_found(client):
    token = JWTHandler.create_access_token({"sub": "nonexistent@example.com"})
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 401
    assert "User not found" in response.json()["detail"]
