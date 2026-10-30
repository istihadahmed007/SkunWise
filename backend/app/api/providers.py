from fastapi import APIRouter, Query
from typing import Optional
from app.services.provider_service import provider_service

router = APIRouter(prefix="/referral", tags=["Provider Directory & Referrals"])

@router.get("/providers")
def get_providers(
    division: Optional[str] = Query("all", description="Division filter: Dhaka, Chittagong, Sylhet, or all"),
    query: Optional[str] = Query(None, description="Search by hospital name, department, or area")
):
    """
    Returns verified clinical dermatology hospitals and departments in Bangladesh.
    Provides verified phone contacts, visiting hours, and consultation fee ranges (in BDT).
    """
    return provider_service.get_providers(division=division, query=query)

