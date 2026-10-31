import io
import json
import pytest
from unittest.mock import patch, MagicMock
import httpx

from app.services.vision_engine import VisionModelAdapter, vision_engine
from app.services.recommendation_service import recommendation_engine
from app.services.triage_service import triage_service
from app.models.schemas import SymptomQuestionnaireInput
from app.tests.test_image_quality import create_synthetic_image


@pytest.fixture
def sample_symptoms():
    return SymptomQuestionnaireInput(
        anatomical_region="Volar Forearm",
        duration_days=5,
        itch_score=3,
        pain_score=1,
        is_spreading=False,
        bleeding_or_crusting=False,
        prior_chemical_exposure=False,
        consent_biometric=True,
        consent_disclaimer=True
    )


def test_missing_api_key_returns_explicitly_unavailable():
    """Verify that when GEMINI_API_KEY is missing, inference is marked unavailable and not fabricated."""
    adapter = VisionModelAdapter()
    adapter.api_key = ""  # Force unconfigured

    img_bytes = create_synthetic_image(sharp=True)
    result = adapter.infer(img_bytes)

    assert result["inference_status"] == "unavailable"
    assert result["is_inconclusive"] is True
    assert "offline" in result["inference_status_reason"].lower() or "unconfigured" in result["inference_status_reason"].lower()
    assert result["top_predictions"] == []
    assert result["observed_pattern_scores"] == {}
    assert result["detected_area"]["has_detection"] is False


def test_timeout_provider_error_handling():
    """Verify timeout logs and returns safe 'failed' status without leaking secrets."""
    adapter = VisionModelAdapter()
    adapter.api_key = "dummy-secret-test-key-do-not-leak"

    with patch("httpx.post", side_effect=httpx.TimeoutException("Connection timed out")):
        img_bytes = create_synthetic_image(sharp=True)
        result = adapter.infer(img_bytes)

    assert result["inference_status"] == "failed"
    assert result["is_inconclusive"] is True
    assert "timed out" in result["inference_status_reason"].lower()
    assert result["top_predictions"] == []
    assert result["observed_pattern_scores"] == {}
    # Secret must never be in user-facing reason
    assert "dummy-secret-test-key" not in result["inference_status_reason"]


def test_http_provider_error_handling():
    """Verify non-200 provider error returns safe 'failed' status without leaking response bodies."""
    adapter = VisionModelAdapter()
    adapter.api_key = "dummy-secret-key"

    mock_resp = MagicMock()
    mock_resp.status_code = 503
    mock_resp.text = "Internal Provider Server Overload"

    with patch("httpx.post", return_value=mock_resp):
        img_bytes = create_synthetic_image(sharp=True)
        result = adapter.infer(img_bytes)

    assert result["inference_status"] == "failed"
    assert result["is_inconclusive"] is True
    assert "error" in result["inference_status_reason"].lower() or "unavailable" in result["inference_status_reason"].lower()
    assert result["top_predictions"] == []


def test_malformed_json_response_handling():
    """Verify that invalid/malformed model output returns safe 'failed' status."""
    adapter = VisionModelAdapter()
    adapter.api_key = "dummy-key"

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "candidates": [{
            "content": {
                "parts": [{"text": "Sorry, this is plain text and not valid JSON"}]
            }
        }]
    }

    with patch("httpx.post", return_value=mock_resp):
        img_bytes = create_synthetic_image(sharp=True)
        result = adapter.infer(img_bytes)

    assert result["inference_status"] == "failed"
    assert result["is_inconclusive"] is True
    assert "malformed" in result["inference_status_reason"].lower()
    assert result["top_predictions"] == []


