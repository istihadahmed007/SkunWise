from fastapi import APIRouter, Query, UploadFile, File, HTTPException, Request, Depends, status
from typing import Dict, Any, Optional
from app.services.openfda_service import openfda_service
from app.services.uv_service import uv_service
from app.services.huggingface_adapter import huggingface_adapter
from app.services.vision_engine import vision_engine
from app.services.image_validation import sanitize_and_validate_image, read_stream_with_byte_limit
from app.core.rate_limiter import analyze_rate_limiter
from app.api.deps import get_current_user_optional
from app.models.schemas import User
from app.core.config import settings

router = APIRouter(prefix="/integrations", tags=["Public APIs & Model Adapters"])

@router.get("/cosmetics/adverse-events")
def get_cosmetic_adverse_events(
    query: str = Query(..., min_length=2, max_length=100, description="Product brand, name, or cosmetic ingredient to search"),
    limit: int = Query(5, ge=1, le=20, description="Maximum number of reported events to return")
):
    """
    Search openFDA Cosmetic Adverse Event reports (FDA CAERS Database).
    
    REGULATORY CAUTION:
    Adverse event reports voluntarily submitted to the FDA CAERS database do not
    establish that a product caused or contributed to the adverse reaction.
    """
    return openfda_service.search_cosmetic_events(query=query, limit=limit)

@router.get("/uv/forecast")
def get_uv_forecast(
    latitude: float = Query(..., ge=-90.0, le=90.0, description="User latitude"),
    longitude: float = Query(..., ge=-180.0, le=180.0, description="User longitude")
):
    """
    Retrieve real-time UV radiation index and evidence-based photoprotection guidance
    from the Open-Meteo Solar & UV Index API.
    
    LICENSING:
    Open-Meteo is open-source and free for non-commercial use under Attribution 4.0
    International (CC BY 4.0). Commercial production requires an Open-Meteo subscription.
    """
    return uv_service.get_uv_guidance(latitude=latitude, longitude=longitude)

@router.get("/models/status")
def get_models_status():
    """
    Report the operational status, architecture, and spatial capabilities of integrated AI models.
    """
    return {
        "primary_vision_engine": {
            "model_id": "gemini-3.5-flash-lite",
            "provider": "Google Multimodal API",
            "status": "active" if vision_engine.is_configured() else "offline_fallback",
            "supports_localization": True,
            "bounding_box_format": "[ymin, xmin, ymax, xmax] normalized (0-1000)",
            "multimodal": True
        },
        "huggingface_dermatology_engine": huggingface_adapter.get_model_metadata(),
        "public_apis": {
            "openfda_cosmetics": {
                "name": "FDA CAERS Cosmetic Adverse Events",
                "endpoint": settings.OPENFDA_COSMETICS_URL,
                "status": "active",
                "rate_limit": "5,000 requests/day (public tier)",
                "terms": "https://open.fda.gov/terms/"
            },
            "open_meteo_uv": {
                "name": "Open-Meteo Solar & UV Index",
                "endpoint": settings.OPEN_METEO_UV_URL,
                "status": "active",
                "license": "CC BY 4.0 (Non-commercial open-source)",
                "commercial_subscription_url": "https://open-meteo.com/en/pricing"
            }
        }
    }

@router.post("/huggingface/analyze")
async def analyze_with_huggingface(
    request: Request,
    file: UploadFile = File(...),
    user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Run evaluated Hugging Face dermatology model inference (Jayanth2002/dinov2-base-finetuned-SkinDisease)
    with streaming size boundaries, rate limiting, and signature sanitization.
    """
    # 1. Enforce rate limiting against resource exhaustion
    analyze_rate_limiter.enforce(request, identifier_suffix="hf_analyze")

    # 2. Streamingly read with hard byte limit (prevents buffering unbounded payloads in RAM)
    raw_bytes = await read_stream_with_byte_limit(file)
    if not raw_bytes:
        raise HTTPException(status_code=400, detail="Empty image upload received.")

    # 3. Sanitize and validate file signature, dimensions, and decompression limits
    clean_bytes, _, _, _ = sanitize_and_validate_image(
        raw_bytes, file.filename or "hf_upload.jpg", file.content_type
    )

    return huggingface_adapter.infer(clean_bytes)

