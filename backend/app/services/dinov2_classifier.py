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

# Explicit clinical mapping for each of the 31 DINOv2 classes.
# Preserves original model outputs without forcing unrelated conditions into eczema.
DINOV2_CLASS_METADATA: Dict[str, Dict[str, Any]] = {
    # 1. Infections & Infestations (Track A)
    "Herpes Simplex": {
        "category_id": "herpes_simplex",
        "display_name": "Herpes Simplex (Viral Blister Pattern)",
        "track": "Track A: Cutaneous Viral Infection",
        "is_concerning": False,
        "is_unsupported": False,
        "triage_tier": 2,
        "rationale": "Visual features show localized clustered vesicles or erosion characteristic of herpes simplex virus. An in-person clinical check is advised for targeted antiviral therapy; avoid applying steroid creams."
    },
    "Impetigo": {
        "category_id": "impetigo",
        "display_name": "Impetigo (Bacterial Crusting Pattern)",
        "track": "Track A: Cutaneous Bacterial Infection",
        "is_concerning": False,
        "is_unsupported": False,
        "triage_tier": 2,
        "rationale": "Visual characteristics suggest superficial bacterial honey-colored crusting or vesicles. Medical evaluation is recommended for antibiotic assessment and infection control."
    },
    "Molluscum Contagiosum": {
        "category_id": "molluscum_contagiosum",
        "display_name": "Molluscum Contagiosum (Viral Papule Pattern)",
        "track": "Track A: Cutaneous Viral Infection",
        "is_concerning": False,
        "is_unsupported": False,
        "triage_tier": 2,
        "rationale": "Visual observation indicates small, firm, umbilicated papules consistent with molluscum contagiosum virus. A clinician can confirm and advise on management."
    },
    "Pediculosis Capitis": {
        "category_id": "pediculosis_capitis",
        "display_name": "Pediculosis Capitis (Head Lice Infestation)",
        "track": "Track A: Parasitic Ectoparasitosis",
        "is_concerning": False,
        "is_unsupported": False,
        "triage_tier": 2,
        "rationale": "Pattern features correlate with pediculosis infestation. Healthcare guidance for safe pediculicide treatment and contact hygiene is recommended."
    },
    "Larva Migrans": {
        "category_id": "larva_migrans",
        "display_name": "Cutaneous Larva Migrans (Parasitic Track Pattern)",
        "track": "Track A: Cutaneous Parasitic Infestation",
        "is_concerning": False,
        "is_unsupported": False,
        "triage_tier": 2,
        "rationale": "Serpiginous cutaneous migration patterns suggest cutaneous larva migrans. Requires in-person medical evaluation for appropriate antihelminthic therapy."
    },
    "Tungiasis": {
        "category_id": "tungiasis",
        "display_name": "Tungiasis (Flea Ectoparasitosis Pattern)",
        "track": "Track A: Parasitic Ectoparasitosis",
        "is_concerning": False,
        "is_unsupported": False,
        "triage_tier": 2,
        "rationale": "Pattern consistent with sand flea burrowing. In-person medical examination is necessary for sterile extraction and tetanus prophylaxis."
    },

    # 2. Superficial Fungal Mycoses (Track A)
    "Tinea Corporis": {
        "category_id": "fungal_tinea",
        "display_name": "Tinea Corporis (Fungal / Superficial Ringworm Pattern)",
        "track": "Track A: Superficial Fungal Mycoses",
        "is_concerning": False,
        "is_unsupported": False,
        "triage_tier": 2,
        "rationale": "Annular, scaly active borders observed consistent with dermatophytosis. A doctor can prescribe targeted antifungal medication."
    },
    "Tinea Nigra": {
        "category_id": "fungal_tinea",
        "display_name": "Tinea Nigra (Superficial Fungal Macule Pattern)",
        "track": "Track A: Superficial Fungal Mycoses",
        "is_concerning": False,
        "is_unsupported": False,
        "triage_tier": 2,
        "rationale": "Dematiaceous fungal pigmentation observed. Clinical examination recommended to confirm fungal etiology and rule out melanocytic lesions."
    },

    # 3. Inflammatory & Papulosquamous Dermatoses (Track A)
    "Psoriasis": {
        "category_id": "psoriasis",
        "display_name": "Psoriasis (Scaly Plaque Pattern)",
        "track": "Track A: Common Papulosquamous Dermatoses",
        "is_concerning": False,
        "is_unsupported": False,
        "triage_tier": 2,
        "rationale": "Erythematous plaques with distinctive micaceous silvery scale. Consultation with a doctor or dermatologist is recommended for tailored management."
    },
    "Lichen Planus": {
        "category_id": "lichen_planus",
        "display_name": "Lichen Planus (Violaceous Papule Pattern)",
        "track": "Track A: Inflammatory Papulosquamous Dermatoses",
        "is_concerning": False,
        "is_unsupported": False,
        "triage_tier": 2,
        "rationale": "Violaceous polygonal flat-topped papules observed. An in-person dermatological evaluation is recommended to evaluate mucous membranes and systemic involvement."
    },
    "Pityriasis Rosea": {
        "category_id": "pityriasis_rosea",
        "display_name": "Pityriasis Rosea (Herald Patch / Oval Plaque Pattern)",
        "track": "Track A: Acute Exanthematous Dermatoses",
        "is_concerning": False,
        "is_unsupported": False,
        "triage_tier": 2,
        "rationale": "Oval erythematous patches with collarette scale. Usually a self-limiting exanthem; doctor consultation recommended to confirm diagnosis."
    },
    "Papilomatosis Confluentes And Reticulate": {
        "category_id": "papilomatosis_confluentes",
        "display_name": "Confluent and Reticulated Papillomatosis Pattern",
        "track": "Track A: Rare Reticulated Dermatoses",
        "is_concerning": False,
        "is_unsupported": False,
        "triage_tier": 2,
        "rationale": "Reticulated hyperpigmented papules in central trunk. Clinical evaluation advised for oral tetracycline or antifungal consideration."
    },

    # 4. Track B: Concerning / Premalignant / Malignant Neoplasms
    "Melanoma": {
        "category_id": "suspicious_dysplastic_lesion",
        "display_name": "Melanoma (High-Priority Pigmented Lesion Concern)",
        "track": "Track B: Cutaneous Neoplasms (Prompt Clinical Evaluation Required)",
        "is_concerning": True,
        "is_unsupported": False,
        "triage_tier": 2,
        "rationale": "Visual features exhibit marked asymmetry, variegated pigment, or irregular borders statistically similar to malignant melanoma. Prompt in-person evaluation by a dermatologist with dermoscopy is essential."
    },
    "Basal Cell Carcinoma": {
        "category_id": "suspicious_dysplastic_lesion",
        "display_name": "Basal Cell Carcinoma (Cutaneous Neoplasm Concern)",
        "track": "Track B: Cutaneous Neoplasms (Clinical Evaluation Required)",
        "is_concerning": True,
        "is_unsupported": False,
        "triage_tier": 2,
        "rationale": "Features suggestive of basal cell carcinoma (e.g. pearly border, telangiectasia, or slow ulceration). Clinical examination and biopsy are recommended."
    },
    "squamous cell carcinoma": {
        "category_id": "suspicious_dysplastic_lesion",
        "display_name": "Squamous Cell Carcinoma (Cutaneous Neoplasm Concern)",
        "track": "Track B: Cutaneous Neoplasms (Clinical Evaluation Required)",
        "is_concerning": True,
        "is_unsupported": False,
        "triage_tier": 2,
        "rationale": "Hyperkeratotic, indurated, or ulcerating features statistically correlated with squamous cell carcinoma. Dermatologist evaluation is recommended."
    },
    "actinic keratosis": {
        "category_id": "suspicious_dysplastic_lesion",
        "display_name": "Actinic Keratosis (Pre-Cancerous Solar Keratosis Pattern)",
        "track": "Track B: Pre-Cancerous Dysplastic Lesions (Doctor Check Recommended)",
        "is_concerning": True,
        "is_unsupported": False,
        "triage_tier": 2,
        "rationale": "Rough, scaly, sun-induced patch characteristic of actinic keratosis. Clinical check is recommended for preventive treatment."
    },
    "Porokeratosis Actinic": {
        "category_id": "suspicious_dysplastic_lesion",
        "display_name": "Disseminated Superficial Actinic Porokeratosis Pattern",
        "track": "Track B: Dysplastic Lesions (Doctor Check Recommended)",
        "is_concerning": True,
        "is_unsupported": False,
        "triage_tier": 2,
        "rationale": "Annular papules with peripheral cornoid lamella border. Doctor evaluation recommended to monitor for malignant transformation."
    },
    "Mycosis Fungoides": {
        "category_id": "suspicious_dysplastic_lesion",
        "display_name": "Mycosis Fungoides Pattern (Cutaneous T-Cell Lymphoma)",
        "track": "Track B: Specialized Lymphoproliferative Dermatoses",
        "is_concerning": True,
        "is_unsupported": True,
        "triage_tier": 2,
        "rationale": "Visual features correlate with cutaneous lymphoma patterns. Comprehensive clinical evaluation and tissue biopsy are strictly required."
    },

    # 5. Track B: Common Benign Cutaneous Lesions
    "nevus": {
        "category_id": "benign_melanocytic_macule",
        "display_name": "Melanocytic Nevus (Common Benign Mole Pattern)",
        "track": "Track B: Benign Cutaneous Lesions (Likely Benign)",
        "is_concerning": False,
        "is_unsupported": False,
        "triage_tier": 1,
        "rationale": "Uniform pigment and symmetric borders consistent with a common benign mole. Routine monthly self-monitoring recommended."
    },
    "seborrheic keratosis": {
        "category_id": "benign_melanocytic_macule",
        "display_name": "Seborrheic Keratosis (Common Benign Warty Lesion)",
        "track": "Track B: Benign Cutaneous Lesions (Likely Benign)",
        "is_concerning": False,
        "is_unsupported": False,
        "triage_tier": 1,
        "rationale": "Well-circumscribed 'stuck-on' hyperkeratotic appearance typical of benign seborrheic keratosis. No immediate intervention required unless irritated."
    },
    "dermatofibroma": {
        "category_id": "benign_melanocytic_macule",
        "display_name": "Dermatofibroma (Benign Fibrous Nodule Pattern)",
        "track": "Track B: Benign Cutaneous Lesions (Likely Benign)",
        "is_concerning": False,
        "is_unsupported": False,
        "triage_tier": 1,
        "rationale": "Firm dermal papule consistent with a benign dermatofibroma. Safe for routine observation unless symptomatic."
    },
    "pigmented benign keratosis": {
        "category_id": "benign_melanocytic_macule",
        "display_name": "Pigmented Benign Keratosis (Solar Lentigo / Keratosis)",
        "track": "Track B: Benign Cutaneous Lesions (Likely Benign)",
        "is_concerning": False,
        "is_unsupported": False,
        "triage_tier": 1,
        "rationale": "Benign epidermal melanocytic hyperpigmentation. Regular sun protection and skin checks recommended."
    },
    "vascular lesion": {
        "category_id": "benign_melanocytic_macule",
        "display_name": "Vascular Lesion (Cherry Angioma / Capillary Pattern)",
        "track": "Track B: Benign Cutaneous Lesions (Likely Benign)",
        "is_concerning": False,
        "is_unsupported": False,
        "triage_tier": 1,
        "rationale": "Well-defined reddish/purple vascular macule or papule typical of a benign cherry angioma or vascular malformation."
    },
    "Neurofibromatosis": {
        "category_id": "benign_melanocytic_macule",
        "display_name": "Neurofibroma / Café-au-Lait Feature Pattern",
        "track": "Track B: Cutaneous Neurofibromas",
        "is_concerning": False,
        "is_unsupported": False,
        "triage_tier": 2,
        "rationale": "Soft cutaneous papules or macules consistent with neurofibroma. General physician review recommended for systemic assessment."
    },

    # 6. Specialized / Rare / Unsupported Systemic Dermatoses
    "Darier_s Disease": {
        "category_id": "unsupported_specialized_condition",
        "display_name": "Darier's Disease Pattern (Keratosis Follicularis)",
        "track": "Specialized Dermatoses: Requires In-Person Dermatologist Evaluation",
        "is_concerning": False,
        "is_unsupported": True,
        "triage_tier": 2,
        "rationale": "Visual features show crusted keratotic papules suggestive of Darier's disease. This is a specialized condition requiring clinical diagnosis, genetic assessment, and prescription dermatological management."
    },
    "Hailey-Hailey Disease": {
        "category_id": "unsupported_specialized_condition",
        "display_name": "Hailey-Hailey Disease Pattern (Familial Pemphigus)",
        "track": "Specialized Dermatoses: Requires In-Person Dermatologist Evaluation",
        "is_concerning": False,
        "is_unsupported": True,
        "triage_tier": 2,
        "rationale": "Intertriginous maceration and erosions statistically similar to Hailey-Hailey disease. In-person specialist examination is essential."
    },
    "Epidermolysis Bullosa Pruriginosa": {
        "category_id": "unsupported_specialized_condition",
        "display_name": "Epidermolysis Bullosa Pruriginosa Pattern",
        "track": "Specialized Dermatoses: Requires In-Person Dermatologist Evaluation",
        "is_concerning": False,
        "is_unsupported": True,
        "triage_tier": 2,
        "rationale": "Pruritic nodular or bullous features consistent with specialized mechanobullous disorders. Specialized dermatological evaluation is required."
    },
    "Leprosy Borderline": {
        "category_id": "unsupported_specialized_condition",
        "display_name": "Borderline Leprosy Pattern (Hansen's Disease)",
        "track": "Specialized Infectious Disease: Requires Urgent Public Health / Clinical Check",
        "is_concerning": False,
        "is_unsupported": True,
        "triage_tier": 2,
        "rationale": "Hypopigmented or erythematous plaques with potential sensory changes. Urgent in-person evaluation by an infectious disease specialist or dermatologist is required."
    },
    "Leprosy Lepromatous": {
        "category_id": "unsupported_specialized_condition",
        "display_name": "Lepromatous Leprosy Pattern (Hansen's Disease)",
        "track": "Specialized Infectious Disease: Requires Urgent Public Health / Clinical Check",
        "is_concerning": False,
        "is_unsupported": True,
        "triage_tier": 2,
        "rationale": "Diffuse infiltrative cutaneous plaques. Urgent in-person evaluation at a specialized clinic is required."
    },
    "Leprosy Tuberculoid": {
        "category_id": "unsupported_specialized_condition",
        "display_name": "Tuberculoid Leprosy Pattern (Hansen's Disease)",
        "track": "Specialized Infectious Disease: Requires Urgent Public Health / Clinical Check",
        "is_concerning": False,
        "is_unsupported": True,
        "triage_tier": 2,
        "rationale": "Well-demarcated hypopigmented anesthetic plaque pattern. Medical evaluation is required for slit-skin smear and biopsy."
    },
    "Lupus Erythematosus Chronicus Discoides": {
        "category_id": "unsupported_specialized_condition",
        "display_name": "Discoid Lupus Erythematosus Pattern",
        "track": "Specialized Autoimmune Dermatoses: Requires Rheumatology/Dermatology Evaluation",
        "is_concerning": False,
        "is_unsupported": True,
        "triage_tier": 2,
        "rationale": "Scarring, follicular plugging, and atrophic plaques suggestive of discoid lupus erythematosus. In-person biopsy and autoimmune serology are recommended."
    }
}

