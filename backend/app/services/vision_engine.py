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
from app.services.dinov2_classifier import dinov2_classifier, get_dinov2_class_metadata

logger = logging.getLogger(__name__)

# Supported visual pattern families - includes all 31 DINOv2 classes plus clinical patterns
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
    },
    "herpes_simplex": {
        "id": "herpes_simplex",
        "name": "Herpes Simplex (Viral Blister Pattern)",
        "category": "Cutaneous Viral Infection",
        "typical_features": ["grouped vesicles", "burning sensation", "erythematous base"],
        "base_concordance": "High in perioral, mucosal, or localized epidermal areas"
    },
    "impetigo": {
        "id": "impetigo",
        "name": "Impetigo (Bacterial Crusting Pattern)",
        "category": "Cutaneous Bacterial Infection",
        "typical_features": ["honey-colored crusting", "superficial erosions", "fragile bullae"],
        "base_concordance": "High in facial, perinasal, or exposed extremity regions"
    },
    "lichen_planus": {
        "id": "lichen_planus",
        "name": "Lichen Planus (Violaceous Papule Pattern)",
        "category": "Inflammatory Papulosquamous Dermatosis",
        "typical_features": ["pruritic violaceous polygonal flat-topped papules", "Wickham striae"],
        "base_concordance": "High on flexor wrists, ankles, and lumbar region"
    },
    "molluscum_contagiosum": {
        "id": "molluscum_contagiosum",
        "name": "Molluscum Contagiosum (Viral Papule Pattern)",
        "category": "Cutaneous Viral Infection",
        "typical_features": ["firm dome-shaped papules", "central umbilication", "pearly surface"],
        "base_concordance": "High in pediatric and intertriginous flexural distributions"
    },
    "pityriasis_rosea": {
        "id": "pityriasis_rosea",
        "name": "Pityriasis Rosea (Herald Patch Pattern)",
        "category": "Acute Exanthematous Dermatosis",
        "typical_features": ["herald patch", "collarette of scale", "Christmas tree distribution"],
        "base_concordance": "High along Langer's cleavage lines on trunk"
    },
    "pediculosis_capitis": {
        "id": "pediculosis_capitis",
        "name": "Pediculosis Capitis (Head Lice Infestation)",
        "category": "Parasitic Ectoparasitosis",
        "typical_features": ["excoriation marks", "nits on hair shafts", "scalp pruritus"],
        "base_concordance": "High in scalp and retroauricular regions"
    },
    "larva_migrans": {
        "id": "larva_migrans",
        "name": "Cutaneous Larva Migrans (Parasitic Track Pattern)",
        "category": "Parasitic Cutaneous Infestation",
        "typical_features": ["serpiginous erythematous linear track", "intense itching"],
        "base_concordance": "High on feet, buttocks, or extremities following sand/soil exposure"
    },
    "tungiasis": {
        "id": "tungiasis",
        "name": "Tungiasis (Flea Ectoparasitosis Pattern)",
        "category": "Parasitic Ectoparasitosis",
        "typical_features": ["punctiform nodule with central black dot", "periungual papule"],
        "base_concordance": "High on plantar foot, periungual margins"
    },
    "papilomatosis_confluentes": {
        "id": "papilomatosis_confluentes",
        "name": "Confluent and Reticulated Papillomatosis Pattern",
        "category": "Rare Reticulated Dermatosis",
        "typical_features": ["reticulated brown macules", "central confluent plaques"],
        "base_concordance": "High on interscapular and epigastric trunk"
    },
    "unsupported_specialized_condition": {
        "id": "unsupported_specialized_condition",
        "name": "Specialized Dermatosis (Doctor Evaluation Required)",
        "category": "Specialized Medical Dermatosis",
        "typical_features": ["complex morphological pattern", "systemic/genetic features"],
        "base_concordance": "Requires in-person clinical examination and diagnostic testing"
    }
}


