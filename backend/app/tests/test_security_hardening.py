import io
import json
import pytest
from app.tests.test_image_quality import create_synthetic_image
from app.core.security import create_guest_token
from app.core.rate_limiter import register_rate_limiter, auth_rate_limiter, analyze_rate_limiter

@pytest.fixture(autouse=True)
def reset_rate_limits():
    """Ensure clean sliding window rate limit state for each test."""
    register_rate_limiter.reset()
    auth_rate_limiter.reset()
    analyze_rate_limiter.reset()
    yield
    register_rate_limiter.reset()
    auth_rate_limiter.reset()
    analyze_rate_limiter.reset()

def test_cross_patient_access_forbidden(client):
    """Verify Patient B cannot access Patient A's assessment or download their clinical PDF."""
    # 1. Register Patient A
    reg_a = client.post("/api/auth/register", json={
        "email": "patient_a@example.com",
        "password": "Password123!",
        "full_name": "Patient Alpha",
        "consent_biometric": True,
        "consent_disclaimer": True
    })
    assert reg_a.status_code == 200, f"Register A failed: {reg_a.text}"
    token_a = reg_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # 2. Register Patient B
    reg_b = client.post("/api/auth/register", json={
        "email": "patient_b@example.com",
        "password": "Password123!",
        "full_name": "Patient Beta",
        "consent_biometric": True,
        "consent_disclaimer": True
    })
    assert reg_b.status_code == 200, f"Register B failed: {reg_b.text}"
    token_b = reg_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 3. Patient A creates an assessment
    image_bytes = create_synthetic_image(sharp=True)
    files = {"file": ("alpha_lesion.jpg", io.BytesIO(image_bytes), "image/jpeg")}
    symptoms = {
        "anatomical_region": "Left Cheek",
        "duration_days": 10,
        "itch_score": 4,
        "pain_score": 1,
        "consent_biometric": True,
        "consent_disclaimer": True
    }
    data = {
        "symptoms_json": json.dumps(symptoms),
        "anatomical_region": "Left Cheek",
        "consent_biometric": "true",
        "consent_disclaimer": "true"
    }

    create_res = client.post("/api/skin/analyze", files=files, data=data, headers=headers_a)
    assert create_res.status_code == 200
    assessment_id = create_res.json()["id"]

    # 4. Patient A can view their assessment
    view_res_a = client.get(f"/api/skin/assessment/{assessment_id}", headers=headers_a)
    assert view_res_a.status_code == 200
    assert view_res_a.json()["id"] == assessment_id

    # 5. Patient B is FORBIDDEN from viewing Patient A's assessment
    view_res_b = client.get(f"/api/skin/assessment/{assessment_id}", headers=headers_b)
    assert view_res_b.status_code == 403
    assert "access denied" in view_res_b.json()["detail"].lower()

    # 6. Patient B is FORBIDDEN from downloading Patient A's PDF
    pdf_res_b = client.get(f"/api/skin/assessment/{assessment_id}/pdf", headers=headers_b)
    assert pdf_res_b.status_code == 403

def test_anonymous_access_rejection(client):
    """Verify unauthenticated requests cannot view patient records or clinical PDFs."""
    # 1. Register a patient and create an assessment
    reg = client.post("/api/auth/register", json={
        "email": "patient_secure@example.com",
        "password": "Password123!",
        "full_name": "Secure Patient",
        "consent_biometric": True,
        "consent_disclaimer": True
    })
    assert reg.status_code == 200, f"Register failed: {reg.text}"
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    image_bytes = create_synthetic_image(sharp=True)
    files = {"file": ("spot.jpg", io.BytesIO(image_bytes), "image/jpeg")}
    symptoms = {
        "anatomical_region": "Forehead",
        "duration_days": 7,
        "consent_biometric": True,
        "consent_disclaimer": True
    }
    data = {
        "symptoms_json": json.dumps(symptoms),
        "anatomical_region": "Forehead",
        "consent_biometric": "true",
        "consent_disclaimer": "true"
    }

    create_res = client.post("/api/skin/analyze", files=files, data=data, headers=headers)
    assert create_res.status_code == 200
    assessment_id = create_res.json()["id"]

    # 2. Anonymous request without token or guest token is rejected with 403 or 401
    anon_res = client.get(f"/api/skin/assessment/{assessment_id}")
    assert anon_res.status_code in (401, 403)

    # 3. Anonymous PDF request is rejected
    anon_pdf = client.get(f"/api/skin/assessment/{assessment_id}/pdf")
    assert anon_pdf.status_code in (401, 403)

