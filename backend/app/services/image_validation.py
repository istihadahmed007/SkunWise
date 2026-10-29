import io
import hashlib
from typing import Tuple, Optional
from PIL import Image, ImageOps
from fastapi import HTTPException, UploadFile, status
from app.core.config import settings

def compute_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def sanitize_and_validate_image(
    file_bytes: bytes,
    original_filename: str,
    content_type: Optional[str]
) -> Tuple[bytes, str, int, int]:
    """
    Validates image file size, MIME type, decodes bytes safely,
    strips all EXIF metadata (GPS, device serials), applies orientation,
    and returns (clean_bytes, sha256_hash, width, height).
    """
    if len(file_bytes) > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_BYTES // (1024*1024)}MB."
        )

    if len(file_bytes) < 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is too small to be a valid dermatological image."
        )

    try:
        # Safe open with Pillow
        image = Image.open(io.BytesIO(file_bytes))
        image.verify()  # Verify integrity
        
        # Re-open for transformation (verify invalidates state)
        image = Image.open(io.BytesIO(file_bytes))
        
        # Auto-orient based on EXIF before stripping EXIF
        try:
            image = ImageOps.exif_transpose(image)
        except Exception:
            pass

        # Convert palette/RGBA to RGB for standard medical processing
        if image.mode in ("RGBA", "P", "LA"):
            image = image.convert("RGB")
        elif image.mode != "RGB":
            image = image.convert("RGB")

        width, height = image.size
        
        if width < 200 or height < 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image resolution ({width}x{height}) is too low for clinical feature segmentation. Minimum 200x200 required."
            )

        # Re-encode into clean byte buffer WITHOUT any EXIF tags
        clean_buffer = io.BytesIO()
        image.save(clean_buffer, format="JPEG", quality=95, optimize=True)
        clean_bytes = clean_buffer.getvalue()
        
        image_hash = compute_sha256(clean_bytes)
        
        return clean_bytes, image_hash, width, height

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or corrupted image format. Please upload a clear JPEG or PNG photo. Error: {str(e)}"
        )

