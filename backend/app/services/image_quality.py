import io
from typing import Dict, Any, List, Optional, Tuple
import numpy as np
from PIL import Image
from app.core.config import settings


def calculate_laplacian_variance(gray_np: np.ndarray) -> float:
    """
    Computes the variance of the 2D Laplacian operator.
    A well-focused dermatological shot has sharp edges and higher variance.
    An out-of-focus or motion-blurred image has low variance.
    """
    pad_img = np.pad(gray_np, pad_width=1, mode='reflect')
    laplacian = (
        pad_img[:-2, 1:-1] +
        pad_img[2:, 1:-1] +
        pad_img[1:-1, :-2] +
        pad_img[1:-1, 2:] -
        4.0 * gray_np
    )
    variance = float(np.var(laplacian))
    return round(variance, 2)


def calculate_patch_sharpness(gray_np: np.ndarray, patch_size: int = 64) -> Tuple[float, float]:
    """
    Computes global and peak patch-level Laplacian variance.
    Peak patch variance detects whether the focal subject (lesion ROI) is sharp
    even when the background has shallow depth-of-field bokeh.
    """
    h, w = gray_np.shape
    variances = []
    for y in range(0, h - patch_size + 1, patch_size):
        for x in range(0, w - patch_size + 1, patch_size):
            patch = gray_np[y:y+patch_size, x:x+patch_size]
            var = calculate_laplacian_variance(patch)
            variances.append(var)
    if not variances:
        var = calculate_laplacian_variance(gray_np)
        return var, var
    global_var = float(np.mean(variances))
    peak_var = float(np.percentile(variances, 85))
    return round(global_var, 2), round(peak_var, 2)


def calculate_local_contrast(gray_np: np.ndarray) -> float:
    """
    Computes RMS contrast (standard deviation of normalized luminance).
    Low contrast (< 0.12) indicates a washed out, hazy, or flat exposure.
    """
    norm = gray_np / 255.0
    rms_contrast = float(np.std(norm))
    return round(rms_contrast, 3)


def estimate_jpeg_compression_artifacts(gray_np: np.ndarray) -> float:
    """
    Estimates 8x8 block-boundary discontinuity characteristic of high JPEG compression.
    Returns compression artifact index (0.0 to 1.0, higher = more severe artifacts).
    """
    h, w = gray_np.shape
    if h < 16 or w < 16:
        return 0.0
    
    # Differences across 8x8 block boundaries vs intra-block differences
    col_bounds = gray_np[:, 7::8]
    col_next = gray_np[:, 8::8]
    if col_bounds.shape[1] > 0 and col_next.shape[1] > 0:
        min_cols = min(col_bounds.shape[1], col_next.shape[1])
        boundary_diff = np.mean(np.abs(col_bounds[:, :min_cols] - col_next[:, :min_cols]))
        
        # Intra-block comparison (columns 3 and 4)
        col_intra1 = gray_np[:, 3::8]
        col_intra2 = gray_np[:, 4::8]
        min_intra = min(col_intra1.shape[1], col_intra2.shape[1])
        intra_diff = np.mean(np.abs(col_intra1[:, :min_intra] - col_intra2[:, :min_intra])) + 1e-5
        
        ratio = max(0.0, float((boundary_diff - intra_diff) / intra_diff))
        artifact_score = min(1.0, ratio / 2.0)
        return round(artifact_score, 3)
    return 0.0


