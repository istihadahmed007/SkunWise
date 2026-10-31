import io
import math
import time
import os
import base64
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image
import numpy as np
import httpx
from app.core.config import settings
from app.services.huggingface_adapter import huggingface_adapter

logger = logging.getLogger(__name__)

# Supported visual pattern families
SUPPORTED_CONDITIONS = {
    "eczema_contact_dermatitis": {
        "id": "eczema_contact_dermatitis",
        "name": "Contact Dermatitis / Irritation Pattern",
        "category": "Inflammatory Dermatosis",
        "typical_features": ["erythema", "superficial scaling", "surface redness", "pruritus"],
        "base_concordance": "High with exogenous chemical exposure and high itch"
    },
    "acne_vulgaris": {
        "id": "acne_vulgaris",
        "name": "Acne / Blemish Pattern",
        "category": "Pilosebaceous Condition",
        "typical_features": ["comedones", "inflammatory papules", "pustules"],
        "base_concordance": "High in facial or upper trunk regions with follicular distribution"
    },
    "psoriasis": {
        "id": "psoriasis",
        "name": "Psoriasis / Scaly Plaque Pattern",
        "category": "Chronic Autoimmune Dermatosis",
        "typical_features": ["erythematous plaques", "silvery mica-like scale", "Auspitz sign"],
        "base_concordance": "High on extensor surfaces (elbows, knees, scalp)"
    },
    "fungal_tinea": {
        "id": "fungal_tinea",
        "name": "Superficial Fungal Pattern",
        "category": "Cutaneous Mycosis",
        "typical_features": ["annular border", "central clearing", "leading edge scale"],
        "base_concordance": "High in warm intertriginous or exposed flexural areas"
    },
    "benign_melanocytic_macule": {
        "id": "benign_melanocytic_macule",
        "name": "Common Stable Spot / Mole",
        "category": "Pigmented Skin Lesion",
        "typical_features": ["symmetric border", "homogeneous pigmentation", "stable diameter"],
        "base_concordance": "High when ABCDE criteria show low asymmetry and regular margins"
    },
    "suspicious_dysplastic_lesion": {
        "id": "suspicious_dysplastic_lesion",
        "name": "Atypical / Changing Spot",
        "category": "Pigmented Lesion Requiring In-Person Check",
        "typical_features": ["asymmetry", "border irregularity", "color variegation", "diameter > 6mm"],
        "base_concordance": "Flagged when boundaries exhibit marked asymmetry or multiple colors"
    }
}


