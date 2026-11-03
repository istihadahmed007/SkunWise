import io
import json
import numpy as np
from PIL import Image, ImageFilter
from fastapi.testclient import TestClient
from app.main import app
from app.services.image_quality import evaluate_image_quality
from app.services.vision_engine import SkinRegionDetector, vision_engine
from app.services.recommendation_service import recommendation_engine
from app.models.schemas import SymptomQuestionnaireInput


def create_dermoscopy_fixture(has_lesion: bool = True) -> bytes:
    """Simulates a clinical dermoscopy macro photograph with a circular black border."""
    arr = np.zeros((350, 350, 3), dtype=np.uint8)
    yy, xx = np.ogrid[:350, :350]
    # Circular aperture
    aperture = (xx - 175)**2 + (yy - 175)**2 <= 140**2
    # Skin area inside aperture (Caucasian to Asian tone)
    arr[aperture] = [190, 145, 120]
    
    # Add skin micro-texture
    noise = np.random.RandomState(42).randint(-10, 10, (350, 350, 3)).astype(np.int16)
    arr[aperture] = np.clip(arr[aperture].astype(np.int16) + noise[aperture], 0, 255).astype(np.uint8)

    if has_lesion:
        # Irregular pigmented lesion in center
        lesion_mask = (xx - 175)**2 + (yy - 175)**2 <= 45**2
        arr[lesion_mask] = [75, 45, 38]

    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=92)
    return buf.getvalue()


def create_erythematous_plaque_fixture() -> bytes:
    """Simulates a close-up medical photograph of an inflammatory plaque (e.g. psoriasis/eczema)."""
    arr = np.zeros((300, 300, 3), dtype=np.uint8)
    # Background clinical sheet / pale backdrop
    arr[:] = [210, 215, 220]
    
    # Large inflamed lesion covering 70% of the image
    yy, xx = np.ogrid[:300, :300]
    plaque = (xx - 150)**2 + (yy - 150)**2 <= 110**2
    arr[plaque] = [185, 65, 75]  # Active erythema

    # Scaling in center
    scale = (xx - 150)**2 + (yy - 150)**2 <= 40**2
    arr[scale] = [225, 210, 205]

    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


def test_downloaded_dermoscopy_with_black_border_not_rejected():
    """1. Dermoscopy photograph with black borders passes regional quality check."""
    dermo_bytes = create_dermoscopy_fixture(has_lesion=True)
    
    # Region-aware evaluation must NOT fail lighting because of the black circular border
    img_arr = np.array(Image.open(io.BytesIO(dermo_bytes)).resize((256, 256)), dtype=np.float32)
    skin_mask = SkinRegionDetector.get_dermatological_tissue_mask(img_arr)
    assert np.any(skin_mask), "Should detect skin or lesion inside dermoscopy aperture"

    quality = evaluate_image_quality(dermo_bytes, skin_mask=skin_mask)
    assert quality["is_acceptable"] is True, "Dermoscopy with black border should be acceptable"
    assert quality["quality_tier"] in ("PASS", "WARNING")
    assert "Fail (Underexposed" not in quality["lighting_status"]


def test_close_up_lesion_photograph_accepted_by_skin_detector():
    """2. Close-up lesion taking majority of image is recognized as valid dermatological tissue."""
    plaque_bytes = create_erythematous_plaque_fixture()
    arr = np.array(Image.open(io.BytesIO(plaque_bytes)).resize((256, 256)), dtype=np.float32)
    is_skin, coverage, metrics = SkinRegionDetector.evaluate_skin_presence(arr)

    assert is_skin is True, "Close-up clinical lesion must be accepted as dermatological tissue"
    assert coverage > 0.05
    assert metrics["skin_detected"] is True
    assert metrics["detection_status"] in ("DETECTED", "PARTIAL")


