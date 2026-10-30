import time
from typing import Dict, Any, Optional
import httpx
from app.core.config import settings

class OpenMeteoUVService:
    """
    Client for Open-Meteo Solar & UV Index API.
    Provides real-time UV radiation index and daily maximums to compute
    evidence-based dermatological photoprotection guidance (WHO / CDC / AAD standards).

    LICENSING & REGULATORY COMPLIANCE:
    Open-Meteo data is free for open-source and non-commercial use under
    Creative Commons Attribution 4.0 International (CC BY 4.0).
    Commercial production use requires an Open-Meteo commercial subscription.
    """

    CACHE_TTL_SECONDS = 1800  # 30 minutes in-memory cache
    REQUEST_TIMEOUT = 10.0

    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def get_uv_guidance(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Fetch UV Index from Open-Meteo and compute photoprotection guidance.
        """
        # Validate coordinates
        if not (-90.0 <= latitude <= 90.0) or not (-180.0 <= longitude <= 180.0):
            return {
                "success": False,
                "message": "Invalid latitude (-90 to 90) or longitude (-180 to 180) provided.",
                "current_uv_index": None,
                "max_uv_today": None,
                "risk_tier": "Unavailable",
                "guidance": [],
                "licensing_notice": self.get_licensing_notice(),
                "attribution": "Open-Meteo (open-meteo.com)"
            }

        cache_key = f"{round(latitude, 2)}:{round(longitude, 2)}"
        now = time.time()
        if cache_key in self._cache:
            entry = self._cache[cache_key]
            if now - entry["timestamp"] < self.CACHE_TTL_SECONDS:
                return entry["data"]

        url = (
            f"{settings.OPEN_METEO_UV_URL}"
            f"?latitude={latitude}&longitude={longitude}"
            f"&current=uv_index,temperature_2m"
            f"&daily=uv_index_max"
            f"&timezone=auto"
        )

        headers = {
            "User-Agent": "SkinWise-AI/1.0 (Healthcare Triage Platform; Contact: support@skinwise.local)"
        }

        try:
            with httpx.Client(timeout=self.REQUEST_TIMEOUT) as client:
                response = client.get(url, headers=headers)
                response.raise_for_status()
                payload = response.json()

                current_uv = payload.get("current", {}).get("uv_index", 0.0)
                daily_max_list = payload.get("daily", {}).get("uv_index_max", [])
                max_today = daily_max_list[0] if daily_max_list else current_uv
                temp_c = payload.get("current", {}).get("temperature_2m")

                # Evaluate photoprotection tier using standard WHO UV index
                tier_info = self._calculate_uv_tier(current_uv, max_today)

                data = {
                    "success": True,
                    "latitude": latitude,
                    "longitude": longitude,
                    "timezone": payload.get("timezone", "UTC"),
                    "temperature_celsius": temp_c,
                    "current_uv_index": round(current_uv, 1),
                    "max_uv_today": round(max_today, 1),
                    "risk_tier": tier_info["tier_name"],
                    "badge_color": tier_info["badge_color"],
                    "summary": tier_info["summary"],
                    "photoprotection_guidance": tier_info["actions"],
                    "recommended_spf": tier_info["recommended_spf"],
                    "licensing_notice": self.get_licensing_notice(),
                    "attribution": "Weather & UV Index data by Open-Meteo.com (CC BY 4.0)",
                    "source_url": "https://open-meteo.com/en/docs"
                }

                self._cache[cache_key] = {"timestamp": now, "data": data}
                return data

        except httpx.TimeoutException:
            return {
                "success": False,
                "message": "Open-Meteo UV request timed out.",
                "current_uv_index": None,
                "max_uv_today": None,
                "risk_tier": "Unavailable",
                "guidance": ["Sunscreen advice temporarily unavailable. Practice standard sun safety (broad-spectrum SPF 30+)."],
                "licensing_notice": self.get_licensing_notice(),
                "attribution": "Open-Meteo (open-meteo.com)"
            }
        except Exception as err:
            return {
                "success": False,
                "message": f"Unable to retrieve UV data: {str(err)}",
                "current_uv_index": None,
                "max_uv_today": None,
                "risk_tier": "Unavailable",
                "guidance": ["Sunscreen advice temporarily unavailable. Practice standard sun safety (broad-spectrum SPF 30+)."],
                "licensing_notice": self.get_licensing_notice(),
                "attribution": "Open-Meteo (open-meteo.com)"
            }

    @staticmethod
    def _calculate_uv_tier(current_uv: float, max_today: float) -> Dict[str, Any]:
        """
        WHO / CDC UV Index photoprotection scale:
        0 - 2: Low
        3 - 5: Moderate
        6 - 7: High
        8 - 10: Very High
        11+: Extreme
        """
        ref_uv = max(current_uv, max_today * 0.7)  # accounts for upcoming daytime peak

        if ref_uv < 3.0:
            return {
                "tier_name": "Low UV (0–2)",
                "badge_color": "emerald",
                "summary": "Minimal risk of sun damage under normal exposure.",
                "recommended_spf": "SPF 30",
                "actions": [
                    "Normal outdoor activities are safe without special restrictions.",
                    "If you have sensitive or easily flushed skin, apply broad-spectrum SPF 30 as part of your morning skincare routine.",
                    "Wear sunglasses on bright days to protect eyes from reflective glare."
                ]
            }
        elif ref_uv < 6.0:
            return {
                "tier_name": "Moderate UV (3–5)",
                "badge_color": "sky",
                "summary": "Moderate risk of harm from unprotected sun exposure.",
                "recommended_spf": "SPF 30+",
                "actions": [
                    "Apply broad-spectrum sunscreen (SPF 30 or higher) generously 15 minutes before going outside.",
                    "Seek shade during peak midday hours (10:00 AM – 4:00 PM).",
                    "Wear a wide-brimmed hat and UV-blocking sunglasses to protect delicate facial skin."
                ]
            }
        elif ref_uv < 8.0:
            return {
                "tier_name": "High UV (6–7)",
                "badge_color": "amber",
                "summary": "High risk of skin damage and burning without protection.",
                "recommended_spf": "SPF 30–50",
                "actions": [
                    "Generously apply broad-spectrum sunscreen (SPF 30 to 50); reapply every 2 hours or after swimming/sweating.",
                    "Limit direct midday sun between 10:00 AM and 4:00 PM.",
                    "Wear lightweight, protective long-sleeved clothing and UV400-rated sunglasses."
                ]
            }
        elif ref_uv < 11.0:
            return {
                "tier_name": "Very High UV (8–10)",
                "badge_color": "rose",
                "summary": "Very high risk of skin burns in short duration. Extra photoprotection essential.",
                "recommended_spf": "SPF 50+",
                "actions": [
                    "Avoid unnecessary direct sun between 10:00 AM and 4:00 PM.",
                    "Wear high-SPF (50+) broad-spectrum sunscreen, reapplying strictly every 2 hours.",
                    "Stay in the shade as much as possible; wear wide-brimmed hat, sunglasses, and protective layers."
                ]
            }
        else:
            return {
                "tier_name": "Extreme UV (11+)",
                "badge_color": "purple",
                "summary": "Extreme risk. Unprotected skin can burn within minutes.",
                "recommended_spf": "SPF 50+ Broad Spectrum",
                "actions": [
                    "Take all precautions. Avoid being outdoors during midday hours.",
                    "Shirt, sunscreen (SPF 50+), wide hat, and sunglasses are mandatory for any outdoor exposure.",
                    "White surfaces like sand or water reflect UV radiation, multiplying exposure."
                ]
            }

    @staticmethod
    def get_licensing_notice() -> str:
        return (
            "Open-Meteo weather data is free for non-commercial and open-source use under "
            "Creative Commons Attribution 4.0 International (CC BY 4.0). "
            "For commercial deployment, an Open-Meteo commercial subscription is required."
        )

uv_service = OpenMeteoUVService()

