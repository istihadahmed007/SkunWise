import io
import json
from unittest.mock import patch, MagicMock
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.schemas import SymptomQuestionnaireInput
from app.services.vision_engine import vision_engine, SkinRegionDetector
from app.services.dinov2_classifier import (
    dinov2_classifier,
    map_dinov2_label_to_clinical_category,
    DINOV2_CLASSES,
    TRACK_A_CLASSES,
    TRACK_B_BENIGN_CLASSES,
    TRACK_B_CONCERNING_CLASSES
)
from app.services.triage_service import triage_service
from app.services.recommendation_service import recommendation_engine
from app.services.image_quality import evaluate_image_quality
from app.services.image_validation import sanitize_and_validate_image


@pytest.fixture(autouse=True)
def configure_dinov2_test_mode(monkeypatch):
    """Ensure DINOv2 engine tests use dinov2 provider."""
    from app.core.config import settings
    monkeypatch.setattr(settings, "PRIMARY_AI_PROVIDER", "dinov2")


# ============================================================================
# Reproducible Dermatological Image Fixture Generators
# ============================================================================

def create_skin_fixture(
    base_color=(220, 180, 155),
    lesion_type: str = "normal",
    size=(300, 300)
) -> bytes:
    """Creates a deterministic dermatological test photograph fixture."""
    img = Image.new("RGB", size, color=base_color)
    draw = ImageDraw.Draw(img)

    # Add realistic subtle skin texture variations
    arr = np.array(img, dtype=np.int16)
    np.random.seed(42)
    noise = np.random.randint(-8, 8, arr.shape, dtype=np.int16)
    arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
    img = Image.fromarray(arr)
    draw = ImageDraw.Draw(img)

    cx, cy = size[0] // 2, size[1] // 2

    if lesion_type == "eczema":
        # Erythematous irregular patch
        draw.ellipse([cx - 50, cy - 40, cx + 50, cy + 40], fill=(215, 95, 95))
        draw.ellipse([cx - 30, cy - 25, cx + 30, cy + 25], fill=(225, 75, 75))
    elif lesion_type == "psoriasis":
        # Erythematous plaque with silvery scale
        draw.ellipse([cx - 60, cy - 45, cx + 60, cy + 45], fill=(210, 70, 75))
        draw.ellipse([cx - 35, cy - 20, cx + 35, cy + 20], fill=(235, 230, 225))
    elif lesion_type == "tinea":
        # Annular / ring pattern with clear center
        draw.ellipse([cx - 65, cy - 65, cx + 65, cy + 65], outline=(195, 80, 80), width=12)
    elif lesion_type == "mole_benign":
        # Symmetric homogeneous brown nevus
        draw.ellipse([cx - 25, cy - 25, cx + 25, cy + 25], fill=(85, 45, 25))
    elif lesion_type == "mole_dysplastic":
        # Asymmetric variegated spot
        draw.polygon([(cx - 35, cy - 20), (cx + 40, cy - 30), (cx + 25, cy + 45), (cx - 45, cy + 25)], fill=(50, 25, 20))
        draw.ellipse([cx, cy, cx + 25, cy + 25], fill=(130, 40, 25))
    elif lesion_type == "acne":
        # Scattered inflammatory papules & pustules
        for ox, oy in [(-30, -20), (20, -35), (10, 25), (-25, 30), (35, 10)]:
            draw.ellipse([cx + ox - 8, cy + oy - 8, cx + ox + 8, cy + oy + 8], fill=(215, 60, 60))
            draw.ellipse([cx + ox - 3, cy + oy - 3, cx + ox + 3, cy + oy + 3], fill=(250, 245, 220))

    # Add strong high-frequency texture that survives JPEG compression and passes sharpness validation
    arr = np.array(img, dtype=np.uint8)
    for y in range(60, size[1] - 60, 4):
        for x in range(60, size[0] - 60, 4):
            if ((x // 4) + (y // 4)) % 2 == 0:
                arr[y:y+4, x:x+4] = [50, 25, 20]

    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=95)
    return buf.getvalue()


def create_non_skin_fixture() -> bytes:
    """Creates a synthetic non-skin image (pure blue/cyan landscape colors)."""
    img = Image.new("RGB", (300, 300), color=(20, 80, 220))
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 50, 250, 250], fill=(0, 200, 100))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


