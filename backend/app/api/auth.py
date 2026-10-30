import hashlib
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.rate_limiter import auth_rate_limiter, register_rate_limiter
from app.models.schemas import (
    User, ConsentRecord, ConsentAudit, UserRegisterRequest, UserLoginRequest,
    TokenResponse, UserProfileResponse, UserSettingsUpdateRequest
)
from app.api.deps import get_current_user
from app.storage.private_storage import delete_private_image
from app.services.retention_service import retention_service

router = APIRouter(prefix="/auth", tags=["Authentication & User Management"])

def validate_password_strength(password: str) -> None:
    """Enforce security standards for patient account passwords."""
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )
    if password.lower() in ("password", "12345678", "skinwise", "patient123", "admin123"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is too common or easily guessable. Please choose a stronger password."
        )

def hash_client_ip(request: Request) -> str:
    client_ip = request.client.host if request.client else "127.0.0.1"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    return hashlib.sha256(client_ip.encode("utf-8")).hexdigest()[:16]

@router.post("/register", response_model=TokenResponse)
def register(user_in: UserRegisterRequest, request: Request, db: Session = Depends(get_db)):
    """
    Registers a new patient account with explicit biometric consent and disclaimer acknowledgment.
    Protected by registration rate limiter.
    """
    register_rate_limiter.enforce(request, identifier_suffix="register")
    validate_password_strength(user_in.password)

    if not user_in.consent_biometric or not user_in.consent_disclaimer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Both biometric intake consent and medical limitation disclaimer must be agreed to before creating an account."
        )

    existing = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    ip_hash = hash_client_ip(request)

    # 1. Create User
    new_user = User(
        email=user_in.email.lower().strip(),
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name.strip() or "Patient User",
        is_active=True,
        zero_cloud_retention=False,
        data_retention_days=90
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 2. Record Explicit Consent
    consent_bio = ConsentRecord(
        user_id=new_user.id,
        consent_type="biometric_intake_authorization",
        agreed=True,
        ip_hash=ip_hash,
        terms_version="SW-2026-v1.0"
    )
    consent_disc = ConsentRecord(
        user_id=new_user.id,
        consent_type="non_diagnostic_medical_disclaimer",
        agreed=True,
        ip_hash=ip_hash,
        terms_version="SW-2026-v1.0"
    )
    db.add(consent_bio)
    db.add(consent_disc)

    # 3. Create Audit Trail
    audit_grant = ConsentAudit(
        user_id=new_user.id,
        action="granted",
        consent_type="biometric_and_disclaimer",
        ip_hash=ip_hash,
        details="Initial registration consent agreement."
    )
    db.add(audit_grant)
    db.commit()

    # 4. Create Access Token
    token = create_access_token(data={"sub": str(new_user.id), "email": new_user.email})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=new_user.id,
        email=new_user.email,
        full_name=new_user.full_name,
        zero_cloud_retention=new_user.zero_cloud_retention
    )


@router.post("/login", response_model=TokenResponse)
def login(login_in: UserLoginRequest, request: Request, db: Session = Depends(get_db)):
    """
    Authenticates user and returns JWT token.
    Protected by brute-force rate limiter.
    """
    auth_rate_limiter.enforce(request, identifier_suffix="login")

    user = db.query(User).filter(User.email == login_in.email.lower().strip()).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled."
        )

    token = create_access_token(data={"sub": str(user.id), "email": user.email})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        zero_cloud_retention=user.zero_cloud_retention
    )


@router.get("/me", response_model=UserProfileResponse)
def get_current_user_profile(user: User = Depends(get_current_user)):
    """
    Returns current user's profile and privacy configuration.
    """
    return UserProfileResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        zero_cloud_retention=user.zero_cloud_retention,
        data_retention_days=user.data_retention_days,
        created_at=user.created_at
    )


@router.put("/settings", response_model=UserProfileResponse)
def update_settings(
    settings_in: UserSettingsUpdateRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Updates user settings including zero-cloud image retention toggle and retention period.
    """
    if settings_in.full_name is not None:
        user.full_name = settings_in.full_name.strip()
    if settings_in.zero_cloud_retention is not None:
        user.zero_cloud_retention = settings_in.zero_cloud_retention
    if settings_in.data_retention_days is not None:
        user.data_retention_days = max(0, min(3650, int(settings_in.data_retention_days)))

    db.commit()
    db.refresh(user)

    return UserProfileResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        zero_cloud_retention=user.zero_cloud_retention,
        data_retention_days=user.data_retention_days,
        created_at=user.created_at
    )


@router.post("/consent/withdraw")
def withdraw_consent(
    purge_stored_images: bool = True,
    request: Request = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Explicit Patient Consent Withdrawal:
    Revokes biometric intake authorizations, creates an immutable audit trail,
    and optionally purges all stored photographs from server disk immediately.
    """
    ip_hash = hash_client_ip(request) if request else "unknown"

    # Revoke active consent records
    consents = db.query(ConsentRecord).filter(
        ConsentRecord.user_id == user.id,
        ConsentRecord.revoked_at == None
    ).all()
    for c in consents:
        c.agreed = False
        c.revoked_at = datetime.now(timezone.utc)

    # Add audit log
    audit_withdrawal = ConsentAudit(
        user_id=user.id,
        action="withdrawn",
        consent_type="biometric_intake_authorization",
        ip_hash=ip_hash,
        details=f"Patient withdrew consent. Purge images: {purge_stored_images}."
    )
    db.add(audit_withdrawal)

    # If requested, purge all physical image files on disk
    purged_count = 0
    if purge_stored_images:
        for assessment in user.assessments:
            if assessment.image_filename and assessment.image_filename != "EPHEMERAL_PURGED":
                delete_private_image(assessment.image_filename)
                assessment.image_filename = "EPHEMERAL_PURGED"
                purged_count += 1
        user.zero_cloud_retention = True

    db.commit()

    return {
        "status": "success",
        "message": f"Biometric consent successfully revoked. {purged_count} image files permanently purged from storage."
    }


@router.get("/consent/history")
def get_consent_history(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns auditable patient consent records and withdrawal history.
    """
    records = db.query(ConsentRecord).filter(ConsentRecord.user_id == user.id).all()
    audits = db.query(ConsentAudit).filter(ConsentAudit.user_id == user.id).order_by(ConsentAudit.created_at.desc()).all()

    return {
        "consents": [
            {
                "id": c.id,
                "consent_type": c.consent_type,
                "agreed": c.agreed,
                "consented_at": c.consented_at,
                "revoked_at": c.revoked_at,
                "terms_version": c.terms_version
            }
            for c in records
        ],
        "audit_trail": [
            {
                "id": a.id,
                "action": a.action,
                "consent_type": a.consent_type,
                "timestamp": a.created_at,
                "details": a.details
            }
            for a in audits
        ]
    }


@router.delete("/account")
def delete_account(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Full Account & Data Purge (Right to be Forgotten):
    Permanently deletes all stored photographs from disk, assessment records,
    consent records, and the user profile.
    """
    # Delete all uploaded image files on disk
    for assessment in user.assessments:
        if assessment.image_filename and assessment.image_filename != "EPHEMERAL_PURGED":
            delete_private_image(assessment.image_filename)

    db.delete(user)
    db.commit()

    return {"status": "success", "message": "Account and all associated dermatological data have been permanently purged."}


@router.post("/retention/cleanup")
def run_retention_cleanup(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Executes automated data retention lifecycle cleanup:
    Purges expired images and records exceeding configured retention windows.
    """
    result = retention_service.cleanup_expired_records(db)
    return result