class SkinRegionDetector:
    """
    Biomedical skin-region identification and lesion localization across diverse Fitzpatrick phototypes (I to VI).
    Combines multi-color space chromaticity (YCbCr, normalized RGB, and HSV) with local luminance and texture metrics.
    Prevents out-of-distribution processing of non-skin images (e.g. documents, landscapes, pets).
    """

    @staticmethod
    def get_skin_mask(arr_rgb: np.ndarray) -> np.ndarray:
        """
        Computes binary skin mask using normalized chromaticity and multi-color-space rules
        robust across Fitzpatrick I-VI without relying exclusively on fixed RGB thresholds.
        """
        r = arr_rgb[:, :, 0].astype(np.float32)
        g = arr_rgb[:, :, 1].astype(np.float32)
        b = arr_rgb[:, :, 2].astype(np.float32)

        # 1. Standard ITU-R BT.601 conversion to YCbCr with melanin-inclusive bounds
        y = 0.299 * r + 0.587 * g + 0.114 * b
        cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b
        cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b

        ycbcr_mask = (y > 15) & (cb >= 68) & (cb <= 145) & (cr >= 120) & (cr <= 188)

        # 2. Normalized RGB space (Kovac / Peer chromaticity locus across light and dark tones)
        sum_rgb = r + g + b + 1e-5
        r_norm = r / sum_rgb
        g_norm = g / sum_rgb
        norm_rgb_mask = (r_norm > 0.33) & (g_norm >= 0.20) & (g_norm <= 0.38) & (r >= g) & ((r - g) >= 3)

        # 3. HSV rule for melanin and light tones, plus red erythema wrapping around 360 degrees
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

        hsv_mask = ((h <= 55) | (h >= 330)) & (s >= 0.08) & (s <= 0.88) & (v >= 0.08)

        combined_mask = (ycbcr_mask | norm_rgb_mask) & (hsv_mask | norm_rgb_mask)
        return combined_mask

    @classmethod
    def evaluate_skin_presence(cls, arr_rgb: np.ndarray) -> Tuple[bool, float, Dict[str, Any]]:
        combined_mask = cls.get_skin_mask(arr_rgb)
        skin_pixel_count = int(np.count_nonzero(combined_mask))
        total_pixels = int(combined_mask.size)
        coverage_ratio = round(skin_pixel_count / max(1, total_pixels), 3)

        # Minimum 8% skin coverage required to consider photo a valid dermatological intake
        is_skin = coverage_ratio >= 0.08

        return is_skin, coverage_ratio, {
            "skin_coverage_ratio": coverage_ratio,
            "skin_detected": is_skin,
            "phototype_spectrum_evaluated": "Fitzpatrick I–VI (Universal YCbCr/NormRGB/HSV)",
        }

    @classmethod
    def segment_lesion_region(
        cls, arr_rgb: np.ndarray, skin_mask: Optional[np.ndarray] = None
    ) -> Tuple[Optional[np.ndarray], Optional[Dict[str, int]]]:
        """
        Segments the primary affected dermatological lesion from surrounding normal skin.
        Identifies contrast deviation (pigmentation or erythema) relative to background skin median.
        """
        if skin_mask is None:
            skin_mask = cls.get_skin_mask(arr_rgb)

        if not np.any(skin_mask):
            return None, None

        skin_pixels = arr_rgb[skin_mask]
        median_skin = np.median(skin_pixels, axis=0)

        # Color Euclidean distance from background skin median
        diff = arr_rgb - median_skin
        color_dist = np.sqrt(np.sum(diff ** 2, axis=2))

        # Erythema contrast relative to skin median
        r = arr_rgb[:, :, 0]
        gb = (arr_rgb[:, :, 1] + arr_rgb[:, :, 2]) / 2.0 + 1e-5
        erythema_ratio = r / gb
        base_erythema = float(np.median(erythema_ratio[skin_mask]))
        erythema_delta = np.maximum(0.0, erythema_ratio - base_erythema)

        candidate_lesion = skin_mask & ((color_dist > 18.0) | (erythema_delta > 0.15))
        lesion_count = int(np.count_nonzero(candidate_lesion))

        total_skin = int(np.count_nonzero(skin_mask))
        if lesion_count < max(30, int(total_skin * 0.003)) or lesion_count > int(total_skin * 0.85):
            return None, None

        rows, cols = np.where(candidate_lesion)
        ymin, ymax = int(np.min(rows)), int(np.max(rows))
        xmin, xmax = int(np.min(cols)), int(np.max(cols))

        bbox = {"ymin": ymin, "xmin": xmin, "ymax": ymax, "xmax": xmax}
        return candidate_lesion, bbox


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

    def __init__(self, model_name: str = "SkinWise-Multimodal-Vision-v4.2", primary_provider: Optional[str] = None):
        self.model_name = model_name
        self.version = "4.2.1-derm-triage"
        # Consistently read from settings.GEMINI_API_KEY with environment fallback
        raw_key = getattr(settings, "GEMINI_API_KEY", "") or os.environ.get("GEMINI_API_KEY", "")
        self.api_key: Optional[str] = "" if raw_key == "YOUR_GEMINI_API_KEY" else (raw_key.strip() if raw_key else None)
        self.primary_provider = primary_provider
        self.is_loaded = True
        self.backend_type = (
            "Gemini-3.5-Flash Multimodal Vision Engine"
            if self.is_configured()
            else "DINOv2 Base Vision Transformer (Jayanth2002/dinov2-base-finetuned-SkinDisease)"
        )

    def is_configured(self) -> bool:
        key = self.api_key if getattr(self, "api_key", None) is not None else (getattr(settings, "GEMINI_API_KEY", "") or os.environ.get("GEMINI_API_KEY", ""))
        if key == "YOUR_GEMINI_API_KEY":
            return False
        return bool(key and len(key.strip()) > 5)

    def _get_api_key(self) -> str:
        key = self.api_key if getattr(self, "api_key", None) is not None else (getattr(settings, "GEMINI_API_KEY", "") or os.environ.get("GEMINI_API_KEY", ""))
        if key == "YOUR_GEMINI_API_KEY":
            return ""
        return key.strip()

    def health_check(self) -> Dict[str, Any]:
        return {
            "status": "healthy" if self.is_loaded else "degraded",
            "model_name": self.model_name,
            "version": self.version,
            "backend": self.backend_type,
            "has_remote_model": self.is_configured(),
            "timestamp": time.time()
        }

    def extract_morphological_features(self, arr: np.ndarray, skin_mask: Optional[np.ndarray] = None) -> Dict[str, float]:
        """
        Extracts objective clinical morphological parameters (ABCD Rule):
        - Asymmetry index calculated from localized lesion mask/crop (0 to 1)
        - Border irregularity variance along the lesion boundary contour
        - Color variegation entropy across lesion color distributions
        - Erythema saturation index
        """
        # Segment lesion region from normal surrounding skin
        lesion_mask, bbox = SkinRegionDetector.segment_lesion_region(arr, skin_mask)

        # 1. Asymmetry: Computed on the localized lesion mask/crop rather than rectangular photo
        if lesion_mask is not None and bbox is not None:
            ymin, ymax, xmin, xmax = bbox["ymin"], bbox["ymax"], bbox["xmin"], bbox["xmax"]
            h, w, _ = arr.shape
            ymin_c = max(0, ymin - 2)
            ymax_c = min(h, ymax + 3)
            xmin_c = max(0, xmin - 2)
            xmax_c = min(w, xmax + 3)

            cropped_mask = lesion_mask[ymin_c:ymax_c, xmin_c:xmax_c].astype(np.float32)
            lr_flipped = np.fliplr(cropped_mask)
            ud_flipped = np.flipud(cropped_mask)

            union_lr = np.sum(np.maximum(cropped_mask, lr_flipped)) + 1e-5
            diff_lr = np.sum(np.abs(cropped_mask - lr_flipped))
            asym_lr = diff_lr / union_lr

            union_ud = np.sum(np.maximum(cropped_mask, ud_flipped)) + 1e-5
            diff_ud = np.sum(np.abs(cropped_mask - ud_flipped))
            asym_ud = diff_ud / union_ud

            asymmetry_score = round(float((asym_lr + asym_ud) / 2.0), 3)

            # 2. Border Irregularity via gradient of cropped lesion
            cropped_rgb = arr[ymin_c:ymax_c, xmin_c:xmax_c]
            gray = 0.299 * cropped_rgb[:, :, 0] + 0.587 * cropped_rgb[:, :, 1] + 0.114 * cropped_rgb[:, :, 2]
            gx, gy = np.gradient(gray)
            grad_norm = np.sqrt(gx**2 + gy**2)
            border_irregularity = round(float(np.std(grad_norm) / 50.0), 3)

            # 3. Color Variegation on localized lesion pixels
            lesion_pixels = arr[lesion_mask]
            entropy_sum = 0.0
            for c in range(3):
                hist, _ = np.histogram(lesion_pixels[:, c], bins=16, range=(0, 256), density=True)
                hist = hist[hist > 0]
                entropy_sum += -np.sum(hist * np.log2(hist))
            color_entropy = round(float(entropy_sum / 3.0), 3)

            # 4. Erythema Saturation on localized lesion pixels
            r_l = lesion_pixels[:, 0].astype(np.float32)
            total_l = np.sum(lesion_pixels, axis=1) + 1e-5
            erythema_saturation = round(float(np.mean(r_l / total_l)), 3)
        else:
            # Fallback when no localized focal lesion is segmented (e.g. diffuse rash / uniform skin)
            if skin_mask is not None and np.any(skin_mask):
                target_pixels = arr[skin_mask]
            else:
                target_pixels = arr.reshape(-1, 3)

            gray = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
            gx, gy = np.gradient(gray)
            grad_norm = np.sqrt(gx**2 + gy**2)
            border_irregularity = round(float(np.std(grad_norm) / 50.0), 3)

            lr_diff = np.mean(np.abs(arr - np.fliplr(arr))) / 255.0
            ud_diff = np.mean(np.abs(arr - np.flipud(arr))) / 255.0
            asymmetry_score = round(float((lr_diff + ud_diff) / 2.0), 3)

            entropy_sum = 0.0
            for c in range(3):
                hist, _ = np.histogram(target_pixels[:, c], bins=16, range=(0, 256), density=True)
                hist = hist[hist > 0]
                entropy_sum += -np.sum(hist * np.log2(hist))
            color_entropy = round(float(entropy_sum / 3.0), 3)

            r_p = target_pixels[:, 0].astype(np.float32)
            total_p = np.sum(target_pixels, axis=1) + 1e-5
            erythema_saturation = round(float(np.mean(r_p / total_p)), 3)

        return {
            "asymmetry_score": asymmetry_score,
            "border_irregularity": border_irregularity,
            "color_entropy": color_entropy,
            "erythema_saturation": erythema_saturation,
            "has_localized_lesion": bool(lesion_mask is not None)
        }

    def get_ai_engine_status(self) -> Dict[str, Any]:
        """
        Check and monitor live operational availability of integrated AI engines (Gemini and Hugging Face).
        """
        gemini_ready = self.is_configured()
        hf_ready = huggingface_adapter.is_configured()
        primary = getattr(settings, "PRIMARY_AI_PROVIDER", "gemini")
        hf_fallback_enabled = getattr(settings, "ENABLE_HUGGINGFACE_FALLBACK", False)

        return {
            "primary_provider": primary,
            "gemini": {
                "model_id": getattr(settings, "GEMINI_MODEL", "gemini-3.5-flash-lite"),
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
        """Maps Hugging Face DINOv2 labels to unified triage categories using 31-class metadata."""
        if not label:
            return None
        meta = get_dinov2_class_metadata(label)
        category_id = meta.get("category_id")
        if category_id and category_id in SUPPORTED_CONDITIONS:
            return category_id
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
        return category_id or "unsupported_specialized_condition"

    def _infer_with_dinov2(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Inference using the evaluated DINOv2 skin disease model:
        1. Attempts local PyTorch inference with singleton DINOv2SkinClassifier.
        2. Falls back to remote Hugging Face adapter if local model is unavailable or unconfigured.
        """
        try:
            local_res = dinov2_classifier.predict(image_bytes)
            if local_res.get("success"):
                top_label = local_res.get("top_label")
                top_score = local_res.get("top_score", 0.0)
                top_predictions = local_res.get("top_predictions", [])
                mapped_cat = local_res.get("mapped_category")
                track = local_res.get("track", "")
                
                if mapped_cat != "inconclusive" and top_score >= 0.20:
                    conf = "High" if top_score > 0.65 else "Moderate" if top_score > 0.35 else "Low"
                    return {
                        "status": "successful",
                        "status_reason": f"Visual pattern matched via DINOv2 model ({top_label}, {round(top_score*100, 1)}%).",
                        "matched_category": mapped_cat,
                        "primary_concern": local_res.get("top_display_name", top_label),
                        "observed_patterns": [f"{p['label']} ({p['confidence_pct']}%) - {p['track']}" for p in top_predictions],
                        "bounding_box": None,
                        "confidence_assessment": conf,
                        "uncertainty_rationale": (
                            f"Statistical feature similarity from DINOv2 model ({track}). "
                            f"Top candidate: {top_label} (model score {top_score:.2f}). "
                            "Model does not perform pixel localization. Physical clinical examination required."
                        ),
                        "predictions": top_predictions,
                        "top_score": top_score,
                        "raw_model_response": local_res
                    }
                else:
                    return {
                        "status": "inconclusive",
                        "status_reason": f"DINOv2 model returned ambiguous classification (top score {top_score:.2f} for {top_label}).",
                        "matched_category": None,
                        "primary_concern": "Inconclusive Visual Observation",
                        "observed_patterns": [f"Ambiguous prediction: {top_label} ({round(top_score*100, 1)}%)"],
                        "bounding_box": None,
                        "confidence_assessment": "Inconclusive",
                        "uncertainty_rationale": "Model confidence is below reliable classification threshold.",
                        "predictions": top_predictions,
                        "top_score": top_score,
                        "raw_model_response": local_res
                    }
        except Exception as e:
            logger.warning("Local DINOv2 inference error: %s; evaluating remote Hugging Face adapter.", str(e))

        # Remote adapter fallback
        return self._infer_with_huggingface(image_bytes)

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
                meta = get_dinov2_class_metadata(top_label)
                display_name = meta.get("display_name") or (SUPPORTED_CONDITIONS.get(matched_cat, {}).get("name") if matched_cat in SUPPORTED_CONDITIONS else top_label)
                return {
                    "status": "successful",
                    "status_reason": f"Visual pattern matched via Hugging Face DINOv2 model ({top_label}).",
                    "matched_category": matched_cat,
                    "primary_concern": display_name,
                    "observed_patterns": [f"DINOv2 classification: {p.get('label')} ({round(p.get('score', 0.0) * 100, 1)}%)" for p in hf_res.get("predictions", [])],
                    "bounding_box": None,
                    "confidence_assessment": conf,
                    "uncertainty_rationale": (
                        "Statistical feature similarity from DINOv2 image classification model. "
                        "Localization is unsupported. In-person clinical dermatological evaluation required."
                    ),
                    "predictions": hf_res.get("predictions", []),
                    "top_score": top_score,
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
                    "predictions": hf_res.get("predictions", []),
                    "top_score": top_score,
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

            model_name = getattr(settings, "GEMINI_MODEL", None) or os.getenv("GEMINI_MODEL", getattr(settings, "AI_MODEL_BACKBONE", "gemini-1.5-flash"))
            api_key = self._get_api_key()
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
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

        # 2. Objective Morphological Metrics (Localized Lesion-Mask Crop)
        skin_mask = SkinRegionDetector.get_skin_mask(arr) if is_skin else None
        features = self.extract_morphological_features(arr, skin_mask=skin_mask)

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

        # 3. Model Inference Pipeline
        primary_provider = getattr(settings, "PRIMARY_AI_PROVIDER", "dinov2").lower().strip()
        enable_hf_fallback = getattr(settings, "ENABLE_HUGGINGFACE_FALLBACK", True)
        
        active_result = None
        active_backend = self.backend_type
        supplementary_gemini = None

        if primary_provider in ("dinov2", "huggingface", "local"):
            # Try DINOv2 classifier (local model first, remote HF adapter fallback)
            active_result = self._infer_with_dinov2(image_bytes)
            active_backend = "DINOv2 Base Vision Transformer (Jayanth2002/dinov2-base-finetuned-SkinDisease)"
            
            # If DINOv2 inference was unconfigured or failed, evaluate Gemini fallback
            if active_result["status"] != "successful" and self.is_configured():
                logger.info("DINOv2 inference unavailable/failed; evaluating fallback to Gemini multimodal vision.")
                gemini_res = self._infer_with_gemini(image_bytes)
                if gemini_res["status"] == "successful":
                    active_result = gemini_res
                    active_backend = "Gemini-3.5-Flash Multimodal Vision Engine (Fallback)"
            elif active_result["status"] == "successful" and self.is_configured():
                # Supplementary Gemini call for natural-language observations and localization overlay
                try:
                    supplementary_gemini = self._infer_with_gemini(image_bytes)
                except Exception as e:
                    logger.debug("Supplementary Gemini visual observation call skipped: %s", e)
        else:
            # Primary: Gemini
            active_result = self._infer_with_gemini(image_bytes)
            active_backend = "Gemini-3.5-Flash Multimodal Vision Engine"
            # Fallback to DINOv2 if Gemini is unavailable/failed and fallback is enabled
            if (
                active_result["status"] in ("unavailable", "failed")
                and enable_hf_fallback
            ):
                logger.info("Gemini unavailable/failed; evaluating fallback to DINOv2 vision adapter.")
                dino_res = self._infer_with_dinov2(image_bytes)
                if dino_res["status"] == "successful":
                    active_result = dino_res
                    active_backend = "DINOv2 Base Vision Transformer (Fallback)"

        inference_status = active_result["status"]
        inference_status_reason = active_result["status_reason"]

        if inference_status == "successful":
            matched_cat = active_result.get("matched_category")
            predictions = active_result.get("predictions", [])
            
            pattern_scores = {}
            # Extract genuine predictions from model
            if predictions and isinstance(predictions, list):
                for p in predictions:
                    label = p.get("label", "")
                    score = round(float(p.get("score", 0.0)), 4)
                    cat = p.get("category_id") or self._map_hf_label_to_category(label)
                    if cat and cat in SUPPORTED_CONDITIONS:
                        pattern_scores[cat] = max(pattern_scores.get(cat, 0.0), score)

            # Ensure the primary matched category is preserved with its true score
            if matched_cat and matched_cat in SUPPORTED_CONDITIONS:
                if matched_cat not in pattern_scores or pattern_scores[matched_cat] == 0.0:
                    top_score = round(float(active_result.get("top_score", 0.50)), 4)
                    pattern_scores[matched_cat] = top_score

            # Build sorted predictions from genuine model scores
            if pattern_scores:
                sorted_predictions = sorted(pattern_scores.items(), key=lambda x: x[1], reverse=True)
            elif predictions:
                sorted_predictions = [
                    (p.get("label", "Unknown"), round(float(p.get("score", 0.0)), 4))
                    for p in predictions[:5]
                ]
            else:
                top_score = round(float(active_result.get("top_score", 0.50)), 4)
                sorted_predictions = [(matched_cat, top_score)]

            top1_score = sorted_predictions[0][1] if sorted_predictions else 0.50
            top2_score = sorted_predictions[1][1] if len(sorted_predictions) > 1 else 0.0
            margin = round(top1_score - top2_score, 3)

            # Calculate normalized Shannon entropy over non-zero predictions
            non_zero_scores = [v for v in pattern_scores.values() if v > 0]
            if len(non_zero_scores) > 1 and sum(non_zero_scores) > 0:
                total_sum = sum(non_zero_scores)
                norm_probs = [v / total_sum for v in non_zero_scores]
                entropy = -sum(p * math.log2(p) for p in norm_probs if p > 0)
                max_entropy = math.log2(len(non_zero_scores))
                normalized_entropy = round(min(1.0, max(0.0, entropy / max_entropy)), 3)
            else:
                normalized_entropy = 0.35

            is_ood = False
            uncertainty_level = active_result.get("confidence_assessment", "Moderate")
            uncertainty_rationale = active_result.get(
                "uncertainty_rationale",
                "Automated visual pattern observation. Uncalibrated model score. Medical evaluation required for clinical diagnosis."
            )
            is_inconclusive = False
            calibrated_probs = pattern_scores

            # Bounding box & localized area
            bbox_candidate = active_result.get("bounding_box") or (
                supplementary_gemini.get("bounding_box") if supplementary_gemini else None
            )
            detected_area: Dict[str, Any] = {
                "has_detection": False,
                "bounding_box": None,
                "label": active_result.get("primary_concern"),
                "is_supported": False,
                "notes": "Localization overlay is not supported by the DINOv2 image classification architecture."
            }
            if bbox_candidate and isinstance(bbox_candidate, dict) and all(k in bbox_candidate for k in ("ymin", "xmin", "ymax", "xmax")):
                detected_area = {
                    "has_detection": True,
                    "bounding_box": {
                        "ymin": int(bbox_candidate["ymin"]),
                        "xmin": int(bbox_candidate["xmin"]),
                        "ymax": int(bbox_candidate["ymax"]),
                        "xmax": int(bbox_candidate["xmax"]),
                    },
                    "label": active_result.get("primary_concern", "Observed Area"),
                    "is_supported": True,
                    "notes": "Model-identified area of visible observation."
                }
            
            # Aggregate AI observations
            observations = list(active_result.get("observed_patterns", []))
            if supplementary_gemini and supplementary_gemini.get("observed_patterns"):
                for obs in supplementary_gemini["observed_patterns"]:
                    if obs not in observations:
                        observations.append(obs)
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
            observations = []

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
            "ai_observations": observations,
            "gemini_inference": supplementary_gemini or active_result,
            "uncertainty_metrics": {
                "normalized_entropy": normalized_entropy,
                "confidence_margin": margin,
                "is_out_of_distribution": is_ood,
                "uncertainty_level": uncertainty_level,
                "uncertainty_rationale": uncertainty_rationale
            }
        }


vision_engine = VisionModelAdapter()
