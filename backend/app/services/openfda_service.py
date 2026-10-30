import time
import re
import urllib.parse
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings

class OpenFDACosmeticService:
    """
    Client for the official openFDA Cosmetic Adverse Event API.
    Retrieves voluntarily submitted consumer and clinician reports from the
    FDA Center for Food Safety and Applied Nutrition (CFSAN) Adverse Event
    Reporting System (CAERS).

    CRITICAL HEALTH & REGULATORY BOUNDARY:
    The submission of an adverse event report does not establish that the product
    caused or contributed to the adverse event. Reports are voluntarily submitted
    and unvalidated by the FDA.
    """

    CACHE_TTL_SECONDS = 3600  # 1 hour in-memory cache
    REQUEST_TIMEOUT = 10.0     # 10s timeout

    def __init__(self):
        self._cache: Dict[str, Dict[str, Any]] = {}

    def _sanitize_query(self, query: str) -> str:
        """Sanitize query string to prevent Lucene query injection in openFDA."""
        cleaned = re.sub(r'[^a-zA-Z0-9\s\-]', ' ', query)
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        return cleaned

    def search_cosmetic_events(self, query: str, limit: int = 5) -> Dict[str, Any]:
        """
        Search openFDA cosmetic adverse events by product brand name or product name.
        """
        cleaned_query = self._sanitize_query(query)
        if not cleaned_query:
            return {
                "success": False,
                "query": query,
                "total_reports": 0,
                "results": [],
                "message": "Please provide a valid product name or brand to search.",
                "disclaimer": self.get_disclaimer(),
                "source_url": "https://open.fda.gov/apis/cosmetics/event/"
            }

        limit = min(max(1, limit), 20)
        cache_key = f"{cleaned_query.lower()}:{limit}"

        # Check in-memory cache
        now = time.time()
        if cache_key in self._cache:
            entry = self._cache[cache_key]
            if now - entry["timestamp"] < self.CACHE_TTL_SECONDS:
                return entry["data"]

        # Formulate openFDA query: search products.product_name or products.brand_name
        encoded_term = urllib.parse.quote(f'"{cleaned_query}"')
        search_filter = f'products.product_name:{encoded_term}+products.brand_name:{encoded_term}'
        url = f"{settings.OPENFDA_COSMETICS_URL}?search={search_filter}&limit={limit}"
        if settings.OPENFDA_API_KEY:
            url += f"&api_key={settings.OPENFDA_API_KEY}"

        headers = {
            "User-Agent": "SkinWise-AI/1.0 (Healthcare Triage Platform; Contact: support@skinwise.local)"
        }

        try:
            with httpx.Client(timeout=self.REQUEST_TIMEOUT) as client:
                response = client.get(url, headers=headers)

                if response.status_code == 404:
                    # openFDA returns 404 when 0 matching records are found
                    data = {
                        "success": True,
                        "query": cleaned_query,
                        "total_reports": 0,
                        "results": [],
                        "message": f"No adverse event reports found in the openFDA database for '{cleaned_query}'.",
                        "disclaimer": self.get_disclaimer(),
                        "source_url": "https://open.fda.gov/apis/cosmetics/event/"
                    }
                    self._cache[cache_key] = {"timestamp": now, "data": data}
                    return data

                if response.status_code == 429:
                    return {
                        "success": False,
                        "query": cleaned_query,
                        "total_reports": 0,
                        "results": [],
                        "message": "openFDA request rate limit reached. Please wait a moment and try again.",
                        "disclaimer": self.get_disclaimer(),
                        "source_url": "https://open.fda.gov/apis/cosmetics/event/"
                    }

                response.raise_for_status()
                payload = response.json()

                total = payload.get("meta", {}).get("results", {}).get("total", 0)
                raw_results = payload.get("results", [])

                formatted_results = []
                for item in raw_results:
                    products = []
                    for p in item.get("products", []):
                        p_name = p.get("product_name") or p.get("brand_name") or "Cosmetic Product"
                        p_role = p.get("role", "Suspect")
                        products.append({"name": p_name, "role": p_role})

                    formatted_results.append({
                        "report_number": item.get("report_number"),
                        "date_received": item.get("latest_received_date") or item.get("initial_received_date"),
                        "products": products,
                        "reported_reactions": item.get("reactions", []),
                        "outcomes": item.get("outcomes", [])
                    })

                data = {
                    "success": True,
                    "query": cleaned_query,
                    "total_reports": total,
                    "results": formatted_results,
                    "message": f"Found {total} reported adverse event(s) in the FDA CAERS database.",
                    "disclaimer": self.get_disclaimer(),
                    "source_url": "https://open.fda.gov/apis/cosmetics/event/"
                }

                self._cache[cache_key] = {"timestamp": now, "data": data}
                return data

        except httpx.TimeoutException:
            return {
                "success": False,
                "query": cleaned_query,
                "total_reports": 0,
                "results": [],
                "message": "openFDA service request timed out. Please try again later.",
                "disclaimer": self.get_disclaimer(),
                "source_url": "https://open.fda.gov/apis/cosmetics/event/"
            }
        except Exception as err:
            return {
                "success": False,
                "query": cleaned_query,
                "total_reports": 0,
                "results": [],
                "message": f"Unable to reach openFDA service: {str(err)}",
                "disclaimer": self.get_disclaimer(),
                "source_url": "https://open.fda.gov/apis/cosmetics/event/"
            }

    @staticmethod
    def get_disclaimer() -> str:
        return (
            "Adverse event reports in the FDA CAERS database are voluntarily submitted and unvalidated. "
            "The submission of a report does NOT establish that a product caused or contributed to the adverse event. "
            "This tool provides public safety records for consumer awareness and does not substitute for medical evaluation."
        )

openfda_service = OpenFDACosmeticService()

