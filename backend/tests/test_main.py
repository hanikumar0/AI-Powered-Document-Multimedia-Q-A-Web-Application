import pytest
from fastapi.testclient import TestClient
from app.main import app

def test_root():
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    assert "Welcome" in response.json()["message"]

def test_health():
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
