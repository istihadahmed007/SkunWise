import time
from typing import Dict, Tuple
from fastapi import HTTPException, status, Request

class SimpleRateLimiter:
    """
    In-memory sliding window rate limiter for security-sensitive endpoints
    (Authentication, User Registration, and Skin Image Intake).
    Zero external dependencies, serverless-safe, and self-cleaning.
    """

    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        # key -> list of request timestamps
        self._requests: Dict[str, list[float]] = {}
        self._last_cleanup = time.time()

    def _cleanup_old_entries(self, now: float):
        """Periodically clean up entries older than window."""
        if now - self._last_cleanup < 60:
            return
        self._last_cleanup = now
        cutoff = now - self.window_seconds
        stale_keys = []
        for key, timestamps in self._requests.items():
            valid = [ts for ts in timestamps if ts > cutoff]
            if valid:
                self._requests[key] = valid
            else:
                stale_keys.append(key)
        for key in stale_keys:
            self._requests.pop(key, None)

    def reset(self):
        """Reset all rate limiter tracking."""
        self._requests.clear()

    def check(self, identifier: str) -> Tuple[bool, int]:
        """
        Check if identifier has exceeded the limit.
        Returns: (is_allowed: bool, retry_after_seconds: int)
        """
        now = time.time()
        self._cleanup_old_entries(now)
        cutoff = now - self.window_seconds

        timestamps = self._requests.get(identifier, [])
        # Filter within window
        timestamps = [ts for ts in timestamps if ts > cutoff]

        if len(timestamps) >= self.max_requests:
            oldest = timestamps[0]
            retry_after = max(1, int(self.window_seconds - (now - oldest)))
            self._requests[identifier] = timestamps
            return False, retry_after

        timestamps.append(now)
        self._requests[identifier] = timestamps
        return True, 0

    def enforce(self, request: Request, identifier_suffix: str = ""):
        """
        FastAPI dependency helper.
        Extracts client IP and checks rate limit.
        """
        client_ip = request.client.host if request.client else "127.0.0.1"
        # Handle reverse proxies (e.g. X-Forwarded-For)
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()

        key = f"{client_ip}:{identifier_suffix}"
        allowed, retry_after = self.check(key)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Too many requests. Please try again in {retry_after} seconds.",
                headers={"Retry-After": str(retry_after)}
            )

# Preconfigured security limiters
auth_rate_limiter = SimpleRateLimiter(max_requests=8, window_seconds=60)        # 8 login attempts / min
register_rate_limiter = SimpleRateLimiter(max_requests=4, window_seconds=60)    # 4 registrations / min
analyze_rate_limiter = SimpleRateLimiter(max_requests=12, window_seconds=60)    # 12 analyses / min