def test_model_inconclusive_response():
    """Verify model returning 'inconclusive' is treated as inconclusive, NOT as a valid category."""
    adapter = VisionModelAdapter()
    adapter.api_key = "dummy-key"

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "candidates": [{
            "content": {
                "parts": [{
                    "text": json.dumps({
                        "matched_category": "inconclusive",
                        "primary_concern": "Ambiguous skin finding",
                        "observed_patterns": ["mild redness"],
                        "bounding_box": None,
                        "confidence_assessment": "Inconclusive",
                        "uncertainty_rationale": "Pattern does not match supported condition benchmarks."
                    })
                }]
            }
        }]
    }

    with patch("httpx.post", return_value=mock_resp):
        img_bytes = create_synthetic_image(sharp=True)
        result = adapter.infer(img_bytes)

    assert result["inference_status"] == "inconclusive"
    assert result["is_inconclusive"] is True
    assert result["top_predictions"] == []
    assert result["observed_pattern_scores"] == {}


def test_successful_distinct_model_categories():
    """Verify distinct model categories produce distinct non-uniform classifications."""
    adapter = VisionModelAdapter()
    adapter.api_key = "dummy-key"
    img_bytes = create_synthetic_image(sharp=True)

    # 1. Psoriasis
    mock_psoriasis = MagicMock()
    mock_psoriasis.status_code = 200
    mock_psoriasis.json.return_value = {
        "candidates": [{
            "content": {
                "parts": [{
                    "text": json.dumps({
                        "matched_category": "psoriasis",
                        "primary_concern": "Scaly Plaque Pattern",
                        "observed_patterns": ["silvery scale", "erythematous plaque"],
                        "bounding_box": {"ymin": 100, "xmin": 100, "ymax": 500, "xmax": 500},
                        "confidence_assessment": "High",
                        "uncertainty_rationale": "Visual similarity to psoriasis plaque."
                    })
                }]
            }
        }]
    }

    with patch("httpx.post", return_value=mock_psoriasis):
        result_psoriasis = adapter.infer(img_bytes)

    assert result_psoriasis["inference_status"] == "successful"
    assert result_psoriasis["is_inconclusive"] is False
    assert result_psoriasis["top_predictions"][0][0] == "psoriasis"
    assert result_psoriasis["detected_area"]["has_detection"] is True

    # 2. Acne Vulgaris
    mock_acne = MagicMock()
    mock_acne.status_code = 200
    mock_acne.json.return_value = {
        "candidates": [{
            "content": {
                "parts": [{
                    "text": json.dumps({
                        "matched_category": "acne_vulgaris",
                        "primary_concern": "Inflammatory Papules",
                        "observed_patterns": ["papules", "comedones"],
                        "bounding_box": None,
                        "confidence_assessment": "Moderate",
                        "uncertainty_rationale": "Visual similarity to acne lesions."
                    })
                }]
            }
        }]
    }

    with patch("httpx.post", return_value=mock_acne):
        result_acne = adapter.infer(img_bytes)

    assert result_acne["inference_status"] == "successful"
    assert result_acne["is_inconclusive"] is False
    assert result_acne["top_predictions"][0][0] == "acne_vulgaris"

    # Distinct categories must produce distinct results
    assert result_psoriasis["top_predictions"][0][0] != result_acne["top_predictions"][0][0]


def test_failed_inference_never_produces_ranked_possible_conditions(sample_symptoms):
    """
    CRITICAL REGRESSION:
    Failed or inconclusive visual inference must NEVER populate ranked condition cards
    based on symptom defaults or uniform scores.
    """
    failed_visual = {
        "inference_status": "failed",
        "inference_status_reason": "Visual analysis service timed out.",
        "is_inconclusive": True,
        "observed_pattern_scores": {},
        "calibrated_probabilities": {},
        "top_predictions": [],
        "detected_area": {"has_detection": False, "bounding_box": None},
        "uncertainty_metrics": {"is_out_of_distribution": True, "uncertainty_level": "Inconclusive"}
    }

    pathway = triage_service.determine_care_pathway(
        symptoms=sample_symptoms,
        visual_findings=failed_visual,
        is_quality_acceptable=True
    )

    assessment = recommendation_engine.generate_clinical_assessment(
        symptoms=sample_symptoms,
        visual_findings=failed_visual,
        triage_pathway=pathway,
        is_quality_acceptable=True
    )

    assert assessment.is_inconclusive is True
    assert assessment.inference_status == "failed"
    assert assessment.possible_conditions == []  # Empty! No fake condition cards
    assert assessment.primary_condition == "Inconclusive Visual Observation"
    assert "Image analysis unavailable" in assessment.main_finding
    assert "timed out" in assessment.inconclusive_reason.lower()


