import io
import os
import logging
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image
import numpy as np
from app.core.config import settings

logger = logging.getLogger(__name__)

# 31 genuine fine-tuned class labels from Jayanth2002/dinov2-base-finetuned-SkinDisease config.json
DINOV2_CLASSES: Dict[int, str] = {
    0: "Basal Cell Carcinoma",
    1: "Darier_s Disease",
    2: "Epidermolysis Bullosa Pruriginosa",
    3: "Hailey-Hailey Disease",
    4: "Herpes Simplex",
    5: "Impetigo",
    6: "Larva Migrans",
    7: "Leprosy Borderline",
    8: "Leprosy Lepromatous",
    9: "Leprosy Tuberculoid",
    10: "Lichen Planus",
    11: "Lupus Erythematosus Chronicus Discoides",
    12: "Melanoma",
    13: "Molluscum Contagiosum",
    14: "Mycosis Fungoides",
    15: "Neurofibromatosis",
    16: "Papilomatosis Confluentes And Reticulate",
    17: "Pediculosis Capitis",
    18: "Pityriasis Rosea",
    19: "Porokeratosis Actinic",
    20: "Psoriasis",
    21: "Tinea Corporis",
    22: "Tinea Nigra",
    23: "Tungiasis",
    24: "actinic keratosis",
    25: "dermatofibroma",
    26: "nevus",
    27: "pigmented benign keratosis",
    28: "seborrheic keratosis",
    29: "squamous cell carcinoma",
    30: "vascular lesion"
}

# Track A: Common Inflammatory & Infectious Conditions
TRACK_A_CLASSES = {
    "Psoriasis",
    "Tinea Corporis",
    "Tinea Nigra",
    "Herpes Simplex",
    "Impetigo",
    "Lichen Planus",
    "Pityriasis Rosea",
    "Molluscum Contagiosum",
    "Darier_s Disease",
    "Hailey-Hailey Disease",
    "Epidermolysis Bullosa Pruriginosa",
    "Larva Migrans",
    "Leprosy Borderline",
    "Leprosy Lepromatous",
    "Leprosy Tuberculoid",
    "Lupus Erythematosus Chronicus Discoides",
    "Pediculosis Capitis",
    "Papilomatosis Confluentes And Reticulate",
    "Tungiasis"
}

# Track B: Lesions - Benign
TRACK_B_BENIGN_CLASSES = {
    "nevus",
    "dermatofibroma",
    "seborrheic keratosis",
    "pigmented benign keratosis",
    "vascular lesion",
    "Neurofibromatosis"
}

# Track B: Lesions - Concerning / Pre-malignant / Malignant (requires prompt clinical exam)
TRACK_B_CONCERNING_CLASSES = {
    "Melanoma",
    "Basal Cell Carcinoma",
    "squamous cell carcinoma",
    "actinic keratosis",
    "Porokeratosis Actinic",
    "Mycosis Fungoides"
}

def map_dinov2_label_to_clinical_category(label: str) -> Tuple[str, str, str]:
    """
    Maps a DINOv2 predicted class label to:
    (triage_category_id, track_name, clinical_display_name)
    """
    l = label.strip()

    # Track B: Concerning Lesions
    if l in TRACK_B_CONCERNING_CLASSES or any(k in l.lower() for k in ("melanoma", "carcinoma", "actinic")):
        return (
            "suspicious_dysplastic_lesion",
            "Track B: Pigmented/Non-Pigmented Lesions (Requires Clinical Evaluation)",
            f"{l} (Clinical Evaluation Recommended)"
        )

    # Track B: Benign Lesions
    if l in TRACK_B_BENIGN_CLASSES or any(k in l.lower() for k in ("nevus", "mole", "keratosis", "dermatofibroma", "vascular")):
        return (
            "benign_melanocytic_macule",
            "Track B: Pigmented/Non-Pigmented Lesions (Likely Benign)",
            f"{l} (Common Benign Feature Pattern)"
        )

    # Track A: Specific Psoriasis
    if "psoriasis" in l.lower():
        return (
            "psoriasis",
            "Track A: Common Inflammatory Dermatoses",
            "Psoriasis / Scaly Plaque Pattern"
        )

    # Track A: Specific Fungal Tinea
    if "tinea" in l.lower() or "fung" in l.lower():
        return (
            "fungal_tinea",
            "Track A: Superficial Cutaneous Infections",
            f"{l} (Superficial Fungal Pattern)"
        )

    # Track A: Other inflammatory / infectious conditions
    if l in TRACK_A_CLASSES:
        return (
            "eczema_contact_dermatitis",
            "Track A: Common Inflammatory Dermatoses",
            f"{l} (Inflammatory Dermatosis Pattern)"
        )

    return (
        "inconclusive",
        "Track C: Unclassified Pattern",
        f"Uncategorized Pattern: {l}"
    )


