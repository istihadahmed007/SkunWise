import io
import hashlib
from typing import Tuple, Optional
from PIL import Image, ImageOps
from fastapi import HTTPException, status, UploadFile
from app.core.config import settings

# Protect against decompression bombs / resource exhaustion DoS
Image.MAX_IMAGE_PIXELS = 25_000_000

MAX_DIMENSION = 6000
MIN_DIMENSION = 200
MAX_ASPECT_RATIO = 5.0

async def read_stream_with_byte_limit(file: UploadFile, max_bytes: Optional[int] = None) -> bytes:
    """
    Streams file upload in 64KB chunks while actively counting bytes.
    Aborts immediately with HTTP 413 if upload exceeds limit BEFORE buffering
    the remainder into server memory.
    """
    limit = max_bytes or settings.MAX_FILE_SIZE_BYTES
    chunks = []
    total_bytes = 0
    chunk_size = 64 * 1024  # 64 KB

    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        total_bytes += len(chunk)
        if total_bytes > limit:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Uploaded file exceeds maximum allowed limit of {limit // (1024 * 1024)}MB."
            )
        chunks.append(chunk)

    return b"".join(chunks)

def compute_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def validate_magic_bytes(data: bytes) -> str:
    """
    Validates actual file header magic bytes to prevent file extension spoofing.
    Returns detected format ('JPEG', 'PNG', 'WEBP') or raises HTTPException.
    """
    if len(data) < 12:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is too small to contain a valid image header."
        )

    # JPEG signature: 0xFF, 0xD8, 0xFF
    if data[:3] == b"\xff\xd8\xff":
        return "JPEG"

    # PNG signature: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "PNG"

    # WebP signature: RIFF....WEBP
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "WEBP"

    # Actionable detection for HEIC/HEIF uploads
    if b"ftypheic" in data[:24] or b"ftypmif1" in data[:24] or b"ftypmsf1" in data[:24]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="HEIC/HEIF format is not supported directly. Please convert your photo to JPEG, PNG, or WebP, or take a photo directly with your camera."
        )

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Invalid file signature (magic bytes). File must be a genuine JPEG, PNG, or WebP photo."
    )

def sanitize_and_validate_image(
    file_bytes: bytes,
    original_filename: str,
    content_type: Optional[str] = None
) -> Tuple[bytes, str, int, int]:
    """
    Security-Hardened Image Intake:
    1. Validates file size bounds (1KB to 25MB).
    2. Validates magic bytes / file signatures against spoofing.
    3. Enforces decompression bomb pixel safety threshold (Image.MAX_IMAGE_PIXELS).
    4. Enforces dimension boundaries (200px to 6000px) and realistic aspect ratio (<= 5:1).
    5. Strips all EXIF metadata (GPS coordinates, camera serial numbers, personal metadata).
    6. Re-encodes cleanly into sanitized JPEG buffer.
    7. Computes cryptographic SHA-256 integrity hash.
    """
    if len(file_bytes) > settings.MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_FILE_SIZE_BYTES // (1024*1024)}MB."
        )

    if len(file_bytes) < 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is too small (< 1KB) to be a valid dermatological image."
        )

    # 1. Check Magic Bytes
    detected_format = validate_magic_bytes(file_bytes)

    try:
        # 2. Decompression Bomb & Integrity Verification
        try:
            image = Image.open(io.BytesIO(file_bytes))
            image.verify()
        except Image.DecompressionBombError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security rejection: Image exceeds maximum allowed pixel count (decompression bomb protection)."
            )

        # Re-open for transformation (verify() resets file pointer and state)
        image = Image.open(io.BytesIO(file_bytes))

        # 3. Auto-orient based on EXIF before stripping metadata
        try:
            image = ImageOps.exif_transpose(image)
        except Exception:
            pass

        # 4. Convert palette/RGBA to RGB for standard medical processing
        if image.mode in ("RGBA", "P", "LA"):
            image = image.convert("RGB")
        elif image.mode != "RGB":
            image = image.convert("RGB")

        width, height = image.size

        # 5. Dimension checks
        if width < MIN_DIMENSION or height < MIN_DIMENSION:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image resolution ({width}x{height}) is too low for clinical feature segmentation. Minimum {MIN_DIMENSION}x{MIN_DIMENSION} required."
            )

        if width > MAX_DIMENSION or height > MAX_DIMENSION:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image resolution ({width}x{height}) exceeds maximum allowed dimension of {MAX_DIMENSION}px."
            )

        # 6. Aspect Ratio Check
        aspect_ratio = max(width / height, height / width)
        if aspect_ratio > MAX_ASPECT_RATIO:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Image aspect ratio ({aspect_ratio:.1f}:1) is abnormal. Please upload a standard dermatological photo."
            )

        # 7. Re-encode into clean byte buffer WITHOUT any EXIF tags
        clean_buffer = io.BytesIO()
        image.save(clean_buffer, format="JPEG", quality=92, optimize=True)
        clean_bytes = clean_buffer.getvalue()

        image_hash = compute_sha256(clean_bytes)

        return clean_bytes, image_hash, width, height

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or corrupted image format. Please upload a clear JPEG, PNG, or WebP photo. Error: {str(e)}"
        )
