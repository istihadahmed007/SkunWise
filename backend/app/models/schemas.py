from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON, Float
)
from sqlalchemy.orm import relationship
from pydantic import BaseModel, EmailStr, Field
from app.core.database import Base

# ============================================================================
# SQLAlchemy ORM Models
# ============================================================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False, default="Patient User")
    is_active = Column(Boolean, default=True)
    zero_cloud_retention = Column(Boolean, default=False)
    data_retention_days = Column(Integer, default=90)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    assessments = relationship("Assessment", back_populates="user", cascade="all, delete-orphan")
    consents = relationship("ConsentRecord", back_populates="user", cascade="all, delete-orphan")


class ConsentRecord(Base):
    __tablename__ = "consent_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    consent_type = Column(String(100), nullable=False)  # biometric_intake, ce_mdr_disclaimer, terms_of_use
    agreed = Column(Boolean, default=True, nullable=False)
    ip_hash = Column(String(64), nullable=True)
    terms_version = Column(String(50), default="CE-2024-v4.2")
    consented_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    revoked_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="consents")


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    session_code = Column(String(64), unique=True, index=True, nullable=False)
    image_filename = Column(String(255), nullable=False)
    image_hash = Column(String(64), nullable=False)  # SHA-256 for integrity & deduplication
    anatomical_region = Column(String(100), nullable=False, default="Unspecified Region")
    
    # Structured JSON data payloads
    symptom_data = Column(JSON, nullable=False, default=dict)
    quality_metrics = Column(JSON, nullable=False, default=dict)
    ai_predictions = Column(JSON, nullable=False, default=dict)
    
    # Care Pathway and Triage Result
    triage_tier = Column(Integer, nullable=False, default=2)  # 1=Mild, 2=Doctor Recommended, 3=Urgent Alert
    triage_title = Column(String(255), nullable=False)
    triage_rationale = Column(Text, nullable=False)
    primary_condition = Column(String(255), nullable=False)
    possible_conditions = Column(JSON, nullable=False, default=list)
    clinical_guidance = Column(JSON, nullable=False, default=dict)
    uncertainties = Column(JSON, nullable=False, default=list)
    
    emergency_warning_detected = Column(Boolean, default=False)
    is_inconclusive = Column(Boolean, default=False)
    inconclusive_reason = Column(String(255), nullable=True)
    
    is_archived = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="assessments")


class ClinicalKnowledge(Base):
    __tablename__ = "clinical_knowledge"

    id = Column(Integer, primary_key=True, index=True)
    condition_key = Column(String(100), unique=True, index=True, nullable=False)
    title = Column(String(255), nullable=False)
    publisher = Column(String(255), nullable=False)
    reference_url = Column(String(500), nullable=False)
    evidence_summary = Column(Text, nullable=False)
    safe_self_care = Column(JSON, nullable=False, default=list)
    contraindications = Column(JSON, nullable=False, default=list)
    red_flags = Column(JSON, nullable=False, default=list)
    last_reviewed = Column(String(50), default="2025-Q4")
    approval_status = Column(String(100), default="Approved by Dermatology Clinical Review Board")


# ============================================================================
# Pydantic Request / Response Schemas
# ============================================================================

class UserRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    full_name: str = Field("Patient User", min_length=2)
    consent_biometric: bool = Field(True, description="Explicit consent to process skin image")
    consent_disclaimer: bool = Field(True, description="Acknowledgment that SkinWise AI is not a definitive diagnosis")

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    full_name: str
    zero_cloud_retention: bool

class UserProfileResponse(BaseModel):
    id: int
    email: str
    full_name: str
    zero_cloud_retention: bool
    data_retention_days: int
    created_at: datetime

class UserSettingsUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    zero_cloud_retention: Optional[bool] = None
    data_retention_days: Optional[int] = None

