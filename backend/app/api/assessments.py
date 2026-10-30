import json
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from pathlib import Path
from fastapi import (
    APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status, Request
)
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core.rate_limiter import analyze_rate_limiter
from app.core.security import create_guest_token, verify_guest_token
from app.models.schemas import (
    User, Assessment, ConsentRecord, SymptomQuestionnaireInput, QualityMetricsModel,
    TriageResultModel, AssessmentResponse, AssessmentSummaryItem
)
from app.api.deps import get_current_user, get_current_user_optional
from app.services.image_validation import sanitize_and_validate_image
from app.services.image_quality import evaluate_image_quality
from app.services.vision_engine import vision_engine
from app.services.triage_service import triage_service
from app.services.recommendation_service import recommendation_engine
from app.services.pdf_service import generate_clinical_dossier_pdf
from app.storage.private_storage import (
    save_private_image, get_private_image_path, delete_private_image
)

router = APIRouter(prefix="/skin", tags=["Dermatological Assessment"])

@router.post("/analyze", response_model=AssessmentResponse)
async def analyze_skin(
    request: Request,
    file: UploadFile = File(..., description="High-resolution clinical dermatological image"),
    symptoms_json: str = Form(..., description="JSON stringified SymptomQuestionnaireInput"),
    anatomical_region: Optional[str] = Form("Volar Forearm"),
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Security-Hardened Multi-Modal Skin Identification, Triage, and Recommendation Pipeline:
    1. Enforces rate limiting against abuse and resource exhaustion.
    2. Validates explicit patient consent (biometric intake and non-diagnostic limitation).
    3. Validates actual magic bytes, dimensions, aspect ratio, and strips all EXIF metadata.
    4. Evaluates human skin presence and optical quality viability.
    5. Runs genuine vision engine inference with honest uncertainty.
    6. Evaluates independent clinical safety triage (emergency red flags strictly take precedence).
    7. Synthesizes multimodal evidence and evidence-based conservative care guidance.
    8. Persists encrypted assessment record and manages private storage.
    9. Issues scoped expiring guest token if user is unauthenticated.
    """
    # 0. Enforce rate limiting
    analyze_rate_limiter.enforce(request, identifier_suffix="analyze")

    # 1. Parse and validate symptom questionnaire & mandatory consent
    try:
        symptom_dict = json.loads(symptoms_json)
        symptoms = SymptomQuestionnaireInput(**symptom_dict)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid symptom questionnaire payload: {str(e)}"
        )

    # Enforce mandatory explicit patient consent before processing photograph
    if not symptoms.consent_biometric or not symptoms.consent_disclaimer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mandatory consent missing. Both biometric photo processing consent and non-diagnostic disclaimer acknowledgment must be provided."
        )

    is_guest = user is None
    if is_guest:
        guest_email = f"guest_{uuid.uuid4().hex[:10]}@skinwise.local"
        user = User(
            email=guest_email,
            hashed_password="guest_session_token_protected",
            full_name="Guest Patient",
            is_active=True,
            zero_cloud_retention=False,
            data_retention_days=1  # 24h retention for guest sessions
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Record guest consent
        db.add(ConsentRecord(
            user_id=user.id,
            consent_type="guest_biometric_intake_authorization",
            agreed=True,
            terms_version="SW-2026-v1.0"
        ))
        db.commit()

    # 2. Read and sanitize image (validates magic bytes, pixel boundaries, EXIF stripping)
    raw_bytes = await file.read()
    clean_bytes, image_hash, width, height = sanitize_and_validate_image(
        raw_bytes, file.filename or "skin_photo.jpg", file.content_type
    )

    # 3. Automated Image Quality & Optical Viability Evaluation
    quality_metrics = evaluate_image_quality(clean_bytes)
    is_quality_acceptable = quality_metrics["is_acceptable"]

    # 4. Computer Vision Inference (Modular Pipeline with Skin Locus Validation)
    visual_findings = vision_engine.infer(clean_bytes)

    # 5. Independent Safety Triage Engine (Emergency Red Flags Evaluated First)
    pathway = triage_service.determine_care_pathway(
        symptoms=symptoms,
        visual_findings=visual_findings,
        is_quality_acceptable=is_quality_acceptable
    )

    # 6. Recommendation Engine (Evidence-Based Conservative Care)
    triage_result = recommendation_engine.generate_clinical_assessment(
        symptoms=symptoms,
        visual_findings=visual_findings,
        triage_pathway=pathway,
        is_quality_acceptable=is_quality_acceptable
    )

    # 7. Private Storage Management
    session_code = f"SW-{uuid.uuid4().hex[:6].upper()}"
    saved_filename = save_private_image(clean_bytes, file_ext="jpg")

    # If user selected Zero-Cloud Retention, remove image immediately after inference
    if user.zero_cloud_retention:
        delete_private_image(saved_filename)
        saved_filename = "EPHEMERAL_PURGED"

    # 8. Persist to Database
    assessment = Assessment(
        user_id=user.id,
        session_code=session_code,
        image_filename=saved_filename,
        image_hash=image_hash,
        anatomical_region=anatomical_region or symptoms.anatomical_region,
        symptom_data=symptoms.model_dump(),
        quality_metrics=quality_metrics,
        ai_predictions=visual_findings,
        triage_tier=triage_result.triage_tier,
        triage_title=triage_result.triage_name,
        triage_rationale=triage_result.rationale,
        primary_condition=triage_result.primary_condition,
        possible_conditions=[c.model_dump() for c in triage_result.possible_conditions],
        clinical_guidance={
            "safe_self_care": triage_result.safe_self_care,
            "what_to_avoid": triage_result.what_to_avoid,
            "critical_warning_signs": triage_result.critical_warning_signs,
            "main_finding": triage_result.main_finding,
            "confidence_statement": triage_result.confidence_statement,
            "cosmetic_skin_type": triage_result.cosmetic_skin_type.model_dump() if triage_result.cosmetic_skin_type else None,
            "detected_area": triage_result.detected_area.model_dump() if triage_result.detected_area else None,
            "recommended_skincare": [p.model_dump() for p in triage_result.recommended_skincare],
            "care_level": triage_result.care_level,
            "practical_care_tips": triage_result.practical_care_tips
        },
        uncertainties=triage_result.diagnostic_gaps,
        emergency_warning_detected=triage_result.emergency_warning_detected,
        is_inconclusive=triage_result.is_inconclusive,
        inconclusive_reason=triage_result.inconclusive_reason,
        is_archived=False,
        is_deleted=False
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    # 9. Scoped Guest Access Token Generation
    guest_access_token = None
    if is_guest:
        guest_access_token = create_guest_token(assessment.id, session_code)
        assessment.guest_access_token = guest_access_token
        db.commit()

    token_param = f"?guest_token={guest_access_token}" if guest_access_token else ""
    image_url = f"/api/skin/images/{saved_filename}{token_param}" if saved_filename != "EPHEMERAL_PURGED" else "/placeholder-ephemeral.png"

    return AssessmentResponse(
        id=assessment.id,
        session_code=assessment.session_code,
        user_id=assessment.user_id,
        anatomical_region=assessment.anatomical_region,
        created_at=assessment.created_at,
        image_url=image_url,
        quality_metrics=QualityMetricsModel(**quality_metrics),
        symptom_data=assessment.symptom_data,
        triage=triage_result,
        is_archived=assessment.is_archived,
        guest_access_token=guest_access_token
    )


@router.get("/assessment/{id}", response_model=AssessmentResponse)
def get_assessment(
    id: int,
    guest_token: Optional[str] = Query(None, description="Scoped access token for guest patient assessments"),
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Retrieves full structured assessment details by ID.
    STRICT SECURITY ENFORCEMENT:
    - If user is authenticated: verifies user.id == assessment.user_id (cross-patient access blocked).
    - If unauthenticated: requires valid, unexpired, scoped guest_token matching assessment.id.
    - Prevents any anonymous or unauthorized inspection of clinical records.
    """
    assessment = db.query(Assessment).filter(Assessment.id == id, Assessment.is_deleted == False).first()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found.")

    # Strict Authorization Gate
    has_access = False
    if user and assessment.user_id == user.id:
        has_access = True
    elif guest_token and verify_guest_token(guest_token, assessment.id):
        has_access = True

    if not has_access:
        if user:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You do not own this clinical assessment record."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication or a valid guest access token is required to view this clinical record."
            )

    token_param = f"?guest_token={guest_token}" if guest_token else ""
    image_url = f"/api/skin/images/{assessment.image_filename}{token_param}" if assessment.image_filename != "EPHEMERAL_PURGED" else "/placeholder-ephemeral.png"

    guidance = assessment.clinical_guidance or {}
    triage_model = TriageResultModel(
        triage_tier=assessment.triage_tier,
        triage_name=assessment.triage_title,
        recommended_timeline="1–2 Weeks" if assessment.triage_tier == 2 else ("Routine Observation (30-90 Days)" if assessment.triage_tier == 1 else "Immediate / Emergency"),
        urgency_badge_color="amber" if assessment.triage_tier == 2 else ("emerald" if assessment.triage_tier == 1 else "crimson"),
        primary_condition=assessment.primary_condition,
        rationale=assessment.triage_rationale,
        emergency_warning_detected=assessment.emergency_warning_detected,
        emergency_warning_items=[],
        is_inconclusive=assessment.is_inconclusive,
        inconclusive_reason=assessment.inconclusive_reason,
        possible_conditions=assessment.possible_conditions or [],
        safe_self_care=guidance.get("safe_self_care", []),
        what_to_avoid=guidance.get("what_to_avoid", []),
        critical_warning_signs=guidance.get("critical_warning_signs", []),
        diagnostic_gaps=assessment.uncertainties or [],
        citations=[],
        main_finding=guidance.get("main_finding", f"Possible visible concern: {assessment.primary_condition}"),
        confidence_statement=guidance.get("confidence_statement", "Automated visual pattern match. Medical evaluation required for clinical diagnosis."),
        cosmetic_skin_type=guidance.get("cosmetic_skin_type"),
        detected_area=guidance.get("detected_area"),
        recommended_skincare=guidance.get("recommended_skincare", []),
        care_level=guidance.get("care_level", "General self-care" if assessment.triage_tier == 1 else ("Arrange a doctor visit" if assessment.triage_tier == 2 else "Seek urgent medical care")),
        practical_care_tips=guidance.get("practical_care_tips", [])
    )

    return AssessmentResponse(
        id=assessment.id,
        session_code=assessment.session_code,
        user_id=assessment.user_id,
        anatomical_region=assessment.anatomical_region,
        created_at=assessment.created_at,
        image_url=image_url,
        quality_metrics=QualityMetricsModel(**assessment.quality_metrics),
        symptom_data=assessment.symptom_data,
        triage=triage_model,
        is_archived=assessment.is_archived,
        guest_access_token=guest_token
    )