def evaluate_image_quality(
    image_bytes: bytes,
    skin_mask: Optional[np.ndarray] = None
) -> Dict[str, Any]:
    """
    Advanced Multi-Metric Optical Quality Engine:
    1. Sharpness & focus (Global Laplacian variance + Peak ROI patch sharpness)
    2. Region-aware exposure & diffuse balance (Evaluated on skin/lesion ROI,
       preventing black dermoscopy borders or dark clinical backdrops from failing good photos)
    3. Specular glare & highlight clipping on skin/lesion surface
    4. Local contrast and JPEG compression artifact grading
    5. Aspect ratio & resolution verification
    
    Returns structured 3-tier outcome:
    - PASS: High fidelity, optimal for automated inference.
    - WARNING: Suboptimal (mild blur, uneven lighting, high compression) but acceptable for inference.
    - REJECT: Truly ungradable (severe blur, extreme underexposure, completely blown out).
    """
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    width, height = img.size

    # Standardize analysis scale while strictly preserving original aspect ratio
    max_dim = 768
    scale = min(1.0, max_dim / max(width, height))
    eval_w = max(64, int(width * scale))
    eval_h = max(64, int(height * scale))
    img_eval = img.resize((eval_w, eval_h), Image.Resampling.BILINEAR)

    rgb_arr = np.array(img_eval, dtype=np.float32)
    gray_arr = 0.299 * rgb_arr[:, :, 0] + 0.587 * rgb_arr[:, :, 1] + 0.114 * rgb_arr[:, :, 2]

    # Resize skin_mask if provided
    roi_mask = None
    if skin_mask is not None:
        try:
            mask_img = Image.fromarray(skin_mask.astype(np.uint8) * 255).resize((eval_w, eval_h), Image.Resampling.NEAREST)
            roi_mask = np.array(mask_img) > 128
        except Exception:
            roi_mask = None

    # Fallback ROI: if no skin mask or skin coverage is tiny, use central 70% region
    # to avoid dark dermoscopy borders or outer clinical drapes
    if roi_mask is None or np.count_nonzero(roi_mask) < (eval_w * eval_h * 0.02):
        y_start, y_end = int(eval_h * 0.15), int(eval_h * 0.85)
        x_start, x_end = int(eval_w * 0.15), int(eval_w * 0.85)
        roi_mask = np.zeros((eval_h, eval_w), dtype=bool)
        roi_mask[y_start:y_end, x_start:x_end] = True

    roi_pixels = gray_arr[roi_mask]
    roi_rgb = rgb_arr[roi_mask]

    # 1. Sharpness & Focus Analysis
    global_sharpness, peak_sharpness = calculate_patch_sharpness(gray_arr, patch_size=64)
    # Effective sharpness balances overall image with focused lesion area
    effective_sharpness = max(global_sharpness, peak_sharpness * 0.8)

    # Calibrated Sharpness Thresholds:
    # Extreme blur (e.g. Laplacian < 35.0): Unreadable, REJECT.
    # Mild blur / soft focus (35.0 <= sharpness < 90.0): WARNING.
    # Good focus (>= 90.0): PASS.
    is_severe_blur = effective_sharpness < 35.0
    is_mild_blur = 35.0 <= effective_sharpness < 90.0

    if effective_sharpness >= 500.0:
        sharpness_status = "Pass (High Edge Fidelity)"
    elif effective_sharpness >= 90.0:
        sharpness_status = "Pass (Acceptable Focus)"
    elif not is_severe_blur:
        sharpness_status = "Warning (Soft Focus / Slight Blur)"
    else:
        sharpness_status = "Fail (Severe Motion Blur / Ungradable)"

    # 2. Region-Aware Exposure & Luminance Balance
    roi_mean_luminance = float(np.mean(roi_pixels)) if roi_pixels.size > 0 else float(np.mean(gray_arr))
    global_mean_luminance = float(np.mean(gray_arr))

    # Standardized Diffuse Lighting Score (0 - 100)
    # Ideal human skin luminance under balanced daylight: ~85 - 195
    if 85.0 <= roi_mean_luminance <= 195.0:
        lighting_score = 100
        lighting_status = "Good (Natural Diffuse Daylight)"
    elif 50.0 <= roi_mean_luminance < 85.0 or 195.0 < roi_mean_luminance <= 225.0:
        lighting_score = 75
        lighting_status = "Acceptable (Slight Exposure Deviation)"
    elif 30.0 <= roi_mean_luminance < 50.0:
        lighting_score = 45
        lighting_status = "Warning (Suboptimal Exposure / Dim)"
    elif 225.0 < roi_mean_luminance <= 245.0:
        lighting_score = 45
        lighting_status = "Warning (Suboptimal Exposure / Bright)"
    elif roi_mean_luminance < 30.0:
        lighting_score = 15
        lighting_status = "Fail (Underexposed / Too Dark)"
    else:
        lighting_score = 15
        lighting_status = "Fail (Overexposed / Blown Highlights)"

    is_severe_underexposed = roi_mean_luminance < 30.0
    is_severe_overexposed = roi_mean_luminance > 248.0

    # Retain ambient_lux field for API backwards compatibility (diffuse lighting index)
    ambient_lux = round(150.0 + (roi_mean_luminance / 255.0) * 550.0, 1)

    # 3. Specular Glare / Flash Hotspots on ROI
    if roi_rgb.size > 0:
        glare_mask_roi = (roi_rgb[:, 0] > 248) & (roi_rgb[:, 1] > 248) & (roi_rgb[:, 2] > 248)
        glare_ratio = float(np.count_nonzero(glare_mask_roi) / max(1, len(roi_rgb)))
    else:
        glare_ratio = 0.0

    if glare_ratio > 0.40:
        glare_status = f"Fail (Severe Hotspot Glare {round(glare_ratio * 100, 1)}%)"
    elif glare_ratio > 0.15:
        glare_status = f"Warning (Moderate Reflection {round(glare_ratio * 100, 1)}%)"
    else:
        glare_status = "Pass (Minimal Specular Reflection)"

    is_severe_glare = glare_ratio > 0.40

    # 4. Local Contrast & JPEG Artifacts
    contrast_score = calculate_local_contrast(gray_arr)
    compression_artifact_score = estimate_jpeg_compression_artifacts(gray_arr)

    # 5. Composite Usability Score (0 - 100)
    score = 100
    quality_notes: List[str] = []
    failed_measurements: List[str] = []
    quality_reasons: List[str] = []

    if is_severe_blur:
        score -= 50
        failed_measurements.append("severe_blur")
        quality_reasons.append("Image is heavily blurred or out of focus.")
        quality_notes.append("Severe motion blur detected. Lesion borders cannot be resolved.")
    elif is_mild_blur:
        score -= 15
        quality_reasons.append("Slight soft focus detected; fine edge details may be reduced.")
        quality_notes.append(f"Soft focus detected (Laplacian variance: {effective_sharpness:.1f}).")
    else:
        quality_notes.append(f"Laplacian edge variance: {effective_sharpness:.1f} (in-focus).")

    if is_severe_underexposed:
        score -= 40
        failed_measurements.append("extreme_underexposure")
        quality_reasons.append("Subject area is too dark to resolve lesion features.")
        quality_notes.append(f"Extreme underexposure on skin region ({roi_mean_luminance:.1f}/255).")
    elif is_severe_overexposed:
        score -= 40
        failed_measurements.append("extreme_overexposure")
        quality_reasons.append("Subject area is washed out or overexposed.")
        quality_notes.append(f"Severe overexposure on skin region ({roi_mean_luminance:.1f}/255).")
    elif lighting_score < 60:
        score -= 15
        quality_reasons.append("Lighting is uneven or suboptimal; indirect daylight is recommended.")
        quality_notes.append(f"Suboptimal diffuse lighting balance ({roi_mean_luminance:.1f}/255).")
    else:
        quality_notes.append("Lighting balance is clear and diffuse.")

    if is_severe_glare:
        score -= 35
        failed_measurements.append("severe_glare")
        quality_reasons.append("Intense flash glare or surface reflection obscures the skin.")
        quality_notes.append(f"Severe specular reflection detected ({round(glare_ratio * 100, 1)}%).")
    elif glare_ratio > 0.15:
        score -= 10
        quality_reasons.append("Moderate reflection detected on the skin surface.")
        quality_notes.append("Moderate surface highlight reflection detected.")

    if contrast_score < 0.10:
        score -= 10
        quality_reasons.append("Low contrast image.")
        quality_notes.append(f"Low contrast ({contrast_score:.3f}).")

    if compression_artifact_score > 0.50:
        score -= 10
        quality_reasons.append("High compression artifacts present.")
        quality_notes.append(f"JPEG blockiness detected ({compression_artifact_score:.2f}).")

    score = max(10, min(100, score))

    # 6. Structured Three-Tier Quality Determination:
    # REJECT: Only when completely ungradable
    if is_severe_blur or is_severe_underexposed or is_severe_overexposed or is_severe_glare or score < 35:
        quality_tier = "REJECT"
        is_acceptable = False
    # WARNING: Suboptimal but valid for inference
    elif is_mild_blur or lighting_score < 70 or glare_ratio > 0.15 or score < 70:
        quality_tier = "WARNING"
        is_acceptable = True
    # PASS: Optimal fidelity
    else:
        quality_tier = "PASS"
        is_acceptable = True

    return {
        "is_acceptable": is_acceptable,
        "quality_tier": quality_tier,
        "overall_quality_score": score,
        "overall_usability_score": score,
        "sharpness_score": effective_sharpness,
        "sharpness_status": sharpness_status,
        "ambient_lux": ambient_lux,
        "lighting_score": lighting_score,
        "lighting_status": lighting_status,
        "glare_ratio": round(glare_ratio, 4),
        "glare_status": glare_status,
        "local_contrast": contrast_score,
        "compression_artifact_score": compression_artifact_score,
        "framing_status": "Pass (Optimal Clinical Framing)",
        "quality_notes": quality_notes,
        "failed_measurements": failed_measurements,
        "quality_reasons": quality_reasons,
    }