# Compatibility sets
TRACK_A_CLASSES = {k for k, v in DINOV2_CLASS_METADATA.items() if "Track A" in v.get("track", "")}
TRACK_B_BENIGN_CLASSES = {k for k, v in DINOV2_CLASS_METADATA.items() if "Likely Benign" in v.get("track", "") or v.get("category_id") == "benign_melanocytic_macule"}
TRACK_B_CONCERNING_CLASSES = {k for k, v in DINOV2_CLASS_METADATA.items() if v.get("is_concerning", False)}


def get_dinov2_class_metadata(label: str) -> Dict[str, Any]:
    """Retrieves full clinical metadata for a DINOv2 model class label."""
    if not label:
        return {
            "category_id": "inconclusive",
            "display_name": "Uncategorized Pattern",
            "track": "Track C: Unclassified Pattern",
            "is_concerning": False,
            "is_unsupported": True,
            "triage_tier": 2,
            "rationale": "Visual features did not correspond to a recognized dermatological category."
        }
    
    clean_l = label.strip()
    if clean_l in DINOV2_CLASS_METADATA:
        return DINOV2_CLASS_METADATA[clean_l]
    
    # Case-insensitive or partial match
    lower = clean_l.lower()
    for k, v in DINOV2_CLASS_METADATA.items():
        if k.lower() == lower:
            return v

    # Fallback heuristics for unmapped classes
    if any(k in lower for k in ("melanoma", "carcinoma", "actinic")):
        return {
            "category_id": "suspicious_dysplastic_lesion",
            "display_name": f"{clean_l} (Cutaneous Neoplasm Concern)",
            "track": "Track B: Cutaneous Neoplasms (Clinical Evaluation Required)",
            "is_concerning": True,
            "is_unsupported": False,
            "triage_tier": 2,
            "rationale": "Visual features suggest a concerning cutaneous lesion requiring in-person clinical check."
        }
    if any(k in lower for k in ("nevus", "mole", "keratosis", "vascular")):
        return {
            "category_id": "benign_melanocytic_macule",
            "display_name": f"{clean_l} (Common Benign Feature Pattern)",
            "track": "Track B: Benign Cutaneous Lesions (Likely Benign)",
            "is_concerning": False,
            "is_unsupported": False,
            "triage_tier": 1,
            "rationale": "Symmetric, regular features consistent with a benign skin lesion."
        }

    return {
        "category_id": "inconclusive",
        "display_name": f"Uncategorized Pattern: {clean_l}",
        "track": "Track C: Unclassified Pattern",
        "is_concerning": False,
        "is_unsupported": True,
        "triage_tier": 2,
        "rationale": f"The visual model returned a pattern ({clean_l}) that could not be reliably categorized. In-person medical evaluation is recommended."
    }


