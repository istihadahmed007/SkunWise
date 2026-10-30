import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent
is_serverless = bool(os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"))
default_db = "sqlite:////tmp/skinwise.db" if is_serverless else f"sqlite:///{BASE_DIR}/skinwise.db"
default_storage = Path("/tmp/skinwise_storage") if is_serverless else BASE_DIR / "storage"

class Settings(BaseSettings):
    PROJECT_NAME: str = "SkinWise AI"
    VERSION: str = "4.2.1-derm-triage"
    API_V1_STR: str = "/api"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    SEED_DEMO_DATA: bool = os.getenv("SEED_DEMO_DATA", "false").lower() == "true"
    
    WORKER_SECRET: str = os.getenv("WORKER_SECRET", "skinwise-local-worker-secret-internal-use-only")
    BEHIND_TRUSTED_PROXY: bool = os.getenv("BEHIND_TRUSTED_PROXY", "false").lower() == "true"
    TRUSTED_PROXIES: List[str] = [x.strip() for x in os.getenv("TRUSTED_PROXIES", "127.0.0.1,::1").split(",") if x.strip()]
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "skinwise-dev-clinical-insecure-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    GUEST_TOKEN_EXPIRE_MINUTES: int = 60 * 24       # 24 hours for guest assessments
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", default_db)
    
    # Private Storage configuration
    STORAGE_DIR: Path = Path(os.getenv("STORAGE_DIR", str(default_storage)))
    UPLOAD_DIR: Path = Path(os.getenv("UPLOAD_DIR", str(default_storage / "private_uploads")))
    REPORTS_DIR: Path = Path(os.getenv("REPORTS_DIR", str(default_storage / "reports")))
    
    MAX_FILE_SIZE_BYTES: int = 25 * 1024 * 1024  # 25 MB
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]
    
    # Optical Viability Thresholds (Clinical Quality Assessment)
    MIN_SHARPNESS_SCORE: float = 120.0  # Laplacian variance threshold
    MIN_LUMINANCE: float = 40.0
    MAX_LUMINANCE: float = 230.0
    MAX_GLARE_RATIO: float = 0.08
    
    # AI Engine Configuration
    AI_MODEL_BACKBONE: str = "gemini-3.5-flash-lite"
    HF_TOKEN: str = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACE_API_KEY", "")
    HF_MODEL_ID: str = os.getenv("HF_MODEL_ID", "Jayanth2002/dinov2-base-finetuned-SkinDisease")
    HF_ROUTER_URL: str = "https://router.huggingface.co/hf-inference/models"

    # Public APIs (openFDA & Open-Meteo)
    OPENFDA_API_KEY: str = os.getenv("OPENFDA_API_KEY", "")
    OPENFDA_COSMETICS_URL: str = os.getenv("OPENFDA_COSMETICS_URL", "https://api.fda.gov/cosmetic/event.json")
    OPEN_METEO_UV_URL: str = os.getenv("OPEN_METEO_UV_URL", "https://api.open-meteo.com/v1/forecast")
    
    SUPPORTED_CATEGORIES: List[str] = [
        "eczema_contact_dermatitis",
        "acne_vulgaris",
        "psoriasis",
        "fungal_tinea",
        "benign_melanocytic_macule",
        "suspicious_dysplastic_lesion"
    ]
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ]

    class Config:
        case_sensitive = True

settings = Settings()

# Enforce secure SECRET_KEY in all non-development/test deployments (Fail-closed)
env_normalized = settings.ENVIRONMENT.lower().strip()
if env_normalized not in ("development", "test"):
    insecure_keys = [
        "skinwise-dev-clinical-insecure-key-change-in-production",
        "skinwise-super-secret-clinical-key-2026-production-grade",
        "replace_with_a_secure_random_64_char_key_for_production",
        "secret",
        "changeme"
    ]
    if (
        not settings.SECRET_KEY
        or len(settings.SECRET_KEY.strip()) < 32
        or settings.SECRET_KEY in insecure_keys
        or "change-in-production" in settings.SECRET_KEY
    ):
        raise RuntimeError(
            "CRITICAL SECURITY CONFIGURATION ERROR: A high-entropy, production-grade SECRET_KEY "
            "(at least 32 characters) must be configured in environment variables for non-development environments."
        )

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)