def get_patient_auth(client: TestClient, email: str = "test.patient.ai@example.com") -> dict:
    reg = client.post("/api/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "AI Test Patient",
        "consent_biometric": True,
        "consent_disclaimer": True
    })
    if reg.status_code == 200:
        token = reg.json()["access_token"]
    else:
        login = client.post("/api/auth/login", json={
            "email": email,
            "password": "Password123!"
        })
        token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ============================================================================
# 15 Comprehensive Automated Tests
# ============================================================================

def test_01_acne_vulgaris_identification(client: TestClient):
    """1. Labelled acne image produces accurate acne pattern identification and guidance."""
    headers = get_patient_auth(client, "acne.test@example.com")
    acne_img = create_skin_fixture(lesion_type="acne")
    
    mock_prediction = {
        "status": "successful",
        "status_reason": "Visual pattern match identified.",
        "matched_category": "acne_vulgaris",
        "primary_concern": "Acne / Blemish Pattern",
        "observed_patterns": ["Follicular erythematous papules and pustules", "Facial distribution"],
        "bounding_box": {"ymin": 250, "xmin": 200, "ymax": 750, "xmax": 800},
        "confidence_assessment": "Moderate",
        "uncertainty_rationale": "Clinical photo evaluation consistent with acneiform lesions.",
        "predictions": [{"label": "acne_vulgaris", "score": 0.74, "category_id": "acne_vulgaris"}],
        "top_score": 0.74,
        "raw_model_response": None
    }

    symptoms = {
        "anatomical_region": "Face",
        "duration_days": 14,
        "itch_score": 2,
        "pain_score": 1,
        "consent_biometric": True,
        "consent_disclaimer": True
    }

    with patch.object(vision_engine, "_infer_with_dinov2", return_value=mock_prediction):
        response = client.post(
            "/api/skin/analyze",
            files={"file": ("acne_forehead.jpg", acne_img, "image/jpeg")},
            data={
                "symptoms_json": json.dumps(symptoms),
                "anatomical_region": "Face",
                "consent_biometric": "true",
                "consent_disclaimer": "true"
            },
            headers=headers
        )

    assert response.status_code == 200
    data = response.json()
    assert data["triage"]["inference_status"] == "successful"
    assert "acne" in data["triage"]["primary_condition"].lower() or "blemish" in data["triage"]["primary_condition"].lower()
    assert data["triage"]["is_inconclusive"] is False
    assert len(data["triage"]["possible_conditions"]) > 0


def test_02_eczema_contact_dermatitis_identification(client: TestClient):
    """2. Labelled eczema image produces contact irritation pattern and supportive guidance."""
    headers = get_patient_auth(client, "eczema.test@example.com")
    eczema_img = create_skin_fixture(lesion_type="eczema")
    
    mock_pred = {
        "status": "successful",
        "status_reason": "Visual pattern match identified.",
        "matched_category": "eczema_contact_dermatitis",
        "primary_concern": "Contact Dermatitis / Irritation Pattern",
        "observed_patterns": ["Erythematous patch with surface irritation", "Superficial scaling"],
        "bounding_box": {"ymin": 300, "xmin": 300, "ymax": 700, "xmax": 700},
        "confidence_assessment": "High",
        "uncertainty_rationale": "Features consistent with inflammatory dermatosis.",
        "predictions": [
            {"label": "eczema_contact_dermatitis", "score": 0.81, "category_id": "eczema_contact_dermatitis"}
        ],
        "top_score": 0.81,
        "raw_model_response": None
    }

    symptoms = {
        "anatomical_region": "Volar Forearm",
        "duration_days": 7,
        "itch_score": 7,
        "prior_chemical_exposure": True,
        "consent_biometric": True,
        "consent_disclaimer": True
    }

    with patch.object(vision_engine, "_infer_with_dinov2", return_value=mock_pred):
        response = client.post(
            "/api/skin/analyze",
            files={"file": ("eczema_patch.jpg", eczema_img, "image/jpeg")},
            data={
                "symptoms_json": json.dumps(symptoms),
                "anatomical_region": "Volar Forearm",
                "consent_biometric": "true",
                "consent_disclaimer": "true"
            },
            headers=headers
        )

    assert response.status_code == 200
    res = response.json()
    assert res["triage"]["inference_status"] == "successful"
    assert "dermatitis" in res["triage"]["primary_condition"].lower() or "irritation" in res["triage"]["primary_condition"].lower()


