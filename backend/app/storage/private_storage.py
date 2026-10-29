import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import HTTPException, status
from app.core.config import settings

def save_private_image(clean_bytes: bytes, file_ext: str = "jpg") -> str:
    """
    Saves sanitized image bytes to private storage directory.
    Returns the secure stored filename (not a public URL).
    """
    filename = f"lesion_{uuid.uuid4().hex}.{file_ext}"
    filepath = settings.UPLOAD_DIR / filename
    
    with open(filepath, "wb") as f:
        f.write(clean_bytes)
        
    return filename

def get_private_image_path(filename: str) -> Path:
    """
    Resolves private image path, preventing directory traversal attacks.
    """
    # Prevent path traversal
    safe_filename = Path(filename).name
    filepath = settings.UPLOAD_DIR / safe_filename
    
    if not filepath.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found in private clinical storage."
        )
        
    return filepath

def delete_private_image(filename: str) -> bool:
    """
    Physically purges the image file from disk.
    Used for HIPAA/GDPR data erasure requests and zero-cloud retention.
    """
    try:
        safe_filename = Path(filename).name
        filepath = settings.UPLOAD_DIR / safe_filename
        if filepath.exists():
            os.remove(filepath)
            return True
        return False
    except Exception:
        return False

