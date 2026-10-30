import io
import time
from typing import Dict, Any, List, Optional
from PIL import Image
import httpx
from app.core.config import settings

class HuggingFaceVisionAdapter:
    """
    Backend adapter for evaluated Hugging Face dermatology models.
    
    EVALUATED MODEL SPECIFICATION:
    - Model ID: Jayanth2002/dinov2-base-finetuned-SkinDisease
    - Architecture: DINOv2 Base Vision Transformer (arXiv:2407.14757)
    - Fine-tuned task: 31-class dermatological disease classification
    - Capabilities: Multi-class image classification.
    - Limitations: Does NOT perform object localization, bounding box detection,
      or lesion segmentation. Affected-area highlighting is explicitly reported
      as unsupported by this model.
    
    SAFETY & NON-DIAGNOSTIC NOTICE:
    Classification outputs from this model represent probabilistic feature
    similarities. They must NEVER be presented as proof of skin disease or as
    a clinical diagnosis.
    """

    MODEL_ID = settings.HF_MODEL_ID
    ROUTER_URL = f"{settings.HF_ROUTER_URL}/{settings.HF_MODEL_ID}"
    REQUEST_TIMEOUT = 15.0

    def is_configured(self) -> bool:
        """Check if Hugging Face API credentials are set in environment."""
        return bool(settings.HF_TOKEN and len(settings.HF_TOKEN.strip()) > 5)

    def get_model_metadata(self) -> Dict[str, Any]:
        """Return genuine metadata and capabilities of the evaluated model."""
        return {
            "model_id": self.MODEL_ID,
            "provider": "Hugging Face Serverless Inference",
            "architecture": "DINOv2 Base (Vision Transformer)",
            "pipeline": "image-classification",
            "supports_localization": False,
            "supports_segmentation": False,
            "is_configured": self.is_configured(),
            "target_classes_count": 31,
            "reference": "https://huggingface.co/Jayanth2002/dinov2-base-finetuned-SkinDisease"
        }

    def infer(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Run inference against Hugging Face Serverless API if token is configured.
        Returns genuine classifications or explicit unconfigured/error state.
        Never fabricates predictions.
        """
        if not self.is_configured():
            return {
                "success": False,
                "status": "unconfigured",
                "model_id": self.MODEL_ID,
                "message": (
                    "Hugging Face credentials (HF_TOKEN or HUGGINGFACE_API_KEY) are not set in the backend environment. "
                    "Inference was not run to avoid fabricating fake results."
                ),
                "predictions": [],
                "detected_area": {
                    "has_detection": False,
                    "bounding_box": None,
                    "is_supported": False,
                    "notes": "Localization is not supported by this classification model."
                }
            }

        headers = {
            "Authorization": f"Bearer {settings.HF_TOKEN.strip()}",
            "Content-Type": "image/jpeg",
            "User-Agent": "SkinWise-AI/1.0 (Dermatology Research; Contact: support@skinwise.local)"
        }

        # Normalize image to JPEG before sending
        try:
            pil_img = Image.open(io.BytesIO(image_bytes))
            if pil_img.mode != "RGB":
                pil_img = pil_img.convert("RGB")
            out_buf = io.BytesIO()
            pil_img.save(out_buf, format="JPEG", quality=90)
            payload_bytes = out_buf.getvalue()
        except Exception as e:
            return {
                "success": False,
                "status": "invalid_image",
                "model_id": self.MODEL_ID,
                "message": f"Could not process input image format: {str(e)}",
                "predictions": []
            }

        try:
            with httpx.Client(timeout=self.REQUEST_TIMEOUT) as client:
                response = client.post(self.ROUTER_URL, headers=headers, content=payload_bytes)

                if response.status_code == 503:
                    # Model is currently loading on Hugging Face infrastructure
                    err_json = response.json() if "application/json" in response.headers.get("content-type", "") else {}
                    estimated_time = err_json.get("estimated_time", 20.0)
                    return {
                        "success": False,
                        "status": "model_loading",
                        "model_id": self.MODEL_ID,
                        "estimated_wait_seconds": estimated_time,
                        "message": f"Hugging Face model {self.MODEL_ID} is currently warming up on serverless infrastructure. Please retry in ~{int(estimated_time)}s.",
                        "predictions": []
                    }

                if response.status_code == 401 or response.status_code == 403:
                    return {
                        "success": False,
                        "status": "unauthorized",
                        "model_id": self.MODEL_ID,
                        "message": "Invalid or expired Hugging Face API token. Please check HF_TOKEN in backend environment variables.",
                        "predictions": []
                    }

                response.raise_for_status()
                raw_preds = response.json()

                # Expected HF format: list of dicts [{"label": str, "score": float}, ...]
                if not isinstance(raw_preds, list):
                    return {
                        "success": False,
                        "status": "unexpected_format",
                        "model_id": self.MODEL_ID,
                        "message": f"Unexpected response structure from Hugging Face model: {raw_preds}",
                        "predictions": []
                    }

                # Sort by score descending
                sorted_preds = sorted(raw_preds, key=lambda x: x.get("score", 0.0), reverse=True)

                return {
                    "success": True,
                    "status": "completed",
                    "model_id": self.MODEL_ID,
                    "predictions": sorted_preds[:5],
                    "top_label": sorted_preds[0].get("label") if sorted_preds else None,
                    "top_score": sorted_preds[0].get("score") if sorted_preds else 0.0,
                    "detected_area": {
                        "has_detection": False,
                        "bounding_box": None,
                        "is_supported": False,
                        "notes": "Localization is not supported by the DINOv2 image classification architecture."
                    },
                    "non_diagnostic_notice": (
                        "Predictions from this machine learning model reflect statistical similarities to training datasets "
                        "and do not constitute medical proof of disease."
                    )
                }

        except httpx.TimeoutException:
            return {
                "success": False,
                "status": "timeout",
                "model_id": self.MODEL_ID,
                "message": f"Hugging Face inference timed out after {self.REQUEST_TIMEOUT}s.",
                "predictions": []
            }
        except Exception as err:
            return {
                "success": False,
                "status": "error",
                "model_id": self.MODEL_ID,
                "message": f"Hugging Face adapter communication error: {str(err)}",
                "predictions": []
            }

huggingface_adapter = HuggingFaceVisionAdapter()

