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

    REQUEST_TIMEOUT = 15.0

    @property
    def model_id(self) -> str:
        return settings.HF_MODEL_ID or "Jayanth2002/dinov2-base-finetuned-SkinDisease"

    @property
    def router_url(self) -> str:
        base = (settings.HF_ROUTER_URL or "https://router.huggingface.co/hf-inference/models").rstrip("/")
        return f"{base}/{self.model_id}"

    @property
    def fallback_api_url(self) -> str:
        return f"https://api-inference.huggingface.co/models/{self.model_id}"

    def is_configured(self) -> bool:
        """Check if Hugging Face API credentials are set in environment."""
        token = settings.HF_TOKEN
        return bool(token and len(token.strip()) > 5 and token.strip() != "YOUR_HUGGINGFACE_TOKEN")

    def get_model_metadata(self) -> Dict[str, Any]:
        """Return genuine metadata and capabilities of the evaluated model."""
        return {
            "model_id": self.model_id,
            "provider": "Hugging Face Serverless Inference",
            "architecture": "DINOv2 Base (Vision Transformer)",
            "pipeline": "image-classification",
            "supports_localization": False,
            "supports_segmentation": False,
            "is_configured": self.is_configured(),
            "target_classes_count": 31,
            "reference": f"https://huggingface.co/{self.model_id}"
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
                "model_id": self.model_id,
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
                "model_id": self.model_id,
                "message": f"Could not process input image format: {str(e)}",
                "predictions": []
            }

        # Controlled retry logic for transient connectivity or rapid warmup
        max_attempts = 2
        raw_preds = None

        for attempt in range(max_attempts):
            try:
                with httpx.Client(timeout=self.REQUEST_TIMEOUT) as client:
                    response = client.post(self.router_url, headers=headers, content=payload_bytes)

                    # Fallback to standard inference API endpoint if router endpoint returns 404
                    if response.status_code == 404:
                        response = client.post(self.fallback_api_url, headers=headers, content=payload_bytes)

                    if response.status_code == 503:
                        # Model is currently loading on Hugging Face infrastructure
                        err_json = response.json() if "application/json" in response.headers.get("content-type", "") else {}
                        estimated_time = err_json.get("estimated_time", 20.0)
                        if attempt == 0 and estimated_time <= 4.0:
                            time.sleep(min(estimated_time, 2.0))
                            continue
                        return {
                            "success": False,
                            "status": "model_loading",
                            "model_id": self.model_id,
                            "estimated_wait_seconds": estimated_time,
                            "message": f"Hugging Face model {self.model_id} is currently warming up on serverless infrastructure. Please retry in ~{int(estimated_time)}s.",
                            "predictions": []
                        }

                    if response.status_code in (401, 403):
                        return {
                            "success": False,
                            "status": "unauthorized",
                            "model_id": self.model_id,
                            "message": "Invalid or expired Hugging Face API token. Please check HF_TOKEN in backend environment variables.",
                            "predictions": []
                        }

                    response.raise_for_status()
                    raw_preds = response.json()
                    break

            except (httpx.ConnectError, httpx.ReadError) as net_err:
                if attempt == 0:
                    time.sleep(1.0)
                    continue
                return {
                    "success": False,
                    "status": "error",
                    "model_id": self.model_id,
                    "message": f"Network connection error while contacting Hugging Face: {str(net_err)}",
                    "predictions": []
                }
            except httpx.TimeoutException:
                return {
                    "success": False,
                    "status": "timeout",
                    "model_id": self.model_id,
                    "message": f"Hugging Face inference timed out after {self.REQUEST_TIMEOUT}s.",
                    "predictions": []
                }
            except Exception as e:
                return {
                    "success": False,
                    "status": "error",
                    "model_id": self.model_id,
                    "message": f"Hugging Face request failed: {str(e)}",
                    "predictions": []
                }

        if raw_preds is None:
            return {
                "success": False,
                "status": "error",
                "model_id": self.model_id,
                "message": "Inference did not return a valid payload after retry.",
                "predictions": []
            }

huggingface_adapter = HuggingFaceVisionAdapter()

