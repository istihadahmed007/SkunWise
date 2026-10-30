import os
from datetime import datetime, timedelta, timezone
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.schemas import User, Assessment
from app.storage.private_storage import delete_private_image

class DataRetentionService:
    """
    Manages automated lifecycle retention and file scrubbing:
    - Enforces patient-configured data_retention_days (30, 90, 365, or indefinite).
    - Cleans up ephemeral/guest patient records older than 24 hours.
    - Purges stored raw dermoscopic photographs from private storage.
    """

    @staticmethod
    def cleanup_expired_records(db: Session) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        purged_images_count = 0
        expired_assessments_count = 0

        # 1. Process active users with defined retention windows
        users = db.query(User).filter(User.data_retention_days > 0).all()

        for u in users:
            retention_cutoff = now - timedelta(days=u.data_retention_days)
            expired_assessments = db.query(Assessment).filter(
                Assessment.user_id == u.id,
                Assessment.created_at < retention_cutoff,
                Assessment.is_deleted == False
            ).all()

            for a in expired_assessments:
                expired_assessments_count += 1
                if a.image_filename and a.image_filename != "EPHEMERAL_PURGED":
                    delete_private_image(a.image_filename)
                    a.image_filename = "EPHEMERAL_PURGED"
                    purged_images_count += 1
                a.is_deleted = True

        # 2. Process guest accounts older than 24 hours
        guest_cutoff = now - timedelta(hours=24)
        guest_users = db.query(User).filter(
            User.email.like("guest_%@skinwise.local"),
            User.created_at < guest_cutoff
        ).all()

        for g in guest_users:
            for ga in g.assessments:
                if ga.image_filename and ga.image_filename != "EPHEMERAL_PURGED":
                    delete_private_image(ga.image_filename)
                    purged_images_count += 1
            db.delete(g)

        db.commit()

        return {
            "success": True,
            "timestamp": now.isoformat(),
            "purged_images_count": purged_images_count,
            "expired_assessments_count": expired_assessments_count,
            "guest_accounts_pruned": len(guest_users)
        }

retention_service = DataRetentionService()