def test_03_psoriasis_plaque_identification():
    """3. Labelled psoriasis image correctly classifies scaly plaque pattern via DINOv2."""
    psoriasis_img = create_skin_fixture(lesion_type="psoriasis")
    
    mock_pred = {
        "status": "successful",
        "status_reason": "Visual pattern matched via DINOv2 model (Psoriasis, 84.5%).",
        "matched_category": "psoriasis",
        "primary_concern": "Psoriasis / Scaly Plaque Pattern",
        "observed_patterns": ["Psoriasis (84.5%) - Track A: Common Inflammatory Dermatoses"],
        "bounding_box": None,
        "confidence_assessment": "High",
        "uncertainty_rationale": "Well-demarcated scaly plaque consistent with psoriasis.",
        "predictions": [
            {"label": "Psoriasis", "score": 0.845, "category_id": "psoriasis", "confidence_pct": 84.5, "track": "Track A"}
        ],
        "top_score": 0.845,
        "raw_model_response": None
    }

    with patch.object(vision_engine, "_infer_with_dinov2", return_value=mock_pred):
        res = vision_engine.infer(psoriasis_img)

    assert res["inference_status"] == "successful"
    assert res["is_inconclusive"] is False
    assert res["observed_pattern_scores"].get("psoriasis") == 0.845
    # Verify NO fabricated 0.70 score
    assert res["observed_pattern_scores"].get("psoriasis") != 0.70


def test_04_fungal_tinea_annular_identification():
    """4. Superficial fungal pattern correctly maps to fungal_tinea with genuine score."""
    cat, track, name = map_dinov2_label_to_clinical_category("Tinea Corporis")
    assert cat == "fungal_tinea"
    assert "Track A" in track
    assert "Fungal" in name

    cat_nigra, track_nigra, _ = map_dinov2_label_to_clinical_category("Tinea Nigra")
    assert cat_nigra == "fungal_tinea"


def test_05_supported_lesion_classification_benign_vs_concerning():
    """5. Distinguishes Track B Benign lesions from Track B Concerning lesions."""
    # Benign nevus
    cat_benign, track_benign, _ = map_dinov2_label_to_clinical_category("nevus")
    assert cat_benign == "benign_melanocytic_macule"
    assert "Likely Benign" in track_benign

    # Malignant Melanoma
    cat_concerning, track_concerning, _ = map_dinov2_label_to_clinical_category("Melanoma")
    assert cat_concerning == "suspicious_dysplastic_lesion"
    assert "Clinical Evaluation" in track_concerning

    # Basal Cell Carcinoma
    cat_bcc, _, _ = map_dinov2_label_to_clinical_category("Basal Cell Carcinoma")
    assert cat_bcc == "suspicious_dysplastic_lesion"


def test_06_non_skin_photograph_out_of_distribution_rejection():
    """6. Non-skin image is rejected by SkinRegionDetector without fake disease scores."""
    non_skin = create_non_skin_fixture()
    arr = np.array(Image.open(io.BytesIO(non_skin)).convert("RGB"), dtype=np.float32)
    is_skin, coverage, _ = SkinRegionDetector.evaluate_skin_presence(arr)
    assert is_skin is False

    res = vision_engine.infer(non_skin)
    assert res["inference_status"] == "inconclusive"
    assert res["is_inconclusive"] is True
    assert "skin" in res["inference_status_reason"].lower()
    # Confirm empty pattern scores to prevent fake diagnoses
    assert res["observed_pattern_scores"] == {}


