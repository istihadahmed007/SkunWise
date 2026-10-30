import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.openfda_service import openfda_service
from app.services.uv_service import uv_service
from app.services.huggingface_adapter import huggingface_adapter

client = TestClient(app)

def test_models_status_endpoint():
    response = client.get("/api/integrations/models/status")
    assert response.status_code == 200
    data = response.json()
    assert "primary_vision_engine" in data
    assert "huggingface_dermatology_engine" in data
    assert "public_apis" in data
    
    # Verify primary model has localization enabled
    assert data["primary_vision_engine"]["supports_localization"] is True
    
    # Verify Hugging Face evaluated model honestly reports no spatial localization
    hf_engine = data["huggingface_dermatology_engine"]
    assert hf_engine["model_id"] == "Jayanth2002/dinov2-base-finetuned-SkinDisease"
    assert hf_engine["supports_localization"] is False

def test_uv_forecast_valid():
    response = client.get("/api/integrations/uv/forecast?latitude=23.81&longitude=90.41")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "current_uv_index" in data
    assert "recommended_spf" in data
    assert "licensing_notice" in data
    assert "CC BY 4.0" in data["attribution"]

def test_uv_forecast_invalid_coords():
    response = client.get("/api/integrations/uv/forecast?latitude=105.0&longitude=90.41")
    # FastAPI query validation bounds or service check
    assert response.status_code in [422, 200]
    if response.status_code == 200:
        data = response.json()
        assert data["success"] is False

def test_openfda_cosmetics_search():
    response = client.get("/api/integrations/cosmetics/adverse-events?query=lotion&limit=2")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "total_reports" in data
    assert "disclaimer" in data
    assert "NOT establish that a product caused" in data["disclaimer"]

def test_openfda_cosmetics_nonexistent():
    response = client.get("/api/integrations/cosmetics/adverse-events?query=xyznonexistentfakebrand999&limit=2")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total_reports"] == 0
    assert len(data["results"]) == 0

def test_huggingface_adapter_unconfigured():
    # Without HF_TOKEN set, it should not invent mock predictions
    res = huggingface_adapter.infer(b"test_image_bytes")
    assert res["success"] is False
    assert res["status"] == "unconfigured"
    assert res["detected_area"]["is_supported"] is False
    assert len(res["predictions"]) == 0