class DINOv2SkinClassifier:
    """
    Singleton AI Computer-Vision Engine for Skin Disease Classification.
    Evaluated model: Jayanth2002/dinov2-base-finetuned-SkinDisease
    
    Architecture:
    - Vision Transformer (DINOv2-Base) fine-tuned on 31 dermatology conditions.
    - Operates on 224x224 RGB image input with ImageNet normalization.
    - Yields genuine softmax probabilities over all 31 classes.
    - Supports GPU (CUDA) when available, gracefully falling back to CPU.
    - Cached singleton to prevent reloading model weights on every request.
    - NEVER fabricates confidence scores. All outputs are uncalibrated model logits/softmax.
    - Localization capability: Classification only. Does not support segmentation or bounding boxes.
    """

    _instance: Optional["DINOv2SkinClassifier"] = None

    def __init__(self):
        self.model_id = settings.HF_MODEL_ID
        self.version = "DINOv2-Base-31Class-v1.0"
        self._model = None
        self._processor = None
        self._device = None
        self._is_initialized = False
        self._init_error: Optional[str] = None

    @classmethod
    def get_instance(cls) -> "DINOv2SkinClassifier":
        if cls._instance is None:
            cls._instance = DINOv2SkinClassifier()
        return cls._instance

    def _initialize_device(self):
        try:
            import torch
            self._device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            logger.info("DINOv2 Classifier selected compute device: %s", self._device)
        except Exception as e:
            logger.warning("Could not determine PyTorch compute device, defaulting to CPU: %s", e)
            self._device = "cpu"

    def is_loaded(self) -> bool:
        return self._model is not None and self._processor is not None

    def load_model(self) -> bool:
        """
        Loads the fine-tuned DINOv2 model and image processor.
        Cached in memory as a singleton across API requests.
        """
        if self.is_loaded():
            return True

        self._initialize_device()

        try:
            from transformers import AutoImageProcessor, AutoModelForImageClassification
            import torch

            logger.info("Loading DINOv2 skin classifier model: %s", self.model_id)
            
            # Load processor (cached locally by huggingface_hub)
            self._processor = AutoImageProcessor.from_pretrained(
                self.model_id,
                timeout=15.0
            )

            # Load model weights
            model = AutoModelForImageClassification.from_pretrained(
                self.model_id,
                timeout=30.0
            )
            model.to(self._device)
            model.eval()
            self._model = model

            self._is_initialized = True
            self._init_error = None
            logger.info("DINOv2 skin classifier successfully loaded on %s", self._device)
            return True

        except Exception as err:
            err_msg = f"Failed to load local DINOv2 model ({type(err).__name__}): {str(err)}"
            logger.warning(err_msg)
            self._init_error = err_msg
            return False

    def predict(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Performs genuine forward pass through DINOv2 model.
        Returns top predictions with true softmax probabilities.
        """
        # 1. Image Preprocessing
        try:
            pil_img = Image.open(io.BytesIO(image_bytes))
            if pil_img.mode != "RGB":
                pil_img = pil_img.convert("RGB")
        except Exception as img_err:
            return {
                "success": False,
                "status": "invalid_image",
                "error": f"Failed to decode image: {str(img_err)}",
                "predictions": []
            }

        # 2. Ensure model is loaded
        if not self.is_loaded():
            loaded = self.load_model()
            if not loaded:
                return {
                    "success": False,
                    "status": "model_unavailable",
                    "error": self._init_error or "Model weights could not be loaded into memory.",
                    "predictions": []
                }

        # 3. Model Inference (Genuine forward pass)
        try:
            import torch

            inputs = self._processor(images=pil_img, return_tensors="pt")
            inputs = {k: v.to(self._device) for k, v in inputs.items()}

            with torch.no_grad():
                outputs = self._model(**inputs)
                logits = outputs.logits
                probs = torch.softmax(logits, dim=-1).squeeze(0).cpu().numpy()

            # Rank classes by score descending
            ranked_indices = np.argsort(probs)[::-1]
            top_predictions: List[Dict[str, Any]] = []

            for idx in ranked_indices[:5]:
                class_name = self._model.config.id2label.get(int(idx), DINOV2_CLASSES.get(int(idx), f"Class_{idx}"))
                score = float(probs[idx])
                cat_id, track_name, display_name = map_dinov2_label_to_clinical_category(class_name)

                top_predictions.append({
                    "label": class_name,
                    "display_name": display_name,
                    "score": round(score, 4),
                    "confidence_pct": round(score * 100, 1),
                    "category_id": cat_id,
                    "track": track_name
                })

            top1 = top_predictions[0]
            top1_score = top1["score"]
            top2_score = top_predictions[1]["score"] if len(top_predictions) > 1 else 0.0
            confidence_margin = round(top1_score - top2_score, 3)

            # Rejection threshold for low confidence / ambiguous images
            is_ambiguous = top1_score < 0.20

            return {
                "success": True,
                "status": "completed",
                "model_id": self.model_id,
                "model_version": self.version,
                "device": str(self._device),
                "is_ambiguous": is_ambiguous,
                "top_label": top1["label"],
                "top_display_name": top1["display_name"],
                "top_score": top1["score"],
                "mapped_category": top1["category_id"] if not is_ambiguous else "inconclusive",
                "track": top1["track"],
                "confidence_margin": confidence_margin,
                "top_predictions": top_predictions,
                "supports_localization": False,
                "supports_segmentation": False,
                "is_uncalibrated_heuristic": True,
                "is_clinical_probability": False,
                "clinical_disclaimer": (
                    "Model scores represent uncalibrated statistical feature similarities from the DINOv2 vision transformer, "
                    "not clinically verified probabilities of disease. Ordinary photographs cannot establish a diagnosis."
                )
            }

        except Exception as infer_err:
            logger.error("DINOv2 inference error: %s", str(infer_err))
            return {
                "success": False,
                "status": "inference_error",
                "error": f"Inference execution failed: {str(infer_err)}",
                "predictions": []
            }

dinov2_classifier = DINOv2SkinClassifier.get_instance()