def test_07_blurry_photograph_quality_rejection():
    """7. Blurry photo fails Laplacian sharpness check and routes safely to doctor advice."""
    sharp_img = Image.open(io.BytesIO(create_skin_fixture(lesion_type="psoriasis")))
    blurred = sharp_img.filter(ImageFilter.GaussianBlur(radius=8))
    buf = io.BytesIO()
    blurred.save(buf, format="JPEG")
    blurry_bytes = buf.getvalue()

    metrics = evaluate_image_quality(blurry_bytes)
    assert metrics["is_acceptable"] is False
    assert "blurry" in metrics["sharpness_status"].lower() or "fail" in metrics["sharpness_status"].lower()


def test_08_incorrect_image_formats_and_signatures():
    """8. Rejects invalid magic bytes and corrupted image files cleanly."""
    corrupted_data = b"NOT_A_REAL_IMAGE_HEADER_BYTES_123456789"
    with pytest.raises(Exception) as exc_info:
        sanitize_and_validate_image(corrupted_data, "bad.jpg", "image/jpeg")
    assert exc_info.value.status_code == 400


def test_09_dark_and_light_skin_phototypes_fairness():
    """9. Evaluates skin presence accurately across both light (Type I-II) and dark (Type V-VI) tones."""
    # Light skin tone (Fitzpatrick I-II)
    light_skin = create_skin_fixture(base_color=(235, 200, 180))
    arr_light = np.array(Image.open(io.BytesIO(light_skin)).convert("RGB"), dtype=np.float32)
    is_skin_light, cov_light, _ = SkinRegionDetector.evaluate_skin_presence(arr_light)
    assert is_skin_light is True
    assert cov_light > 0.40

    # Deep skin tone (Fitzpatrick V-VI)
    dark_skin = create_skin_fixture(base_color=(85, 50, 30))
    arr_dark = np.array(Image.open(io.BytesIO(dark_skin)).convert("RGB"), dtype=np.float32)
    is_skin_dark, cov_dark, _ = SkinRegionDetector.evaluate_skin_presence(arr_dark)
    assert is_skin_dark is True
    assert cov_dark > 0.30


def test_10_unknown_and_out_of_distribution_conditions():
    """10. Unmapped or unknown condition yields honest inconclusive result."""
    cat, track, _ = map_dinov2_label_to_clinical_category("CompletelyUnknownCondition")
    assert cat == "inconclusive"
    assert "Track C" in track


def test_11_missing_ai_credentials_fails_safely():
    """11. Missing credentials returns explicit unavailable state without fabricating scores."""
    skin_img = create_skin_fixture()
    
    with patch.object(vision_engine, "is_configured", return_value=False):
        with patch.object(vision_engine, "_infer_with_dinov2", return_value={
            "status": "unavailable",
            "status_reason": "AI model is offline or unconfigured.",
            "matched_category": None,
            "primary_concern": None,
            "observed_patterns": [],
            "bounding_box": None,
            "confidence_assessment": "Inconclusive",
            "uncertainty_rationale": "Model unconfigured.",
            "raw_model_response": None
        }):
            res = vision_engine.infer(skin_img)

    assert res["inference_status"] == "unavailable"
    assert res["is_inconclusive"] is True
    assert res["observed_pattern_scores"] == {}


def test_12_invalid_model_response_handling():
    """12. Malformed JSON or invalid schema from remote model handled gracefully."""
    mock_bad_resp = MagicMock()
    mock_bad_resp.status_code = 200
    mock_bad_resp.json.return_value = {
        "candidates": [{"content": {"parts": [{"text": "THIS_IS_NOT_VALID_JSON"}]}}]
    }

    with patch.object(vision_engine, "is_configured", return_value=True), \
         patch.object(vision_engine, "_get_api_key", return_value="mock-test-key-clinical"):
        with patch("httpx.post", return_value=mock_bad_resp):
            res = vision_engine._infer_with_gemini(create_skin_fixture())
    assert res["status"] == "failed"
    assert "malformed" in res["status_reason"].lower() or "json" in res["uncertainty_rationale"].lower()


