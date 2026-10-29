"""
Entrypoint for Vercel and ASGI runners.
Exposes the FastAPI application object from app.main.
"""
from app.main import app

__all__ = ["app"]