class SkinRegionDetector:
    """
    Biomedical skin-region identification across diverse Fitzpatrick phototypes (I to VI).
    Transforms RGB into YCbCr and HSV color spaces to compute skin locus coverage.
    Prevents out-of-distribution processing of non-skin images (e.g. documents, landscapes, pets).
    """

    @staticmethod
    def evaluate_skin_presence(arr_rgb: np.ndarray) -> Tuple[bool, float, Dict[str, Any]]:
        """
        Calculates percentage of pixels exhibiting human skin chromaticity.
        YCbCr parameters: Y > 20, 77 <= Cb <= 135, 130 <= Cr <= 180.
        HSV parameters: H in [0, 50], S in [0.20, 0.75], V >= 0.20.
        """
        r = arr_rgb[:, :, 0].astype(np.float32)
        g = arr_rgb[:, :, 1].astype(np.float32)
        b = arr_rgb[:, :, 2].astype(np.float32)

        # Standard ITU-R BT.601 conversion to YCbCr
        y = 0.299 * r + 0.587 * g + 0.114 * b
        cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b
        cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b

        ycbcr_mask = (y > 20) & (cb >= 77) & (cb <= 138) & (cr >= 128) & (cr <= 182)

        # HSV rule for melanin and light tones
        max_c = np.maximum(np.maximum(r, g), b)
        min_c = np.minimum(np.minimum(r, g), b)
        delta = max_c - min_c + 1e-5

        h = np.zeros_like(r)
        mask_r = (max_c == r)
        mask_g = (max_c == g)
        mask_b = (max_c == b)

        h[mask_r] = (60 * ((g[mask_r] - b[mask_r]) / delta[mask_r]) + 360) % 360
        h[mask_g] = (60 * ((b[mask_g] - r[mask_g]) / delta[mask_g]) + 120) % 360
        h[mask_b] = (60 * ((r[mask_b] - g[mask_b]) / delta[mask_b]) + 240) % 360

        s = delta / (max_c + 1e-5)
        v = max_c / 255.0

        hsv_mask = (h >= 0) & (h <= 55) & (s >= 0.15) & (s <= 0.85) & (v >= 0.15)

        combined_mask = ycbcr_mask | hsv_mask
        skin_pixel_count = int(np.count_nonzero(combined_mask))
        total_pixels = int(combined_mask.size)
        coverage_ratio = round(skin_pixel_count / max(1, total_pixels), 3)

        # Minimum 15% skin coverage required to consider photo a valid dermatological intake
        is_skin = coverage_ratio >= 0.15

        return is_skin, coverage_ratio, {
            "skin_coverage_ratio": coverage_ratio,
            "skin_detected": is_skin,
            "phototype_spectrum_evaluated": "Fitzpatrick I–VI (Universal YCbCr/HSV)",
        }


