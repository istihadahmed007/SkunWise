import io
import numpy as np
from PIL import Image, ImageFilter
from app.services.image_quality import evaluate_image_quality, calculate_laplacian_variance
from app.services.image_validation import sanitize_and_validate_image

def create_synthetic_image(sharp: bool = True, dark: bool = False, glare: bool = False) -> bytes:
    """Creates a synthetic test image with controlled optical properties."""
    arr = np.zeros((300, 300, 3), dtype=np.uint8)
    
    if dark:
        arr[:] = 20  # Under 40 luminance
    else:
        # Base skin-like tone
        arr[:, :, 0] = 205
        arr[:, :, 1] = 160
        arr[:, :, 2] = 140
        
        # Add high-contrast texture / edges in center for sharpness
        if sharp:
            # High-frequency alternating checkerboard / grid texture
            for y in range(80, 220, 4):
                for x in range(80, 220, 4):
                    if ((x // 4) + (y // 4)) % 2 == 0:
                        arr[y:y+4, x:x+4] = [50, 20, 10]
        else:
            # Completely flat with zero gradient
            arr[:] = 180

    if glare:
        # Large central glare spot (> 250 in all channels)
        arr[100:220, 100:220] = 255

    img = Image.fromarray(arr)
    if not sharp:
        img = img.filter(ImageFilter.GaussianBlur(radius=8))

    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_sharp_image_passes_quality_check():
    sharp_bytes = create_synthetic_image(sharp=True, dark=False, glare=False)
    metrics = evaluate_image_quality(sharp_bytes)
    assert metrics["sharpness_score"] > 50
    assert metrics["lighting_status"].startswith("Good")
    assert metrics["is_acceptable"] is True
    assert metrics["overall_usability_score"] >= 60


def test_blurry_image_detected():
    blurry_bytes = create_synthetic_image(sharp=False, dark=False, glare=False)
    metrics = evaluate_image_quality(blurry_bytes)
    assert metrics["sharpness_score"] < 120
    assert "Fail" in metrics["sharpness_status"]
    assert metrics["is_acceptable"] is False


def test_dark_image_detected():
    dark_bytes = create_synthetic_image(sharp=True, dark=True, glare=False)
    metrics = evaluate_image_quality(dark_bytes)
    assert "Underexposed" in metrics["lighting_status"]
    assert metrics["is_acceptable"] is False


def test_exif_stripping_and_sanitization():
    raw_bytes = create_synthetic_image(sharp=True)
    clean_bytes, sha_hash, w, h = sanitize_and_validate_image(raw_bytes, "test.jpg", "image/jpeg")
    assert len(clean_bytes) > 0
    assert len(sha_hash) == 64
    assert w == 300
    assert h == 300