def test_scoped_guest_token_workflow(client):
    """Verify that guest tokens grant access ONLY to their designated assessment and reject foreign IDs."""
    image_bytes = create_synthetic_image(sharp=True)
    files = {"file": ("guest_spot.jpg", io.BytesIO(image_bytes), "image/jpeg")}
    symptoms = {
        "anatomical_region": "Forearm",
        "duration_days": 3,
        "consent_biometric": True,
        "consent_disclaimer": True
    }
    data = {
        "symptoms_json": json.dumps(symptoms),
        "anatomical_region": "Forearm",
        "consent_biometric": "true",
        "consent_disclaimer": "true"
    }

    # Guest submission (no Authorization header)
    create_res = client.post("/api/skin/analyze", files=files, data=data)
    assert create_res.status_code == 200
    res_data = create_res.json()
    assessment_id = res_data["id"]
    guest_token = res_data.get("guest_access_token")

    assert guest_token is not None, "Guest token should be issued for guest assessments"

    # Guest can access their own assessment with guest_token
    guest_get = client.get(f"/api/skin/assessment/{assessment_id}?guest_token={guest_token}")
    assert guest_get.status_code == 200
    assert guest_get.json()["id"] == assessment_id

    # Guest CANNOT access another assessment ID using this scoped token
    foreign_id = assessment_id + 9999
    foreign_get = client.get(f"/api/skin/assessment/{foreign_id}?guest_token={guest_token}")
    assert foreign_get.status_code in (403, 404)

def test_file_signature_magic_bytes_validation(client):
    """Verify that disguised executable/script files with fake extensions are rejected by signature checks."""
    # Spoofed file: 2KB text/script masquerading as .jpg (exceeds 1KB min size)
    fake_jpeg_content = b"#!/bin/bash\necho 'malicious payload'\n" + b"X" * 2048
    files = {"file": ("malicious.jpg", io.BytesIO(fake_jpeg_content), "image/jpeg")}
    symptoms = {
        "anatomical_region": "Arm",
        "duration_days": 2,
        "consent_biometric": True,
        "consent_disclaimer": True
    }
    data = {
        "symptoms_json": json.dumps(symptoms),
        "anatomical_region": "Arm",
        "consent_biometric": "true",
        "consent_disclaimer": "true"
    }

    res = client.post("/api/skin/analyze", files=files, data=data)
    assert res.status_code == 400
    assert "invalid file signature" in res.json()["detail"].lower()

def test_rate_limiter_exceeded(client):
    """Verify that repeated requests beyond threshold trigger HTTP 429 Too Many Requests."""
    auth_rate_limiter.reset()
    # auth_rate_limiter allows 8 requests/min; sending 9 requests should trigger 429
    last_status = 200
    retry_header = None
    for _ in range(9):
        res = client.post("/api/auth/login", json={
            "email": "rate_test@example.com",
            "password": "WrongPassword123!"
        })
        last_status = res.status_code
        retry_header = res.headers.get("Retry-After")

    assert last_status == 429
    assert retry_header is not None