def test_quality_warning_preserves_model_predictions():
    """3. Quality WARNING proceeds with inference without wiping out condition matches."""
    # Create an image with acceptable focus but mild exposure deviation (WARNING tier)
    arr = np.full((300, 300, 3), [200, 150, 130], dtype=np.uint8)
    # Add moderate reflection glare on skin (~20% glare)
    arr[110:210, 110:210] = 255
    buf = io.BytesIO()
    Image.fromarray(arr).save(buf, format="JPEG")
    warning_img_bytes = buf.getvalue()

    quality = evaluate_image_quality(warning_img_bytes)
    assert quality["is_acceptable"] is True
    assert quality["quality_tier"] == "WARNING"

    # Simulate inference output with condition match
    visual_findings = {
        "model_version": "DINOv2-SkinDisease-v2.0",
        "backend": "DINOv2",
        "inference_status": "successful",
        "is_inconclusive": False,
        "calibrated_probabilities": {"eczema_contact_dermatitis": 0.72, "psoriasis": 0.15},
        "top_predictions": [("eczema_contact_dermatitis", 0.72), ("psoriasis", 0.15)],
        "uncertainty_metrics": {"uncertainty_level": "Moderate", "uncertainty_rationale": "Clear pattern overlap with mild glare."},
        "quality_metrics": quality,
        "detected_area": {"has_detection": True, "bounding_box": {"ymin": 50, "xmin": 50, "ymax": 250, "xmax": 250}, "label": "Eczema"}
    }

    symptoms = SymptomQuestionnaireInput(
        anatomical_region="Volar Forearm",
        itch_score=7,
        duration_days=10
    )
    triage_pathway = {
        "triage_tier": 2,
        "triage_name": "Medical Assessment Recommended",
        "recommended_timeline": "1–2 Weeks",
        "urgency_badge_color": "amber",
        "rationale": "Moderate persistent dermatitis pattern."
    }

    triage_result = recommendation_engine.generate_clinical_assessment(
        symptoms=symptoms,
        visual_findings=visual_findings,
        triage_pathway=triage_pathway,
        is_quality_acceptable=quality["is_acceptable"]
    )

    # CRITICAL: Condition matches must NOT be wiped out for quality warnings!
    assert triage_result.is_inconclusive is False
    assert len(triage_result.possible_conditions) > 0
    assert triage_result.possible_conditions[0].condition_id == "eczema_contact_dermatitis"
    # A cautionary note should be present in diagnostic gaps
    assert any("quality" in gap.lower() for gap in triage_result.diagnostic_gaps)


def test_reference_image_mode_separation():
    """4. Reference Image mode evaluates image without personal symptom attribution."""
    client = TestClient(app)
    dermo_bytes = create_dermoscopy_fixture(has_lesion=True)

    # Submit with analysis_mode = "reference"
    res = client.post(
        "/api/skin/analyze",
        files={"file": ("reference_atlas_lesion.jpg", dermo_bytes, "image/jpeg")},
        data={
            "symptoms_json": json.dumps({
                "analysis_mode": "reference",
                "reference_source_url": "https://dermnetnz.org/images/atlas-example",
                "consent_biometric": True,
                "consent_disclaimer": True
            }),
            "anatomical_region": "Lower Extremity",
            "analysis_mode": "reference",
            "reference_source_url": "https://dermnetnz.org/images/atlas-example"
        }
    )

    assert res.status_code == 200
    data = res.json()
    assert data["analysis_mode"] == "reference"
    assert data["reference_source_url"] == "https://dermnetnz.org/images/atlas-example"
    assert "Educational Reference" in data["triage"]["triage_name"]

    # Check multi-status pipeline outputs
    pipeline = data["pipeline_status"]
    assert pipeline is not None
    assert pipeline["image_validation_status"] == "VALID"
    assert pipeline["image_quality_status"] in ("PASS", "WARNING")
    assert pipeline["skin_detection_status"] in ("DETECTED", "PARTIAL")


def test_fitzpatrick_spectrum_phototypes_accepted():
    """5. Evaluates multi-tone phototype acceptance from Fitzpatrick I (fair) to VI (dark)."""
    tones = [
        ("Fitzpatrick_I", [235, 218, 208]),
        ("Fitzpatrick_III", [190, 145, 115]),
        ("Fitzpatrick_IV", [160, 110, 85]),
        ("Fitzpatrick_VI", [70, 45, 35]),
    ]
    for name, rgb in tones:
        arr = np.full((128, 128, 3), rgb, dtype=np.float32)
        # Add slight natural gradient
        arr += np.random.RandomState(42).uniform(-4, 4, arr.shape)
        arr = np.clip(arr, 0, 255)
        is_skin, coverage, _ = SkinRegionDetector.evaluate_skin_presence(arr)
        assert is_skin is True, f"{name} must be accepted as human skin"
        assert coverage > 0.85
