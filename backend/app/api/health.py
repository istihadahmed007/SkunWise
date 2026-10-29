from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.core.config import settings
from app.services.vision_engine import vision_engine

router = APIRouter(tags=["System Health & Diagnostics"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Returns full health status:
    - Service metadata
    - Database connection
    - Computer vision inference adapter status
    - Storage availability
    """
    # 1. Database check
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    # 2. Vision engine check
    vision_status = vision_engine.health_check()

    # 3. Storage check
    storage_ok = settings.UPLOAD_DIR.exists() and settings.REPORTS_DIR.exists()

    return {
        "status": "operational",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": db_status,
        "vision_engine": vision_status,
        "storage": {
            "status": "healthy" if storage_ok else "degraded",
            "upload_dir": str(settings.UPLOAD_DIR),
            "reports_dir": str(settings.REPORTS_DIR)
        }
    }