@router.get("/assessment-history", response_model=List[AssessmentSummaryItem])
def get_assessment_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the authenticated user's historical dermatological triage assessments.
    Enforces user isolation.
    """
    records = db.query(Assessment).filter(
        Assessment.user_id == user.id,
        Assessment.is_deleted == False
    ).order_by(Assessment.created_at.desc()).all()

    items = []
    for r in records:
        img_url = f"/api/skin/images/{r.image_filename}" if r.image_filename != "EPHEMERAL_PURGED" else "/placeholder-ephemeral.png"
        color = "emerald" if r.triage_tier == 1 else ("amber" if r.triage_tier == 2 else "crimson")
        items.append(AssessmentSummaryItem(
            id=r.id,
            session_code=r.session_code,
            anatomical_region=r.anatomical_region,
            created_at=r.created_at,
            image_url=img_url,
            triage_tier=r.triage_tier,
            triage_title=r.triage_title,
            primary_condition=r.primary_condition,
            is_archived=r.is_archived,
            is_inconclusive=r.is_inconclusive,
            urgency_badge_color=color
        ))

    return items


@router.delete("/assessment/{id}")
def delete_assessment(
    id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Permanently deletes a patient assessment and purges associated image from disk.
    Enforces user ownership.
    """
    assessment = db.query(Assessment).filter(Assessment.id == id, Assessment.user_id == user.id).first()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found or access denied.")

    # Delete image file from private storage
    if assessment.image_filename and assessment.image_filename != "EPHEMERAL_PURGED":
        delete_private_image(assessment.image_filename)

    assessment.is_deleted = True
    db.delete(assessment)
    db.commit()

    return {"status": "success", "message": f"Assessment #{assessment.session_code} deleted and image purged."}


