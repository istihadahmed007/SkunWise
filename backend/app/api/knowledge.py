from fastapi import APIRouter
from app.services.recommendation_service import CLINICAL_KNOWLEDGE_BASE

router = APIRouter(prefix="/knowledge", tags=["Clinical Knowledge Base"])

@router.get("")
def get_clinical_knowledge_base():
    """
    Returns approved, source-traceable clinical dermatological guidance
    for all supported conditions.
    """
    return {
        "status": "success",
        "protocol_version": "CE-2024-v4.2",
        "knowledge_items": CLINICAL_KNOWLEDGE_BASE
    }