def test_consent_withdrawal_and_audit(client):
    """Verify patient can withdraw biometric consent and audit trail is logged."""
    reg = client.post("/api/auth/register", json={
        "email": "consent.audit@example.com",
        "password": "Password123!",
        "full_name": "Audit Patient",
        "consent_biometric": True,
        "consent_disclaimer": True
    })
    assert reg.status_code == 200, f"Register failed: {reg.text}"
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Withdraw biometric consent
    withdraw_res = client.post(
        "/api/auth/consent/withdraw",
        json={"revoke_biometric": True, "delete_stored_images": False},
        headers=headers
    )
    assert withdraw_res.status_code == 200
    assert withdraw_res.json()["status"] == "success"

    # 2. Check withdrawal response
    assert "revoked" in withdraw_res.json()["message"].lower()

    # 3. Check consent audit history
    audit_res = client.get("/api/auth/consent/history", headers=headers)
    assert audit_res.status_code == 200
    history = audit_res.json()
    assert "audit_trail" in history
    assert len(history["audit_trail"]) >= 1
    assert any(log["action"] == "withdrawn" or "withdrew" in log["details"].lower() for log in history["audit_trail"])

def test_bangladesh_provider_directory(client):
    """Verify Bangladesh healthcare provider referral directory returns verified institutions."""
    res = client.get("/api/referral/providers")
    assert res.status_code == 200
    data = res.json()
    assert "providers" in data
    assert data["total_count"] >= 5

    # Check for known institutions in Dhaka
    provider_names = [p["name"] for p in data["providers"]]
    assert any("Bangabandhu Sheikh Mujib Medical University" in name or "BSMMU" in name for name in provider_names)
    assert any("Square Hospital" in name for name in provider_names)

    # Check provider fields integrity
    first_provider = data["providers"][0]
    assert "division" in first_provider
    assert "contact_phone" in first_provider
    assert "consultation_fee_bdt" in first_provider
    assert "services" in first_provider
    assert len(first_provider["services"]) > 0