@router.get("/assessment/{id}/pdf")
def export_assessment_pdf(
    id: int,
    guest_token: Optional[str] = Query(None, description="Scoped access token for guest patient assessments"),
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Generates and downloads clinical referral dossier PDF.
    STRICT AUTHORIZATION: Requires user ownership or valid scoped guest token.
    """
    assessment = db.query(Assessment).filter(Assessment.id == id, Assessment.is_deleted == False).first()
    if not assessment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assessment not found.")

    has_access = False
    if user and assessment.user_id == user.id:
        has_access = True
    elif guest_token and verify_guest_token(guest_token, assessment.id):
        has_access = True

    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this clinical PDF dossier."
        )

    user_name = user.full_name if user else "Patient (Consultation Copy)"
    user_email = user.email if user else "Confidential Patient"

    triage_data = {
        "triage_tier": assessment.triage_tier,
        "triage_name": assessment.triage_title,
        "recommended_timeline": "1–2 Weeks" if assessment.triage_tier == 2 else ("Routine (30-90 Days)" if assessment.triage_tier == 1 else "Immediate"),
        "rationale": assessment.triage_rationale,
        "possible_conditions": assessment.possible_conditions or [],
        "diagnostic_gaps": assessment.uncertainties or []
    }

    image_path = None
    if assessment.image_filename and assessment.image_filename != "EPHEMERAL_PURGED":
        try:
            image_path = str(get_private_image_path(assessment.image_filename))
        except Exception:
            pass

    pdf_filepath = generate_clinical_dossier_pdf(
        session_code=assessment.session_code,
        user_name=user_name,
        user_email=user_email,
        created_at_str=assessment.created_at.strftime("%B %d, %Y - %H:%M EST"),
        anatomical_region=assessment.anatomical_region,
        image_path=image_path,
        triage_data=triage_data,
        symptom_data=assessment.symptom_data or {},
        quality_data=assessment.quality_metrics or {}
    )

    return FileResponse(
        pdf_filepath,
        media_type="application/pdf",
        filename=f"Clinical_Dossier_{assessment.session_code}.pdf"
    )


@router.get("/images/{filename}")
def get_private_image(
    filename: str,
    guest_token: Optional[str] = Query(None, description="Scoped access token for guest patient assessments"),
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Access-controlled image serving endpoint:
    Verifies that the requested image exists and that the requesting party is either:
    1. The authenticated patient who owns the assessment, or
    2. A guest holder with a valid, unexpired scoped guest token for this assessment.
    Prevents unauthorized image enumeration and cross-patient eavesdropping.
    """
    assessment = db.query(Assessment).filter(
        Assessment.image_filename == filename,
        Assessment.is_deleted == False
    ).first()

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found or has been purged per zero-cloud retention policy."
        )

    has_access = False
    if user and assessment.user_id == user.id:
        has_access = True
    elif guest_token and verify_guest_token(guest_token, assessment.id):
        has_access = True

    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not have authorization to view this patient photograph."
        )

    filepath = get_private_image_path(filename)
    return FileResponse(filepath, media_type="image/jpeg")
