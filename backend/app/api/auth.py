from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.models.schemas import (
    User, ConsentRecord, UserRegisterRequest, UserLoginRequest,
    TokenResponse, UserProfileResponse, UserSettingsUpdateRequest
)
from app.api.deps import get_current_user
from app.storage.private_storage import delete_private_image

router = APIRouter(prefix="/auth", tags=["Authentication & User Management"])

@router.post("/register", response_model=TokenResponse)
def register(user_in: UserRegisterRequest, db: Session = Depends(get_db)):
    """
    Registers a new patient account with explicit biometric consent and disclaimer acknowledgment.
    """
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # 1. Create User
    new_user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        is_active=True,
        zero_cloud_retention=False,
        data_retention_days=90
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 2. Record Explicit Consent
    if user_in.consent_biometric:
        consent_bio = ConsentRecord(
            user_id=new_user.id,
            consent_type="biometric_intake_authorization",
            agreed=True,
            terms_version="CE-2024-v4.2"
        )
        db.add(consent_bio)

    if user_in.consent_disclaimer:
        consent_disc = ConsentRecord(
            user_id=new_user.id,
            consent_type="ce_mdr_class_1_disclaimer",
            agreed=True,
            terms_version="CE-2024-v4.2"
        )
        db.add(consent_disc)

    db.commit()

    # 3. Create Access Token
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
def login(login_in: UserLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticates user and returns JWT token.
    """
    user = db.query(User).filter(User.email == login_in.email).first()
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
        user.full_name = settings_in.full_name
    if settings_in.zero_cloud_retention is not None:
        user.zero_cloud_retention = settings_in.zero_cloud_retention
    if settings_in.data_retention_days is not None:
        user.data_retention_days = settings_in.data_retention_days

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


@router.delete("/account")
def delete_account(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    HIPAA/GDPR Full Account Purge:
    Permanently deletes all stored photographs from disk, assessment records,
    consent records, and the user profile.
    """
    # Delete all uploaded image files on disk
    for assessment in user.assessments:
        if assessment.image_filename:
            delete_private_image(assessment.image_filename)

    db.delete(user)
    db.commit()

    return {"status": "success", "message": "Account and all associated dermatological data have been permanently purged."}

