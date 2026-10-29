import pytest
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token

def test_password_hashing():
    raw = "SecureClinicalPwd2026!"
    hashed = get_password_hash(raw)
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False

def test_jwt_token_creation_and_decoding():
    token = create_access_token(data={"sub": "123", "email": "patient@skinwise.local"})
    assert isinstance(token, str)
    payload = decode_access_token(token)
    assert payload["sub"] == "123"
    assert payload["email"] == "patient@skinwise.local"
    assert "exp" in payload

def test_register_and_login_flow(client):
    register_payload = {
        "email": "test.patient@example.com",
        "password": "Password123!",
        "full_name": "Test Patient",
        "consent_biometric": True,
        "consent_disclaimer": True
    }
    
    # 1. Register
    reg_res = client.post("/api/auth/register", json=register_payload)
    assert reg_res.status_code == 200
    data = reg_res.json()
    assert "access_token" in data
    assert data["email"] == "test.patient@example.com"
    token = data["access_token"]
    
    # 2. Duplicate email rejected
    dup_res = client.post("/api/auth/register", json=register_payload)
    assert dup_res.status_code == 400
    
    # 3. Login
    login_res = client.post("/api/auth/login", json={
        "email": "test.patient@example.com",
        "password": "Password123!"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

    # 4. Profile with token
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "test.patient@example.com"

    # 5. Update settings (toggle zero-cloud retention)
    settings_res = client.put("/api/auth/settings", json={"zero_cloud_retention": True}, headers=headers)
    assert settings_res.status_code == 200
    assert settings_res.json()["zero_cloud_retention"] is True

