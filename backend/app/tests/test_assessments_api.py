import io
import json
from app.tests.test_image_quality import create_synthetic_image

def test_full_skin_analyze_and_retrieve_flow(client):
    # 1. Register user with affirmative explicit consent
    reg = client.post("/api/auth/register", json={
        "email": "clinical.flow@example.com",
        "password": "Password123!",
        "full_name": "Clinical Patient",
        "consent_biometric": True,
        "consent_disclaimer": True
    })
    assert reg.status_code == 200, f"Register failed: {reg.text}"
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Upload image and analyze
    image_bytes = create_synthetic_image(sharp=True)
    symptoms = {
        "anatomical_region": "Right Volar Forearm",
        "duration_days": 5,
        "itch_score": 7,
        "pain_score": 2,
        "is_spreading": False,
        "bleeding_or_crusting": False,
        "prior_chemical_exposure": True,
        "exposure_details": "New botanical soap",
        "has_fever_or_chills": False,
        "has_facial_or_throat_swelling": False,
        "has_breathing_difficulty": False,
        "consent_biometric": True,
        "consent_disclaimer": True
    }

    files = {
        "file": ("forearm_patch.jpg", io.BytesIO(image_bytes), "image/jpeg")
    }
    data = {
        "symptoms_json": json.dumps(symptoms),
        "anatomical_region": "Right Volar Forearm",
        "consent_biometric": "true",
        "consent_disclaimer": "true"
    }

    res = client.post("/api/skin/analyze", files=files, data=data, headers=headers)
    assert res.status_code == 200
    res_data = res.json()
    
    assessment_id = res_data["id"]
    assert assessment_id > 0
    assert res_data["session_code"].startswith("SW-")
    assert res_data["quality_metrics"]["is_acceptable"] is True
    assert res_data["triage"]["triage_tier"] in (1, 2, 3)
    assert len(res_data["triage"]["possible_conditions"]) > 0
    assert len(res_data["triage"]["safe_self_care"]) > 0
    assert len(res_data["triage"]["diagnostic_gaps"]) >= 3

    # 3. Retrieve by ID
    get_res = client.get(f"/api/skin/assessment/{assessment_id}", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == assessment_id

    # 4. Export PDF
    pdf_res = client.get(f"/api/skin/assessment/{assessment_id}/pdf", headers=headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 1000  # Genuine binary PDF

    # 5. History list
    hist_res = client.get("/api/skin/assessment-history", headers=headers)
    assert hist_res.status_code == 200
    assert len(hist_res.json()) >= 1

    # 6. Delete assessment
    del_res = client.delete(f"/api/skin/assessment/{assessment_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "success"

    # 7. Deleted assessment is gone
    get_again = client.get(f"/api/skin/assessment/{assessment_id}", headers=headers)
    assert get_again.status_code == 404