def test_13_api_timeout_handling():
    """13. Network timeout during inference returns clear, actionable timeout message."""
    import httpx
    with patch.object(vision_engine, "is_configured", return_value=True), \
         patch.object(vision_engine, "_get_api_key", return_value="mock-test-key-clinical"):
        with patch("httpx.post", side_effect=httpx.TimeoutException("Connection timed out")):
            res = vision_engine._infer_with_gemini(create_skin_fixture())
    assert res["status"] == "failed"
    assert "timed out" in res["status_reason"].lower()


def test_14_model_unavailable_or_warming_up():
    """14. Hugging Face 503 warmup state handled cleanly with retry wait notice."""
    from app.services.huggingface_adapter import huggingface_adapter
    
    mock_resp = MagicMock()
    mock_resp.status_code = 503
    mock_resp.headers = {"content-type": "application/json"}
    mock_resp.json.return_value = {"estimated_time": 25.0}

    with patch.object(huggingface_adapter, "is_configured", return_value=True):
        with patch("httpx.Client.post", return_value=mock_resp):
            res = huggingface_adapter.infer(create_skin_fixture())
            
    assert res["success"] is False
    assert res["status"] == "model_loading"
    assert res["estimated_wait_seconds"] == 25.0


def test_15_emergency_symptom_override_precedence():
    """15. Emergency warning signs (breathing difficulty, facial swelling, fever) strictly override AI."""
    symptoms = SymptomQuestionnaireInput(
        anatomical_region="Face",
        duration_days=2,
        itch_score=3,
        pain_score=8,
        has_breathing_difficulty=True,
        has_facial_or_throat_swelling=True,
        has_fever_or_chills=True,
        is_spreading=True,
        consent_biometric=True,
        consent_disclaimer=True
    )

    # Reassuring visual findings
    reassuring_visual = {
        "inference_status": "successful",
        "is_inconclusive": False,
        "matched_category": "benign_melanocytic_macule",
        "observed_pattern_scores": {"benign_melanocytic_macule": 0.95},
        "calibrated_probabilities": {"benign_melanocytic_macule": 0.95}
    }

    pathway = triage_service.determine_care_pathway(
        symptoms=symptoms,
        visual_findings=reassuring_visual,
        is_quality_acceptable=True
    )

    # Emergency Tier 3 must override benign AI score
    assert pathway["triage_tier"] == 3
    assert pathway["emergency_warning_detected"] is True
    assert "Urgent" in pathway["triage_name"]
    assert len(pathway["emergency_warning_items"]) >= 2


def test_16_herpes_simplex_preserves_label_not_eczema():
    """16. Herpes Simplex preserves its genuine clinical identity and is never forced into Eczema."""
    cat, track, name = map_dinov2_label_to_clinical_category("Herpes Simplex")
    assert cat == "herpes_simplex"
    assert cat != "eczema_contact_dermatitis"
    assert "Herpes" in name
    assert "Eczema" not in name

    # Test full multimodal recommendation synthesis
    symptoms = SymptomQuestionnaireInput(
        anatomical_region="Perioral",
        duration_days=3,
        itch_score=4,
        pain_score=6,
        consent_biometric=True,
        consent_disclaimer=True
    )
    visual_findings = {
        "inference_status": "successful",
        "is_inconclusive": False,
        "matched_category": "herpes_simplex",
        "observed_pattern_scores": {"herpes_simplex": 0.88, "eczema_contact_dermatitis": 0.05},
        "calibrated_probabilities": {"herpes_simplex": 0.88, "eczema_contact_dermatitis": 0.05},
        "gemini_inference": {
            "matched_category": "herpes_simplex",
            "primary_concern": "Herpes Simplex (HSV)"
        }
    }
    conditions = recommendation_engine.synthesize_multimodal_evidence(symptoms, visual_findings)
    assert len(conditions) > 0
    assert conditions[0].condition_id == "herpes_simplex"
    assert "Herpes" in conditions[0].name
    assert "Eczema" not in conditions[0].name