def test_emergency_override_with_failed_inference():
    """
    CRITICAL CLINICAL SAFETY RULE:
    When emergency systemic symptoms are reported, Tier 3 emergency escalation
    MUST occur even if the visual inference failed or timed out!
    """
    emergency_symptoms = SymptomQuestionnaireInput(
        anatomical_region="Face / Neck",
        duration_days=1,
        itch_score=8,
        pain_score=4,
        is_spreading=True,
        has_facial_or_throat_swelling=True,
        has_breathing_difficulty=True,
        consent_biometric=True,
        consent_disclaimer=True
    )

    failed_visual = {
        "inference_status": "failed",
        "inference_status_reason": "Visual analysis service timed out.",
        "is_inconclusive": True,
        "observed_pattern_scores": {},
        "calibrated_probabilities": {},
        "top_predictions": []
    }

    pathway = triage_service.determine_care_pathway(
        symptoms=emergency_symptoms,
        visual_findings=failed_visual,
        is_quality_acceptable=True
    )

    # Emergency escalation must succeed
    assert pathway["triage_tier"] == 3
    assert pathway["emergency_warning_detected"] is True
    assert pathway["urgency_badge_color"] == "crimson"
    assert "Seek Immediate Emergency Care" in pathway["recommended_timeline"]

    assessment = recommendation_engine.generate_clinical_assessment(
        symptoms=emergency_symptoms,
        visual_findings=failed_visual,
        triage_pathway=pathway,
        is_quality_acceptable=True
    )

    assert assessment.triage_tier == 3
    assert assessment.emergency_warning_detected is True
    assert assessment.is_inconclusive is True
    assert assessment.care_level == "Seek urgent medical care"
    assert assessment.possible_conditions == []


def test_api_regression_failed_inference_is_explicitly_inconclusive(client):
    """
    End-to-end API test:
    Without an active external model, the API response must be explicitly inconclusive
    and must not return ordinary condition matches like 'Contact Dermatitis'.
    """
    # 1. Register user
    reg = client.post("/api/auth/register", json={
        "email": "inconclusive.test@example.com",
        "password": "Password123!",
        "full_name": "Inconclusive Patient",
        "consent_biometric": True,
        "consent_disclaimer": True
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Upload image (no Gemini key in test environment)
    image_bytes = create_synthetic_image(sharp=True)
    symptoms = {
        "anatomical_region": "Arm",
        "duration_days": 3,
        "itch_score": 2,
        "pain_score": 0,
        "consent_biometric": True,
        "consent_disclaimer": True
    }
    files = {"file": ("spot.jpg", io.BytesIO(image_bytes), "image/jpeg")}
    data = {
        "symptoms_json": json.dumps(symptoms),
        "anatomical_region": "Arm",
        "consent_biometric": "true",
        "consent_disclaimer": "true"
    }

    res = client.post("/api/skin/analyze", files=files, data=data, headers=headers)
    assert res.status_code == 200
    res_data = res.json()
    triage = res_data["triage"]

    # Verify explicitly inconclusive
    assert triage["is_inconclusive"] is True
    assert triage["inference_status"] in ("unavailable", "inconclusive", "failed")
    assert triage["possible_conditions"] == []  # Crucial: no fake ranked conditions
    assert triage["primary_condition"] == "Inconclusive Visual Observation"
    assert "inconclusive" in triage["main_finding"].lower() or "unavailable" in triage["main_finding"].lower()

    # Retrieve via GET and verify persistence
    assessment_id = res_data["id"]
    get_res = client.get(f"/api/skin/assessment/{assessment_id}", headers=headers)
    assert get_res.status_code == 200
    get_triage = get_res.json()["triage"]
    assert get_triage["is_inconclusive"] is True
    assert get_triage["possible_conditions"] == []
    assert get_triage["primary_condition"] == "Inconclusive Visual Observation"

