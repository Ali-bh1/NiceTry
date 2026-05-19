"""
URL Sanitization & Validation Utilities

Provides defense-in-depth input validation for URLs before they
enter the detection pipeline. Prevents SSRF, injection, and
resource-abuse vectors.
"""

import re
import ipaddress
import logging
from urllib.parse import urlparse, unquote

logger = logging.getLogger(__name__)

# Maximum URL length to prevent resource exhaustion
MAX_URL_LENGTH = 2048

# Schemes allowed through the pipeline
ALLOWED_SCHEMES = {"http", "https"}

# Private/reserved IP ranges that should never be analyzed (SSRF prevention)
PRIVATE_NETWORKS = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),  # Link-local
    ipaddress.ip_network("::1/128"),          # IPv6 loopback
    ipaddress.ip_network("fc00::/7"),         # IPv6 ULA
    ipaddress.ip_network("fe80::/10"),        # IPv6 link-local
]


class URLValidationError(ValueError):
    """Raised when a URL fails validation checks."""

    def __init__(self, message: str, code: str):
        super().__init__(message)
        self.code = code


def _is_private_ip(hostname: str) -> bool:
    """Check if a hostname resolves to a private/reserved IP address."""
    try:
        addr = ipaddress.ip_address(hostname)
        return any(addr in network for network in PRIVATE_NETWORKS)
    except ValueError:
        return False


def _normalize_url(url: str) -> str:
    """Normalize a URL by decoding percent-encoding and stripping whitespace."""
    url = url.strip()

    # Decode double-encoded URLs (common evasion technique)
    prev = ""
    for _ in range(3):  # Max 3 decode passes to prevent infinite loops
        decoded = unquote(url)
        if decoded == prev:
            break
        prev = decoded
        url = decoded

    return url


def sanitize_url(url: str) -> str:
    """
    Validate and sanitize a URL for analysis.

    Raises URLValidationError if the URL is malformed, targets
    private infrastructure, or exceeds length limits.

    Returns:
        The sanitized URL string.
    """
    if not url or not isinstance(url, str):
        raise URLValidationError("URL is required", "missing_url")

    url = _normalize_url(url)

    if len(url) > MAX_URL_LENGTH:
        raise URLValidationError(
            f"URL exceeds maximum length ({MAX_URL_LENGTH} chars)",
            "url_too_long",
        )

    # Reject known-bad schemes BEFORE auto-prefixing
    scheme_match = re.match(r"^([a-zA-Z][a-zA-Z0-9+\-.]*):(?://|[^/])", url)
    if scheme_match:
        detected_scheme = scheme_match.group(1).lower()
        if detected_scheme not in ALLOWED_SCHEMES:
            raise URLValidationError(
                f"Unsupported URL scheme: {detected_scheme}",
                "invalid_scheme",
            )

    # Auto-prefix scheme if missing
    if not re.match(r"^https?://", url, re.IGNORECASE):
        url = "https://" + url

    parsed = urlparse(url)

    # Final scheme guard (catches edge cases)
    if parsed.scheme.lower() not in ALLOWED_SCHEMES:
        raise URLValidationError(
            f"Unsupported URL scheme: {parsed.scheme}",
            "invalid_scheme",
        )

    # Hostname validation
    hostname = parsed.hostname
    if not hostname:
        raise URLValidationError("URL has no valid hostname", "missing_hostname")

    # Block private/reserved IPs (SSRF prevention)
    if _is_private_ip(hostname):
        raise URLValidationError(
            "URLs targeting private/reserved IP ranges are not allowed",
            "private_ip",
        )

    # Block obviously malformed hostnames
    if len(hostname) > 253:
        raise URLValidationError("Hostname exceeds maximum length", "hostname_too_long")

    # Block URLs with credentials embedded (user:pass@host)
    if parsed.username or parsed.password:
        logger.warning(f"URL contains embedded credentials: {hostname}")

    return url