def test_retention_authorization_worker_and_user_isolation(client):
    """Verify global retention cleanup is locked to X-Worker-Secret, while users have self-cleanup."""
    # 1. Unauthenticated or wrong secret gets 403
    unauth_res = client.post("/api/auth/retention/worker-cleanup")
    assert unauth_res.status_code == 403
    assert "worker authorization" in unauth_res.json()["detail"].lower()

    bad_res = client.post(
        "/api/auth/retention/worker-cleanup",
        headers={"X-Worker-Secret": "invalid-secret-key"}
    )
    assert bad_res.status_code == 403

    # 2. Worker with correct secret succeeds
    from app.core.config import settings
    worker_res = client.post(
        "/api/auth/retention/worker-cleanup",
        headers={"X-Worker-Secret": settings.WORKER_SECRET}
    )
    assert worker_res.status_code == 200
    assert "expired_assessments_count" in worker_res.json()

    # 3. User self-service cleanup
    reg = client.post("/api/auth/register", json={
        "email": "user.cleanup@example.com",
        "password": "Password123!",
        "full_name": "Cleanup User",
        "consent_biometric": True,
        "consent_disclaimer": True
    })
    token = reg.json()["access_token"]
    user_cleanup_res = client.post(
        "/api/auth/retention/cleanup-my-records",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert user_cleanup_res.status_code == 200
    assert "expired_assessments_count" in user_cleanup_res.json()


def test_affirmative_explicit_consent_enforcement(client):
    """Verify that omission or denial of biometric consent or disclaimer is rejected."""
    # 1. Omitted consent on registration -> HTTP 422
    omitted_reg = client.post("/api/auth/register", json={
        "email": "noconsent@example.com",
        "password": "Password123!",
        "full_name": "No Consent"
    })
    assert omitted_reg.status_code == 422

    # 2. Explicit False consent on registration -> HTTP 400
    denied_reg = client.post("/api/auth/register", json={
        "email": "denied@example.com",
        "password": "Password123!",
        "full_name": "Denied Consent",
        "consent_biometric": False,
        "consent_disclaimer": True
    })
    assert denied_reg.status_code == 400
    assert "biometric intake consent" in denied_reg.json()["detail"].lower()

    # 3. Denied disclaimer on analysis -> HTTP 400
    image_bytes = create_synthetic_image(sharp=True)
    files = {"file": ("test.jpg", io.BytesIO(image_bytes), "image/jpeg")}
    symptoms = {
        "anatomical_region": "Arm",
        "duration_days": 2,
        "consent_biometric": True,
        "consent_disclaimer": False
    }
    data = {
        "symptoms_json": json.dumps(symptoms),
        "anatomical_region": "Arm",
        "consent_biometric": "true",
        "consent_disclaimer": "false"
    }
    denied_analysis = client.post("/api/skin/analyze", files=files, data=data)
    assert denied_analysis.status_code == 400
    assert "mandatory consent missing" in denied_analysis.json()["detail"].lower()


def test_heic_image_actionable_error_message(client):
    """Verify uploading Apple HEIC files returns a helpful error with conversion instructions."""
    # Simulated HEIC ftyp header (ftypheic)
    heic_bytes = b"\x00\x00\x00\x18ftypheic" + b"\x00" * 2048
    files = {"file": ("photo.heic", io.BytesIO(heic_bytes), "image/heic")}
    symptoms = {
        "anatomical_region": "Leg",
        "duration_days": 1,
        "consent_biometric": True,
        "consent_disclaimer": True
    }
    data = {
        "symptoms_json": json.dumps(symptoms),
        "anatomical_region": "Leg",
        "consent_biometric": "true",
        "consent_disclaimer": "true"
    }
    res = client.post("/api/skin/analyze", files=files, data=data)
    assert res.status_code == 400
    detail = res.json()["detail"].lower()
    assert "heic" in detail or "heif" in detail
    assert "jpeg" in detail or "png" in detail or "webp" in detail


def test_complete_patient_data_export(client):
    """Verify complete clinical data export returns full questionnaire, audit logs, and assessments."""
    reg = client.post("/api/auth/register", json={
        "email": "export.patient@example.com",
        "password": "Password123!",
        "full_name": "Export Patient",
        "consent_biometric": True,
        "consent_disclaimer": True
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create assessment
    image_bytes = create_synthetic_image(sharp=True)
    files = {"file": ("spot.jpg", io.BytesIO(image_bytes), "image/jpeg")}
    symptoms = {
        "anatomical_region": "Neck",
        "duration_days": 4,
        "itch_score": 3,
        "pain_score": 1,
        "consent_biometric": True,
        "consent_disclaimer": True
    }
    data = {
        "symptoms_json": json.dumps(symptoms),
        "anatomical_region": "Neck",
        "consent_biometric": "true",
        "consent_disclaimer": "true"
    }
    client.post("/api/skin/analyze", files=files, data=data, headers=headers)

    # Perform full export
    export_res = client.get("/api/skin/export/complete", headers=headers)
    assert export_res.status_code == 200
    export_data = export_res.json()

    assert "export_metadata" in export_data
    assert export_data["export_metadata"]["patient_email"] == "export.patient@example.com"
    assert "consent_history" in export_data
    assert len(export_data["consent_history"]) >= 1
    assert "assessments" in export_data
    assert len(export_data["assessments"]) >= 1
    assert export_data["assessments"][0]["anatomical_region"] == "Neck"


def test_standardized_demo_account(client):
    """Verify the single source-of-truth demo account is accessible."""
    demo_email = "sarah.jenkins@example.com"
    demo_password = "SkinWise2026!"

    # Try logging in directly (in case seeded)
    login_res = client.post("/api/auth/login", json={
        "email": demo_email,
        "password": demo_password
    })
    if login_res.status_code != 200:
        # Register if not auto-seeded in test DB
        reg_res = client.post("/api/auth/register", json={
            "email": demo_email,
            "password": demo_password,
            "full_name": "Dr. Sarah Jenkins",
            "consent_biometric": True,
            "consent_disclaimer": True
        })
        assert reg_res.status_code == 200
        login_res = client.post("/api/auth/login", json={
            "email": demo_email,
            "password": demo_password
        })

    assert login_res.status_code == 200
    assert "access_token" in login_res.json()