class SymptomQuestionnaireInput(BaseModel):
    anatomical_region: str = Field("Volar Forearm", description="Body location")
    duration_days: int = Field(5, ge=0, le=3650, description="Duration in days")
    itch_score: int = Field(0, ge=0, le=10, description="Pruritus Visual Analogue Scale 0-10")
    pain_score: int = Field(0, ge=0, le=10, description="Pain Scale 0-10")
    is_spreading: bool = Field(False, description="Whether lesion or rash is expanding")
    bleeding_or_crusting: bool = Field(False, description="Any spontaneous bleeding or oozing")
    prior_chemical_exposure: bool = Field(False, description="Recent new soaps, cosmetics, plants, or chemicals")
    exposure_details: Optional[str] = Field(None, description="Details of exposure, e.g. botanical soap")
    personal_skin_history: Optional[str] = Field("None", description="History of eczema, psoriasis, or skin cancer")
    
    # Cosmetic Skin Type Questions (Cleanly separated from disease analysis)
    midday_skin_feel: Optional[str] = Field("balanced", description="midday skin feel: oily, dry, combination, balanced")
    skin_sensitivity: Optional[str] = Field("rarely_reacts", description="skin reaction tendency: easily_irritated, rarely_reacts")
    
    # Critical Red-Flag Systemic Emergency Questions
    has_fever_or_chills: bool = Field(False, description="Systemic fever > 100.4F / 38C")
    has_facial_or_throat_swelling: bool = Field(False, description="Lip, tongue, or facial swelling")
    has_breathing_difficulty: bool = Field(False, description="Shortness of breath or wheezing")
    has_rapid_blistering_or_peeling: bool = Field(False, description="Widespread blistering or skin peeling")
    has_petechiae_or_purpura: bool = Field(False, description="Dark purple non-blanching spots with fever")

class CosmeticSkinTypeModel(BaseModel):
    skin_type: str = "Normal / Balanced"
    explanation: str = "Balanced oil and hydration levels reported."
    source: str = "Questionnaire self-report & image context"

class BoundingBoxModel(BaseModel):
    ymin: int = 0  # 0 to 1000
    xmin: int = 0
    ymax: int = 1000
    xmax: int = 1000

class DetectedAreaModel(BaseModel):
    has_detection: bool = False
    bounding_box: Optional[BoundingBoxModel] = None
    label: Optional[str] = None
    is_supported: bool = False
    notes: str = ""

class SkincareProductOptionModel(BaseModel):
    category: str
    role: str
    how_to_use: str

class QualityMetricsModel(BaseModel):
    is_acceptable: bool
    sharpness_score: float
    sharpness_status: str
    ambient_lux: float
    lighting_status: str
    glare_ratio: float
    glare_status: str
    framing_status: str
    overall_usability_score: int
    quality_notes: List[str]

class ConditionMatchModel(BaseModel):
    condition_id: str
    name: str
    category: str
    concordance_tier: str  # "Primary Pattern Match", "Secondary Pattern Match", "Low Concordance"
    visual_overlap: str
    clinical_history_correlation: str
    summary: str
    publisher_source: str
    source_url: str

class TriageResultModel(BaseModel):
    triage_tier: int  # 1, 2, 3
    triage_name: str  # "Mild / Self-Care", "Medical Assessment Recommended", "Urgent / Emergency Alert"
    recommended_timeline: str  # "Routine 30-90 Days", "1–2 Weeks", "Immediate / 24h"
    urgency_badge_color: str  # emerald, amber, crimson
    primary_condition: str
    rationale: str
    emergency_warning_detected: bool
    emergency_warning_items: List[str]
    is_inconclusive: bool
    inconclusive_reason: Optional[str] = None
    possible_conditions: List[ConditionMatchModel]
    safe_self_care: List[str]
    what_to_avoid: List[str]
    critical_warning_signs: List[str]
    diagnostic_gaps: List[str]
    citations: List[Dict[str, str]]
    
    # Redesigned 4-Section Fields
    main_finding: Optional[str] = None
    confidence_statement: Optional[str] = None
    cosmetic_skin_type: Optional[CosmeticSkinTypeModel] = None
    detected_area: Optional[DetectedAreaModel] = None
    recommended_skincare: List[SkincareProductOptionModel] = Field(default_factory=list)
    care_level: str = "General self-care"
    practical_care_tips: List[str] = Field(default_factory=list)

class AssessmentResponse(BaseModel):
    id: int
    session_code: str
    user_id: int
    anatomical_region: str
    created_at: datetime
    image_url: str
    quality_metrics: QualityMetricsModel
    symptom_data: Dict[str, Any]
    triage: TriageResultModel
    is_archived: bool

class AssessmentSummaryItem(BaseModel):
    id: int
    session_code: str
    anatomical_region: str
    created_at: datetime
    image_url: str
    triage_tier: int
    triage_title: str
    primary_condition: str
    is_archived: bool
    is_inconclusive: bool
    urgency_badge_color: str

