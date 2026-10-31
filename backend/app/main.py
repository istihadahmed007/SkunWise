import uuid
from datetime import datetime, timezone
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.core.security import get_password_hash
from app.models.schemas import User, Assessment, ConsentRecord
from app.api import auth, assessments, health, knowledge, integrations, providers

def seed_demo_patient(db):
    """Seed initial demo patient with consent and realistic sample assessments."""
    user = User(
        email="sarah.jenkins@example.com",
        hashed_password=get_password_hash("SkinWise2026!"),
        full_name="Sarah Jenkins",
        is_active=True,
        zero_cloud_retention=False,
        data_retention_days=90
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Add consent records
    db.add(ConsentRecord(
        user_id=user.id,
        consent_type="biometric_intake_authorization",
        agreed=True
    ))
    db.add(ConsentRecord(
        user_id=user.id,
        consent_type="ce_mdr_class_1_disclaimer",
        agreed=True
    ))

    # Add two realistic clinical assessment records matching Screen C
    assessment1 = Assessment(
        user_id=user.id,
        session_code="SW-94820",
        image_filename="demo_shoulder_lesion.jpg",
        image_hash="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        anatomical_region="Right Posterior Deltoid",
        symptom_data={
            "anatomical_region": "Right Posterior Deltoid",
            "duration_days": 18,
            "itch_score": 3,
            "pain_score": 0,
            "is_spreading": False,
            "bleeding_or_crusting": False,
            "prior_chemical_exposure": False,
            "exposure_details": "None",
            "personal_skin_history": "Regular sun exposure during youth"
        },
        quality_metrics={
            "is_acceptable": True,
            "sharpness_score": 890.2,
            "sharpness_status": "Pass (High Edge Fidelity)",
            "ambient_lux": 460.0,
            "lighting_status": "Good (Natural Diffuse Daylight)",
            "glare_ratio": 0.005,
            "glare_status": "Pass",
            "framing_status": "Pass",
            "overall_usability_score": 96,
            "quality_notes": ["Optimal macro sharpness score 890.2"]
        },
        ai_predictions={
            "calibrated_probabilities": {
                "suspicious_dysplastic_lesion": 0.28,
                "benign_melanocytic_macule": 0.62,
                "eczema_contact_dermatitis": 0.05
            },
            "morphological_features": {
                "asymmetry_score": 0.19,
                "border_irregularity": 0.22,
                "color_entropy": 0.31,
                "erythema_saturation": 0.33
            }
        },
        triage_tier=2,
        triage_title="Medical Assessment Recommended",
        triage_rationale="Visual AI detects slight boundary irregularity (ABCDE rule). Recommend booking dermoscopy exam with Dr. Patricia Evans or your primary dermatologist within 14 days.",
        primary_condition="Shoulder Pigmented Lesion",
        possible_conditions=[
            {
                "condition_id": "benign_melanocytic_macule",
                "name": "Benign Melanocytic Nevus with Mild Border Variation",
                "category": "Pigmented Skin Lesion",
                "concordance_tier": "Primary Pattern Match",
                "visual_overlap": "Well-demarcated pigment network, mild architectural asymmetry",
                "clinical_history_correlation": "18 days documented observation on deltoid",
                "summary": "Common melanocytic lesion requiring routine dermatoscopic follow-up.",
                "publisher_source": "DermNet New Zealand / BAD",
                "source_url": "https://dermnetnz.org/topics/melanocytic-naevus"
            }
        ],
        clinical_guidance={
            "safe_self_care": ["Apply broad-spectrum mineral SPF 50+ sunscreen daily", "Monthly ABCDE self-examination"],
            "what_to_avoid": ["Do NOT attempt home mole removal", "Avoid chronic clothing friction"],
            "critical_warning_signs": ["Sudden spontaneous bleeding", "Rapid color change to black or red"]
        },
        uncertainties=[
            "No Palpation / Induration Test: Unable to assess deep dermal induration.",
            "Polarized Dermoscopy Missing: Sub-surface vascular capillary loops unseen."
        ],
        emergency_warning_detected=False,
        is_inconclusive=False,
        is_archived=False
    )

    assessment2 = Assessment(
        user_id=user.id,
        session_code="SW-89104",
        image_filename="demo_forearm_rash.jpg",
        image_hash="5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
        anatomical_region="Left Volar Forearm",
        symptom_data={
            "anatomical_region": "Left Volar Forearm",
            "duration_days": 7,
            "itch_score": 1,
            "pain_score": 0,
            "is_spreading": False,
            "bleeding_or_crusting": False,
            "prior_chemical_exposure": True,
            "exposure_details": "Botanical hand soap",
            "personal_skin_history": "Mild atopic history"
        },
        quality_metrics={
            "is_acceptable": True,
            "sharpness_score": 1420.0,
            "sharpness_status": "Pass",
            "ambient_lux": 480.0,
            "lighting_status": "Good",
            "glare_ratio": 0.0,
            "glare_status": "Pass",
            "framing_status": "Pass",
            "overall_usability_score": 98,
            "quality_notes": ["High quality score"]
        },
        ai_predictions={
            "calibrated_probabilities": {
                "eczema_contact_dermatitis": 0.85,
                "psoriasis": 0.08
            }
        },
        triage_tier=1,
        triage_title="Mild / Benign Pattern",
        triage_rationale="Self-monitored episode. Follow-up photograph captured on Day 7 confirmed disappearance of contact dermatitis flare. Symptom diary entry logged as non-itchy.",
        primary_condition="Forearm Mild Rash (Resolving Contact Dermatitis)",
        possible_conditions=[
            {
                "condition_id": "eczema_contact_dermatitis",
                "name": "Contact Dermatitis / Resolving Erythema",
                "category": "Inflammatory Dermatosis",
                "concordance_tier": "Primary Pattern Match",
                "visual_overlap": "Faint superficial residual erythema, clear margins",
                "clinical_history_correlation": "Trigger eliminated; itch subsided",
                "summary": "Resolving acute irritant contact dermatitis.",
                "publisher_source": "American Academy of Dermatology (AAD)",
                "source_url": "https://www.aad.org"
            }
        ],
        clinical_guidance={
            "safe_self_care": ["Fragrance-free ceramide emollient twice daily", "Lukewarm water cleansing"],
            "what_to_avoid": ["Avoid scented soaps and botanical oils", "Do NOT scratch"],
            "critical_warning_signs": ["Spreading redness with fever", "Pustule formation"]
        },
        uncertainties=["No patch allergy testing performed."],
        emergency_warning_detected=False,
        is_inconclusive=False,
        is_archived=True
    )

    db.add(assessment1)
    db.add(assessment2)
    db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure storage paths exist
    try:
        settings.STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
        settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    except OSError:
        pass

    # Initialize SQLite / PostgreSQL tables
    Base.metadata.create_all(bind=engine)
    
    # Seed initial test patient and mock assessment only if explicitly enabled in non-production environments
    if settings.ENVIRONMENT != "production" and settings.SEED_DEMO_DATA:
        db = SessionLocal()
        try:
            existing = db.query(User).filter(User.email == "sarah.jenkins@example.com").first()
            if not existing:
                seed_demo_patient(db)
        finally:
            db.close()

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Clinical Decision Support & Dermatological Symptom Triage Web Platform",
    lifespan=lifespan,
    docs_url=f"{settings.API_V1_STR}/docs",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(assessments.router, prefix=settings.API_V1_STR)
app.include_router(knowledge.router, prefix=settings.API_V1_STR)
app.include_router(integrations.router, prefix=settings.API_V1_STR)
app.include_router(providers.router, prefix=settings.API_V1_STR)

@app.get("/")
@app.get(settings.API_V1_STR)
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": f"{settings.API_V1_STR}/docs",
        "health_check": f"{settings.API_V1_STR}/health"
    }