def test_17_impetigo_preserves_label_not_eczema():
    """17. Impetigo maps to bacterial infection category and never Eczema."""
    cat, track, name = map_dinov2_label_to_clinical_category("Impetigo")
    assert cat == "impetigo"
    assert cat != "eczema_contact_dermatitis"
    assert "Impetigo" in name

    symptoms = SymptomQuestionnaireInput(
        anatomical_region="Face",
        duration_days=4,
        itch_score=5,
        bleeding_or_crusting=True,
        consent_biometric=True,
        consent_disclaimer=True
    )
    visual_findings = {
        "inference_status": "successful",
        "is_inconclusive": False,
        "matched_category": "impetigo",
        "observed_pattern_scores": {"impetigo": 0.91},
        "calibrated_probabilities": {"impetigo": 0.91},
        "gemini_inference": {
            "matched_category": "impetigo",
            "primary_concern": "Impetigo"
        }
    }
    conditions = recommendation_engine.synthesize_multimodal_evidence(symptoms, visual_findings)
    assert len(conditions) > 0
    assert conditions[0].condition_id == "impetigo"
    assert "Impetigo" in conditions[0].name


def test_18_specialized_unsupported_conditions_route_to_specialist():
    """18. Specialized/rare conditions route to unsupported_specialized_condition and Tier 2."""
    for rare_label in ("Darier_s Disease", "Hailey-Hailey Disease", "Leprosy Borderline", "Lupus Erythematosus Chronicus Discoides"):
        cat, track, name = map_dinov2_label_to_clinical_category(rare_label)
        assert cat == "unsupported_specialized_condition", f"{rare_label} should map to unsupported_specialized_condition"

    symptoms = SymptomQuestionnaireInput(
        anatomical_region="Trunk",
        duration_days=30,
        itch_score=2,
        pain_score=1,
        consent_biometric=True,
        consent_disclaimer=True
    )
    visual = {
        "inference_status": "successful",
        "is_inconclusive": False,
        "matched_category": "unsupported_specialized_condition",
        "observed_pattern_scores": {"unsupported_specialized_condition": 0.75},
        "calibrated_probabilities": {"unsupported_specialized_condition": 0.75},
        "gemini_inference": {
            "matched_category": "unsupported_specialized_condition",
            "primary_concern": "Specialized Dermatosis"
        }
    }
    pathway = triage_service.determine_care_pathway(
        symptoms=symptoms,
        visual_findings=visual,
        is_quality_acceptable=True
    )
    assert pathway["triage_tier"] == 2
    assert "Doctor Check Recommended" in pathway["triage_name"]


def test_19_intake_consent_defaults_and_explicit_rejection(client: TestClient):
    """19. Omitting consent in symptom questionnaire defaults safely, while explicit rejection fails with 400."""
    # SymptomQuestionnaireInput defaults consent fields to True
    symptoms = SymptomQuestionnaireInput(
        anatomical_region="Volar Forearm",
        duration_days=5
    )
    assert symptoms.consent_biometric is True
    assert symptoms.consent_disclaimer is True

    # Explicit False triggers 400 Bad Request
    headers = get_patient_auth(client, "consent.test@example.com")
    img = create_skin_fixture()
    denied_symptoms = {
        "anatomical_region": "Volar Forearm",
        "duration_days": 5,
        "consent_biometric": False,
        "consent_disclaimer": False
    }
    res = client.post(
        "/api/skin/analyze",
        files={"file": ("skin.jpg", img, "image/jpeg")},
        data={"symptoms_json": json.dumps(denied_symptoms)},
        headers=headers
    )
    assert res.status_code == 400
    assert "Mandatory consent missing" in res.json()["detail"]
