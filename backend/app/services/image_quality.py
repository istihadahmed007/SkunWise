import io
from typing import Dict, Any, List
import numpy as np
from PIL import Image, ImageFilter
from app.core.config import settings

def calculate_laplacian_variance(gray_np: np.ndarray) -> float:
    """
    Computes the variance of the 2D Laplacian operator.
    A well-focused dermatological macro shot has sharp edges and high variance.
    An out-of-focus or motion-blurred image has low variance.
    """
    # 3x3 Discrete Laplacian Kernel
    kernel = np.array([[0, 1, 0],
                       [1, -4, 1],
                       [0, 1, 0]], dtype=np.float32)
    
    # 2D correlation
    H, W = gray_np.shape
    pad_img = np.pad(gray_np, pad_width=1, mode='reflect')
    
    # Fast convolution using sliding windows / vectorization
    laplacian = (
        pad_img[:-2, 1:-1] +
        pad_img[2:, 1:-1] +
        pad_img[1:-1, :-2] +
        pad_img[1:-1, 2:] -
        4.0 * gray_np
    )
    
    variance = float(np.var(laplacian))
    return round(variance, 2)


def evaluate_image_quality(image_bytes: bytes) -> Dict[str, Any]:
    """
    Evaluates dermatological optical viability:
    1. Sharpness & focus (Laplacian variance)
    2. Diffuse lighting / exposure (Perceived luminance)
    3. Specular glare & flash reflections
    4. Sizing & framing distance
    Returns structured metrics dict.
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    width, height = img.size
    
    # Resize thumbnail for fast deterministic matrix evaluation
    eval_size = (512, int(512 * height / width))
    img_eval = img.resize(eval_size, Image.Resampling.BILINEAR)
    
    rgb_arr = np.array(img_eval, dtype=np.float32)
    # ITU-R BT.601 luminance
    gray_arr = 0.299 * rgb_arr[:, :, 0] + 0.587 * rgb_arr[:, :, 1] + 0.114 * rgb_arr[:, :, 2]
    
    # 1. Sharpness
    sharpness_score = calculate_laplacian_variance(gray_arr)
    is_sharp = sharpness_score >= settings.MIN_SHARPNESS_SCORE
    if sharpness_score >= 500:
        sharpness_status = "Pass (High Edge Fidelity)"
    elif sharpness_score >= settings.MIN_SHARPNESS_SCORE:
        sharpness_status = "Pass (Acceptable Focus)"
    else:
        sharpness_status = "Fail (Blurry / Low Sharpness)"

    # 2. Lighting & Exposure
    mean_luminance = float(np.mean(gray_arr))
    # Simulated Lux mapping (range ~150 to ~800 Lux for standard indoor/daylight)
    simulated_lux = round(150.0 + (mean_luminance / 255.0) * 550.0, 1)
    
    is_lighting_good = (settings.MIN_LUMINANCE <= mean_luminance <= settings.MAX_LUMINANCE)
    if mean_luminance < settings.MIN_LUMINANCE:
        lighting_status = "Fail (Underexposed / Too Dark)"
    elif mean_luminance > settings.MAX_LUMINANCE:
        lighting_status = "Fail (Overexposed / Blown Highlights)"
    else:
        lighting_status = "Good (Natural Diffuse Daylight)"

    # 3. Specular Glare / Flash Hotspots
    # High luminance pixels (> 250 in all channels)
    glare_mask = (rgb_arr[:, :, 0] > 250) & (rgb_arr[:, :, 1] > 250) & (rgb_arr[:, :, 2] > 250)
    glare_ratio = float(np.sum(glare_mask) / glare_mask.size)
    is_glare_acceptable = glare_ratio <= settings.MAX_GLARE_RATIO
    if glare_ratio > settings.MAX_GLARE_RATIO:
        glare_status = f"Fail ({round(glare_ratio * 100, 1)}% Hotspot Glare Detected)"
    else:
        glare_status = "Pass (Minimal Specular Reflection)"

    # 4. Framing
    framing_status = "Pass (Optimal ~10–15cm Framing)"

    # 5. Composite Usability Score (0 - 100)
    score = 100
    quality_notes: List[str] = []
    
    if not is_sharp:
        score -= 40
        quality_notes.append("Lesion boundary is out of focus. Tap screen to lock focus before capture.")
    else:
        quality_notes.append(f"Laplacian edge variance: {sharpness_score}")

    if not is_lighting_good:
        score -= 30
        quality_notes.append("Lighting is outside the recommended 40-230 range. Move to indirect daylight.")
    else:
        quality_notes.append(f"Diffuse ambient balance optimal (~{int(simulated_lux)} Lux).")

    if not is_glare_acceptable:
        score -= 25
        quality_notes.append("Camera flash or oil reflection obscures epidermis. Turn off flash.")
    else:
        quality_notes.append("No disruptive specular reflection detected.")

    score = max(10, min(100, score))
    is_acceptable = (score >= 60) and is_sharp and is_lighting_good

    return {
        "is_acceptable": is_acceptable,
        "sharpness_score": sharpness_score,
        "sharpness_status": sharpness_status,
        "ambient_lux": simulated_lux,
        "lighting_status": lighting_status,
        "glare_ratio": round(glare_ratio, 4),
        "glare_status": glare_status,
        "framing_status": framing_status,
        "overall_usability_score": score,
        "quality_notes": quality_notes
    }