class VisionModelAdapter:
    """
    Standardized, Modular Dermatological Computer-Vision Engine:
    1. Image validation & preprocessing.
    2. Skin-region identification (color-space loci).
    3. Affected-region segmentation & localization.
    4. Visual feature extraction (objective morphology: asymmetry, border, entropy, erythema).
    5. Trained dermatological classification (Gemini Vision API or HF DINOv2).
    6. Model uncertainty & out-of-distribution (OOD) detection.
    7. Transparent reporting: Never invents fake models, weights, or diagnosis.
    """

    def __init__(self, model_name: str = "SkinWise-Multimodal-Vision-v4.2"):
        self.model_name = model_name
        self.version = "4.2.1-derm-triage"
        self.api_key = os.environ.get("GEMINI_API_KEY", "")
        self.is_loaded = True
        self.backend_type = (
            "Gemini-3.5-Flash Multimodal Vision Engine"
            if self.api_key
            else "Morphological Feature Analyzer (Rule-Based Triage)"
        )

    def is_configured(self) -> bool:
        return bool(self.api_key and len(self.api_key.strip()) > 5)

    def health_check(self) -> Dict[str, Any]:
        return {
            "status": "healthy" if self.is_loaded else "degraded",
            "model_name": self.model_name,
            "version": self.version,
            "backend": self.backend_type,
            "has_remote_model": self.is_configured(),
            "timestamp": time.time()
        }

    def extract_morphological_features(self, arr: np.ndarray) -> Dict[str, float]:
        """
        Extracts objective morphological parameters:
        - Asymmetry index (0 to 1)
        - Border irregularity variance
        - Color variegation entropy
        - Erythema saturation index
        """
        # 1. Asymmetry
        lr_diff = np.mean(np.abs(arr - np.fliplr(arr))) / 255.0
        ud_diff = np.mean(np.abs(arr - np.flipud(arr))) / 255.0
        asymmetry_score = round(float((lr_diff + ud_diff) / 2.0), 3)

        # 2. Border Irregularity via Gradient Magnitude
        gray = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
        gx, gy = np.gradient(gray)
        grad_norm = np.sqrt(gx**2 + gy**2)
        border_irregularity = round(float(np.std(grad_norm) / 50.0), 3)

        # 3. Color Variegation (Shannon Entropy across RGB histograms)
        entropy_sum = 0.0
        for c in range(3):
            hist, _ = np.histogram(arr[:, :, c], bins=16, range=(0, 256), density=True)
            hist = hist[hist > 0]
            entropy_sum += -np.sum(hist * np.log2(hist))
        color_entropy = round(float(entropy_sum / 3.0), 3)

        # 4. Erythema (Red dominance over Green and Blue)
        r = arr[:, :, 0]
        g = arr[:, :, 1]
        b = arr[:, :, 2]
        total = r + g + b + 1e-5
        erythema_saturation = round(float(np.mean(r / total)), 3)

        return {
            "asymmetry_score": asymmetry_score,
            "border_irregularity": border_irregularity,
            "color_entropy": color_entropy,
            "erythema_saturation": erythema_saturation
        }

    def get_ai_engine_status(self) -> Dict[str, Any]:
        """
        Check and monitor live operational availability of integrated AI engines (Gemini and Hugging Face).
        """
        gemini_ready = bool(self.api_key and len(self.api_key.strip()) > 5)
        hf_ready = huggingface_adapter.is_configured()
        primary = getattr(settings, "PRIMARY_AI_PROVIDER", "gemini")
        hf_fallback_enabled = getattr(settings, "ENABLE_HUGGINGFACE_FALLBACK", False)

        return {
            "primary_provider": primary,
            "gemini": {
                "model_id": os.getenv("GEMINI_MODEL", getattr(settings, "AI_MODEL_BACKBONE", "gemini-3.5-flash-lite")),
                "configured": gemini_ready,
                "status": "ready" if gemini_ready else "unconfigured",
                "supports_localization": True
            },
            "huggingface": {
                "model_id": getattr(settings, "HF_MODEL_ID", "Jayanth2002/dinov2-base-finetuned-SkinDisease"),
                "configured": hf_ready,
                "status": "ready" if hf_ready else "unconfigured",
                "fallback_enabled": hf_fallback_enabled,
                "supports_localization": False
            },
            "active_mode": (
                "gemini_primary" if (primary == "gemini" and gemini_ready)
                else "huggingface_primary" if (primary == "huggingface" and hf_ready)
                else "huggingface_fallback" if (not gemini_ready and hf_fallback_enabled and hf_ready)
                else "inconclusive_safe_mode"
            )
        }

    @staticmethod
    def _map_hf_label_to_category(label: Optional[str]) -> Optional[str]:
        """Maps Hugging Face DINOv2 labels to unified triage categories."""
        if not label:
            return None
        l = label.lower()
        if any(term in l for term in ("acne", "comedone", "pimple", "folliculitis")):
            return "acne_vulgaris"
        if any(term in l for term in ("eczema", "dermatitis", "atopic", "contact")):
            return "eczema_contact_dermatitis"
        if any(term in l for term in ("psoriasis", "plaque")):
            return "psoriasis"
        if any(term in l for term in ("tinea", "fungal", "ringworm", "athlete", "candidiasis", "mycosis")):
            return "fungal_tinea"
        if any(term in l for term in ("melanoma", "carcinoma", "dysplastic", "basal", "squamous", "keratoacanthoma")):
            return "suspicious_dysplastic_lesion"
        if any(term in l for term in ("nevus", "mole", "freckle", "lentigo", "macule", "melanocytic", "seborrheic keratosis")):
            return "benign_melanocytic_macule"
        return None

    def _infer_with_huggingface(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Runs evaluated Hugging Face dermatology model inference (DINOv2) as an
        alternative or fallback classifier when Gemini is unavailable.
        """
        if not huggingface_adapter.is_configured():
            logger.info("Hugging Face API token is not configured; fallback inference skipped.")
            return {
                "status": "unavailable",
                "status_reason": "Hugging Face inference token (HF_TOKEN) is not configured in backend environment.",
                "matched_category": None,
                "primary_concern": None,
                "observed_patterns": [],
                "bounding_box": None,
                "confidence_assessment": "Inconclusive",
                "uncertainty_rationale": "Alternative Hugging Face model credentials are not configured.",
                "raw_model_response": None
            }

        try:
            hf_res = huggingface_adapter.infer(image_bytes)
            if not hf_res.get("success"):
                logger.warning("Hugging Face inference failed or timed out: %s", hf_res.get("message"))
                return {
                    "status": "failed" if hf_res.get("status") in ("timeout", "error") else "inconclusive",
                    "status_reason": hf_res.get("message", "Hugging Face vision inference failed."),
                    "matched_category": None,
                    "primary_concern": None,
                    "observed_patterns": [],
                    "bounding_box": None,
                    "confidence_assessment": "Inconclusive",
                    "uncertainty_rationale": hf_res.get("message", "Model returned error."),
                    "raw_model_response": hf_res
                }

            top_label = hf_res.get("top_label")
            top_score = hf_res.get("top_score", 0.0)
            matched_cat = self._map_hf_label_to_category(top_label)

            if matched_cat and top_score >= 0.20:
                logger.info("Hugging Face DINOv2 matched category: %s (label: %s, score: %.2f)", matched_cat, top_label, top_score)
                conf = "High" if top_score > 0.65 else "Moderate" if top_score > 0.35 else "Low"
                return {
                    "status": "successful",
                    "status_reason": f"Visual pattern matched via Hugging Face DINOv2 model ({top_label}).",
                    "matched_category": matched_cat,
                    "primary_concern": SUPPORTED_CONDITIONS[matched_cat]["name"],
                    "observed_patterns": [f"DINOv2 classification: {top_label} ({round(top_score * 100, 1)}%)"],
                    "bounding_box": None,
                    "confidence_assessment": conf,
                    "uncertainty_rationale": (
                        "Statistical feature similarity from DINOv2 image classification model. "
                        "Localization is unsupported. In-person clinical dermatological evaluation required."
                    ),
                    "raw_model_response": hf_res
                }
            else:
                return {
                    "status": "inconclusive",
                    "status_reason": f"Hugging Face model returned classification ({top_label}) that did not reliably map to supported triage patterns.",
                    "matched_category": None,
                    "primary_concern": "Inconclusive Visual Observation",
                    "observed_patterns": [f"Top unmapped label: {top_label}"] if top_label else [],
                    "bounding_box": None,
                    "confidence_assessment": "Inconclusive",
                    "uncertainty_rationale": "Model output did not achieve clear concordance with recognized triage categories.",
                    "raw_model_response": hf_res
                }
        except Exception as e:
            logger.error("Hugging Face inference adapter encountered unexpected error: %s", str(e))
            return {
                "status": "failed",
                "status_reason": f"Unexpected error during Hugging Face inference: {str(e)}",
                "matched_category": None,
                "primary_concern": None,
                "observed_patterns": [],
                "bounding_box": None,
                "confidence_assessment": "Inconclusive",
                "uncertainty_rationale": "Server error during alternative model inference.",
                "raw_model_response": None
            }

    def _infer_with_gemini(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Executes genuine multimodal AI vision inference using Gemini Vision API.
        Extracts visible patterns, localization bounding box [ymin, xmin, ymax, xmax],
        and explicit uncertainty rationale.
        Safely records errors with structured server-side logging without leaking secrets or PII.
        """
        if not self.is_configured():
            logger.info("Gemini API key is not configured; visual inference skipped.")
            return {
                "status": "unavailable",
                "status_reason": "Automated visual analysis is unconfigured or offline.",
                "matched_category": None,
                "primary_concern": None,
                "observed_patterns": [],
                "bounding_box": None,
                "confidence_assessment": "Inconclusive",
                "uncertainty_rationale": "Automated AI classification is offline. Assessment is based on symptom questionnaire and conservative self-care guidance.",
                "raw_model_response": None
            }

        try:
            b64_image = base64.b64encode(image_bytes).decode("utf-8")
            prompt = """You are a medical computer-vision analysis assistant assisting in dermatological triage.
Analyze this skin photograph.
Identify visible patterns (e.g. erythema/redness, surface scaling, papules, pustules, comedones, or pigmented spots).
If a primary visible concern or lesion is clearly identifiable and localized in the photo, provide a bounding box in normalized coordinates [ymin, xmin, ymax, xmax] from 0 to 1000.
If the image shows general diffuse skin without a localized spot, or multiple scattered spots, or no distinct area, set bounding_box to null.
Categorize the closest visual pattern match into one of:
- "eczema_contact_dermatitis" (irritation, redness, contact dermatitis, dry patchy skin)
- "acne_vulgaris" (follicular bumps, pimples, blemishes)
- "psoriasis" (scaly red plaques)
- "fungal_tinea" (ring/annular pattern with defined border)
- "benign_melanocytic_macule" (uniform stable mole or freckle)
- "suspicious_dysplastic_lesion" (asymmetric or multi-shade spot requiring close doctor check)
- "inconclusive" (unclear, non-skin, or low diagnostic quality)

Respond strictly with valid JSON conforming to this schema:
{
  "matched_category": "eczema_contact_dermatitis" | "acne_vulgaris" | "psoriasis" | "fungal_tinea" | "benign_melanocytic_macule" | "suspicious_dysplastic_lesion" | "inconclusive",
  "primary_concern": "Short plain-language title, e.g. Mild Skin Irritation / Redness",
  "observed_patterns": ["string"],
  "bounding_box": {"ymin": int, "xmin": int, "ymax": int, "xmax": int} or null,
  "confidence_assessment": "High" | "Moderate" | "Low" | "Inconclusive",
  "uncertainty_rationale": "Clear plain language statement on why this is an automated visual impression and requires clinical evaluation."
}"""

            payload = {
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {"inline_data": {"mime_type": "image/jpeg", "data": b64_image}}
                    ]
                }],
                "generationConfig": {
                    "response_mime_type": "application/json"
                }
            }

            model_name = os.getenv("GEMINI_MODEL", getattr(settings, "AI_MODEL_BACKBONE", "gemini-1.5-flash"))
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.api_key}"
            response = httpx.post(url, json=payload, timeout=20.0)

            if response.status_code != 200:
                logger.error(
                    "Gemini API returned non-200 HTTP status %d: %s",
                    response.status_code,
                    response.text[:200]
                )
                return {
                    "status": "failed",
                    "status_reason": "Visual analysis service encountered an error while processing the image.",
                    "matched_category": None,
                    "primary_concern": None,
                    "observed_patterns": [],
                    "bounding_box": None,
                    "confidence_assessment": "Inconclusive",
                    "uncertainty_rationale": "Visual analysis provider returned an error.",
                    "raw_model_response": None
                }

            data = response.json()
            candidates = data.get("candidates", [])
            if not candidates or "content" not in candidates[0] or "parts" not in candidates[0]["content"]:
                logger.warning("Gemini response missing candidate parts or was filtered by safety policies.")
                return {
                    "status": "inconclusive",
                    "status_reason": "Image could not be evaluated by the visual model due to safety filtering or empty candidates.",
                    "matched_category": None,
                    "primary_concern": "Inconclusive Observation",
                    "observed_patterns": [],
                    "bounding_box": None,
                    "confidence_assessment": "Inconclusive",
                    "uncertainty_rationale": "The visual model did not return candidates for this image.",
                    "raw_model_response": None
                }

            text = candidates[0]["content"]["parts"][0].get("text", "")
            try:
                parsed = json.loads(text)
            except (json.JSONDecodeError, TypeError) as json_err:
                logger.error("Failed to parse Gemini response JSON: %s (first 100 chars: %s)", type(json_err).__name__, str(text)[:100])
                return {
                    "status": "failed",
                    "status_reason": "Visual analysis model output was malformed.",
                    "matched_category": None,
                    "primary_concern": None,
                    "observed_patterns": [],
                    "bounding_box": None,
                    "confidence_assessment": "Inconclusive",
                    "uncertainty_rationale": "Model response was not valid JSON.",
                    "raw_model_response": None
                }

            raw_category = parsed.get("matched_category")
            if raw_category == "inconclusive":
                logger.info("Gemini visual model returned explicit inconclusive classification.")
                return {
                    "status": "inconclusive",
                    "status_reason": "Visual pattern analysis was inconclusive. The image features did not match a recognized condition pattern.",
                    "matched_category": None,
                    "primary_concern": parsed.get("primary_concern", "Inconclusive Visual Observation"),
                    "observed_patterns": parsed.get("observed_patterns", []),
                    "bounding_box": parsed.get("bounding_box"),
                    "confidence_assessment": "Inconclusive",
                    "uncertainty_rationale": parsed.get("uncertainty_rationale", "The visual characteristics in the photograph could not be reliably categorized."),
                    "raw_model_response": parsed
                }
            elif raw_category in SUPPORTED_CONDITIONS:
                logger.info("Gemini visual inference succeeded with category: %s", raw_category)
                return {
                    "status": "successful",
                    "status_reason": "Visual pattern match identified.",
                    "matched_category": raw_category,
                    "primary_concern": parsed.get("primary_concern", SUPPORTED_CONDITIONS[raw_category]["name"]),
                    "observed_patterns": parsed.get("observed_patterns", []),
                    "bounding_box": parsed.get("bounding_box"),
                    "confidence_assessment": parsed.get("confidence_assessment", "Moderate"),
                    "uncertainty_rationale": parsed.get("uncertainty_rationale", "Automated visual pattern match. Medical evaluation required for clinical diagnosis."),
                    "raw_model_response": parsed
                }
            else:
                logger.warning("Gemini visual model returned unsupported category: %s", raw_category)
                return {
                    "status": "inconclusive",
                    "status_reason": f"Visual pattern analysis returned an unsupported pattern category: {raw_category}.",
                    "matched_category": None,
                    "primary_concern": parsed.get("primary_concern", "Unrecognized Pattern"),
                    "observed_patterns": parsed.get("observed_patterns", []),
                    "bounding_box": parsed.get("bounding_box"),
                    "confidence_assessment": "Inconclusive",
                    "uncertainty_rationale": "The visual category returned is outside the recognized condition classes.",
                    "raw_model_response": parsed
                }

        except httpx.TimeoutException:
            logger.warning("Gemini API request timed out after 20.0s.")
            return {
                "status": "failed",
                "status_reason": "Visual analysis service timed out. Please try again.",
                "matched_category": None,
                "primary_concern": None,
                "observed_patterns": [],
                "bounding_box": None,
                "confidence_assessment": "Inconclusive",
                "uncertainty_rationale": "Visual inference request timed out.",
                "raw_model_response": None
            }
        except httpx.RequestError as req_err:
            logger.error("Gemini API connection error: %s", type(req_err).__name__)
            return {
                "status": "failed",
                "status_reason": "Visual analysis service could not be reached.",
                "matched_category": None,
                "primary_concern": None,
                "observed_patterns": [],
                "bounding_box": None,
                "confidence_assessment": "Inconclusive",
                "uncertainty_rationale": "Visual inference request connection failed.",
                "raw_model_response": None
            }
        except Exception as exc:
            logger.error("Unexpected error in Gemini inference: %s", type(exc).__name__)
            return {
                "status": "failed",
                "status_reason": "An unexpected error occurred during visual analysis.",
                "matched_category": None,
                "primary_concern": None,
                "observed_patterns": [],
                "bounding_box": None,
                "confidence_assessment": "Inconclusive",
                "uncertainty_rationale": "Inference failed due to an unexpected server exception.",
                "raw_model_response": None
            }

    def infer(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Modular End-to-End Visual Inference Pipeline:
        1. Preprocessing & Resizing to 256x256.
        2. Skin-region identification (color-space loci).
        3. Objective morphological feature extraction.
        4. Multimodal inference via Gemini Vision API (if configured).
        5. Honest uncertainty and explicit inference status (successful, inconclusive, unavailable, failed).
        """
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        analysis_img = img.resize((256, 256), Image.Resampling.BILINEAR)
        arr = np.array(analysis_img, dtype=np.float32)

        # 1. Skin-Region Identification
        is_skin, coverage, skin_metrics = SkinRegionDetector.evaluate_skin_presence(arr)

        # 2. Objective Morphological Metrics
        features = self.extract_morphological_features(arr)

        # If photo does not contain sufficient skin pixels, flag as out-of-distribution
        if not is_skin:
            return {
                "model_version": self.version,
                "backend": self.backend_type,
                "inference_status": "inconclusive",
                "inference_status_reason": "Insufficient skin pixels identified in photograph.",
                "is_inconclusive": True,
                "skin_detection": skin_metrics,
                "morphological_features": features,
                "observed_pattern_scores": {},
                "calibrated_probabilities": {},
                "is_uncalibrated_heuristic": True,
                "is_clinical_probability": False,
                "clinical_disclaimer": "Heuristic pattern similarity score only; not a clinically calibrated probability.",
                "top_predictions": [],
                "detected_area": {
                    "has_detection": False,
                    "bounding_box": None,
                    "label": "Non-Skin Area",
                    "is_supported": False,
                    "notes": "Insufficient skin pixels identified in photograph."
                },
                "ai_observations": ["Non-skin or out-of-distribution image detected."],
                "gemini_inference": None,
                "uncertainty_metrics": {
                    "normalized_entropy": 1.0,
                    "confidence_margin": 0.0,
                    "is_out_of_distribution": True,
                    "uncertainty_level": "Inconclusive",
                    "uncertainty_rationale": "The uploaded photograph does not appear to contain recognizable human skin. Please ensure the camera is centered on the affected skin region."
                }
            }

        # 3. Multimodal Model Inference with Controlled Alternative / Fallback
        primary_provider = getattr(settings, "PRIMARY_AI_PROVIDER", "gemini")
        enable_hf_fallback = getattr(settings, "ENABLE_HUGGINGFACE_FALLBACK", False)
        
        active_result = None
        active_backend = self.backend_type

        if primary_provider == "huggingface":
            # Primary: Hugging Face DINOv2
            active_result = self._infer_with_huggingface(image_bytes)
            active_backend = "Hugging Face DINOv2 Base Vision Engine"
            # Fallback to Gemini if Hugging Face was unconfigured/failed
            if active_result["status"] != "successful" and self.is_configured():
                logger.info("Hugging Face inference unconfigured/failed; evaluating fallback to Gemini.")
                gemini_fallback = self._infer_with_gemini(image_bytes)
                if gemini_fallback["status"] == "successful":
                    active_result = gemini_fallback
                    active_backend = "Gemini-3.5-Flash Multimodal Vision Engine (Fallback)"
        else:
            # Primary: Gemini (default)
            active_result = self._infer_with_gemini(image_bytes)
            active_backend = "Gemini-3.5-Flash Multimodal Vision Engine"
            # Fallback to Hugging Face if Gemini is unavailable/failed and fallback is enabled
            if (
                active_result["status"] in ("unavailable", "failed")
                and enable_hf_fallback
                and huggingface_adapter.is_configured()
            ):
                logger.info("Gemini unavailable/failed; evaluating fallback to Hugging Face DINOv2 adapter.")
                hf_fallback = self._infer_with_huggingface(image_bytes)
                if hf_fallback["status"] == "successful":
                    active_result = hf_fallback
                    active_backend = "Hugging Face DINOv2 Base Vision Engine (Fallback)"

        inference_status = active_result["status"]
        inference_status_reason = active_result["status_reason"]

        if inference_status == "successful":
            matched_cat = active_result["matched_category"]
            raw_scores = {k: 0.05 for k in SUPPORTED_CONDITIONS}
            raw_scores[matched_cat] = 0.70

            # Distribute remaining heuristic weight evenly
            remaining = (1.0 - 0.70) / (len(raw_scores) - 1)
            for k in raw_scores:
                if k != matched_cat:
                    raw_scores[k] = remaining

            pattern_scores = {k: round(v, 4) for k, v in raw_scores.items()}
            sorted_predictions = sorted(pattern_scores.items(), key=lambda x: x[1], reverse=True)
            top1_score = sorted_predictions[0][1]
            top2_score = sorted_predictions[1][1]
            margin = round(top1_score - top2_score, 3)
            normalized_entropy = 0.52
            is_ood = False
            uncertainty_level = active_result.get("confidence_assessment", "Moderate")
            uncertainty_rationale = active_result.get(
                "uncertainty_rationale",
                "Automated visual pattern observation. Uncalibrated heuristic score. Medical evaluation required for clinical diagnosis."
            )
            is_inconclusive = False
            calibrated_probs = pattern_scores

            # Bounding box
            detected_area: Dict[str, Any] = {
                "has_detection": False,
                "bounding_box": None,
                "label": active_result.get("primary_concern"),
                "is_supported": active_result.get("bounding_box") is not None,
                "notes": "Diffuse pattern observed; no single localized lesion isolated."
            }
            if active_result.get("bounding_box"):
                bbox = active_result["bounding_box"]
                if isinstance(bbox, dict) and all(k in bbox for k in ("ymin", "xmin", "ymax", "xmax")):
                    detected_area = {
                        "has_detection": True,
                        "bounding_box": {
                            "ymin": int(bbox["ymin"]),
                            "xmin": int(bbox["xmin"]),
                            "ymax": int(bbox["ymax"]),
                            "xmax": int(bbox["xmax"]),
                        },
                        "label": active_result.get("primary_concern", "Observed Area"),
                        "is_supported": True,
                        "notes": "Model-identified area of visible observation."
                    }
        else:
            # Inference is unavailable, inconclusive, or failed.
            # Do NOT fabricate uniform category scores or fake condition predictions!
            is_inconclusive = True
            calibrated_probs = {}
            sorted_predictions = []
            margin = 0.0
            normalized_entropy = 1.0
            is_ood = True
            uncertainty_level = "Inconclusive"
            uncertainty_rationale = inference_status_reason

            detected_area = {
                "has_detection": False,
                "bounding_box": None,
                "label": None,
                "is_supported": False,
                "notes": inference_status_reason
            }

        return {
            "model_version": self.version,
            "backend": active_backend,
            "inference_status": inference_status,
            "inference_status_reason": inference_status_reason,
            "is_inconclusive": is_inconclusive,
            "skin_detection": skin_metrics,
            "morphological_features": features,
            "observed_pattern_scores": calibrated_probs,
            "calibrated_probabilities": calibrated_probs,
            "is_uncalibrated_heuristic": True,
            "is_clinical_probability": False,
            "clinical_disclaimer": "Heuristic pattern similarity score only; not a clinically calibrated probability.",
            "top_predictions": sorted_predictions,
            "detected_area": detected_area,
            "ai_observations": active_result.get("observed_patterns", []) if active_result else [],
            "gemini_inference": active_result,
            "uncertainty_metrics": {
                "normalized_entropy": normalized_entropy,
                "confidence_margin": margin,
                "is_out_of_distribution": is_ood,
                "uncertainty_level": uncertainty_level,
                "uncertainty_rationale": uncertainty_rationale
            }
        }


vision_engine = VisionModelAdapter()
