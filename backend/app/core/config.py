import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "SkinWise AI"
    VERSION: str = "4.2.1-derm-triage"
    API_V1_STR: str = "/api"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "skinwise-super-secret-clinical-key-2026-production-grade")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/skinwise.db")
    
    # Private Storage configuration
    STORAGE_DIR: Path = BASE_DIR / "storage"
    UPLOAD_DIR: Path = BASE_DIR / "storage" / "private_uploads"
    REPORTS_DIR: Path = BASE_DIR / "storage" / "reports"
    
    MAX_FILE_SIZE_BYTES: int = 25 * 1024 * 1024  # 25 MB
    ALLOWED_IMAGE_TYPES: List[str] = ["image/jpeg", "image/png", "image/webp"]
    
    # Optical Viability Thresholds (Clinical Quality Assessment)
    MIN_SHARPNESS_SCORE: float = 120.0  # Laplacian variance threshold
    MIN_LUMINANCE: float = 40.0
    MAX_LUMINANCE: float = 230.0
    MAX_GLARE_RATIO: float = 0.08
    
    # AI Engine Configuration
    AI_MODEL_BACKBONE: str = "mobilenet_v3_small-derm-adapter"
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

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.REPORTS_DIR.mkdir(parents=True, exist_ok=True)