def map_dinov2_label_to_clinical_category(label: str) -> Tuple[str, str, str]:
    """
    Maps a DINOv2 predicted class label to:
    (triage_category_id, track_name, clinical_display_name)
    Maintains backwards compatibility while preserving distinct clinical identities.
    """
    meta = get_dinov2_class_metadata(label)
    return meta["category_id"], meta["track"], meta["display_name"]


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
                self.model_id
            )

            # Load model weights (without passing kwargs that trigger __init__ TypeError)
            model = AutoModelForImageClassification.from_pretrained(
                self.model_id
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
        Returns top predictions with true softmax probabilities and original model labels.
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
                meta = get_dinov2_class_metadata(class_name)

                top_predictions.append({
                    "label": class_name,
                    "original_label": class_name,
                    "display_name": meta["display_name"],
                    "score": round(score, 4),
                    "confidence_pct": round(score * 100, 1),
                    "category_id": meta["category_id"],
                    "track": meta["track"],
                    "is_concerning": meta.get("is_concerning", False),
                    "is_unsupported": meta.get("is_unsupported", False),
                    "triage_tier": meta.get("triage_tier", 2)
                })

            top1 = top_predictions[0]
            top1_score = top1["score"]
            top2_score = top_predictions[1]["score"] if len(top_predictions) > 1 else 0.0
            confidence_margin = round(top1_score - top2_score, 3)

            # Rejection threshold for low confidence / ambiguous images (< 20%)
            is_ambiguous = top1_score < 0.20

            return {
                "success": True,
                "status": "completed",
                "model_id": self.model_id,
                "model_version": self.version,
                "device": str(self._device),
                "is_ambiguous": is_ambiguous,
                "top_label": top1["label"],
                "original_label": top1["label"],
                "top_display_name": top1["display_name"],
                "top_score": top1["score"],
                "mapped_category": top1["category_id"] if not is_ambiguous else "inconclusive",
                "track": top1["track"],
                "is_concerning": top1["is_concerning"],
                "is_unsupported": top1["is_unsupported"],
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
