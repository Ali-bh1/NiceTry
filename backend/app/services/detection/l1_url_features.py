"""
Layer 1 — URL Feature Extraction

Performs structural analysis of the URL string to extract
15+ engineered features used by the ML model. No network
requests are made — this is pure string/parsing analysis.
"""

import math
import re
from urllib.parse import urlparse, parse_qs
import tldextract


# TLDs frequently abused by phishing campaigns
HIGH_RISK_TLDS = {
    "tk", "ml", "ga", "cf", "gq",     # Free TLDs (Freenom)
    "xyz", "top", "work", "click",     # Cheap/abused
    "buzz", "cam", "icu", "monster",
    "rest", "surf", "quest", "sbs",
    "zip", "mov",                       # Confusing new gTLDs
}

SUSPICIOUS_KEYWORDS = {
    "login", "signin", "verify", "secure", "account", "update",
    "confirm", "banking", "password", "credential", "authenticate",
    "wallet", "payment", "paypal", "amazon", "apple", "microsoft",
    "netflix", "facebook", "instagram", "google", "support", "help",
    "service", "suspended", "unusual", "activity", "alert",
}


def _shannon_entropy(text: str) -> float:
    """Calculate Shannon entropy of a string — high entropy = randomized/suspicious."""
    if not text:
        return 0.0
    freq = {}
    for ch in text:
        freq[ch] = freq.get(ch, 0) + 1
    length = len(text)
    return -sum((count / length) * math.log2(count / length) for count in freq.values())


def _count_special_chars(url: str) -> dict:
    """Count suspicious special characters in the URL."""
    return {
        "dots": url.count("."),
        "hyphens": url.count("-"),
        "underscores": url.count("_"),
        "slashes": url.count("/"),
        "at_signs": url.count("@"),
        "double_slashes": url.count("//") - 1,  # subtract the protocol://
        "tildes": url.count("~"),
        "percent_encoded": len(re.findall(r"%[0-9a-fA-F]{2}", url)),
        "ampersands": url.count("&"),
        "equals": url.count("="),
    }


def extract_features(url: str) -> dict:
    """
    Extract all Layer 1 features from a URL string.

    Returns a dictionary of feature_name -> value that feeds into
    the ML model (Layer 2) and the brand similarity engine (Layer 3).
    """
    parsed = urlparse(url)
    extracted = tldextract.extract(url)
    hostname = parsed.hostname or ""
    path = parsed.path or ""
    query = parsed.query or ""
    special = _count_special_chars(url)

    # --- Core structural features ---
    url_length = len(url)
    hostname_length = len(hostname)
    path_length = len(path)
    query_length = len(query)

    # --- TLD analysis ---
    tld = extracted.suffix.lower()
    is_high_risk_tld = tld in HIGH_RISK_TLDS

    # --- Protocol ---
    has_https = parsed.scheme == "https"

    # --- Subdomain analysis ---
    subdomain = extracted.subdomain
    subdomain_depth = len(subdomain.split(".")) if subdomain else 0

    # --- IP address as host ---
    is_ip_address = bool(re.match(
        r"^(\d{1,3}\.){3}\d{1,3}$", hostname
    )) if hostname else False

    # --- Entropy ---
    domain_entropy = _shannon_entropy(extracted.domain)
    full_entropy = _shannon_entropy(hostname)

    # --- Character ratios ---
    digit_count = sum(c.isdigit() for c in url)
    letter_count = sum(c.isalpha() for c in url)
    digit_ratio = digit_count / max(len(url), 1)
    letter_ratio = letter_count / max(len(url), 1)

    # --- Suspicious keyword detection ---
    url_lower = url.lower()
    keyword_matches = [kw for kw in SUSPICIOUS_KEYWORDS if kw in url_lower]
    keyword_count = len(keyword_matches)

    # --- Redirect indicators ---
    has_redirect_url = bool(re.search(r"(redirect|url|next|goto|return)=", url_lower))
    has_encoded_url = "http%3a" in url_lower or "http%3A" in url_lower

    # --- Query parameter analysis ---
    params = parse_qs(query)
    param_count = len(params)

    # --- Port presence ---
    has_non_standard_port = parsed.port is not None and parsed.port not in (80, 443)

    # --- Path depth ---
    path_segments = [s for s in path.split("/") if s]
    path_depth = len(path_segments)

    features = {
        # Structural
        "url_length": url_length,
        "hostname_length": hostname_length,
        "path_length": path_length,
        "query_length": query_length,
        "path_depth": path_depth,

        # TLD & Protocol
        "is_https": int(has_https),
        "is_high_risk_tld": int(is_high_risk_tld),
        "tld": tld,

        # Subdomain
        "subdomain_depth": subdomain_depth,
        "has_subdomain": int(bool(subdomain)),

        # IP
        "is_ip_address": int(is_ip_address),

        # Entropy
        "domain_entropy": round(domain_entropy, 4),
        "full_entropy": round(full_entropy, 4),

        # Character distribution
        "digit_ratio": round(digit_ratio, 4),
        "letter_ratio": round(letter_ratio, 4),
        "special_char_count": sum(special.values()),
        "dot_count": special["dots"],
        "hyphen_count": special["hyphens"],
        "at_sign_count": special["at_signs"],

        # Suspicious indicators
        "keyword_count": keyword_count,
        "keyword_matches": keyword_matches,
        "has_redirect_indicator": int(has_redirect_url),
        "has_encoded_url": int(has_encoded_url),
        "has_non_standard_port": int(has_non_standard_port),

        # Query
        "param_count": param_count,

        # Domain info (for downstream layers)
        "registered_domain": extracted.registered_domain,
        "subdomain_str": subdomain,
        "domain_name": extracted.domain,
    }

    return features


def get_ml_feature_vector(features: dict) -> list[float]:
    """
    Convert the feature dictionary into a numeric vector
    suitable for XGBoost/sklearn model input.

    Returns a list of floats in a fixed, consistent order.
    """
    FEATURE_ORDER = [
        "url_length", "hostname_length", "path_length", "query_length",
        "path_depth", "is_https", "is_high_risk_tld", "subdomain_depth",
        "has_subdomain", "is_ip_address", "domain_entropy", "full_entropy",
        "digit_ratio", "letter_ratio", "special_char_count", "dot_count",
        "hyphen_count", "at_sign_count", "keyword_count",
        "has_redirect_indicator", "has_encoded_url", "has_non_standard_port",
        "param_count",
    ]
    return [float(features.get(f, 0)) for f in FEATURE_ORDER]


# Feature names for SHAP explanations
ML_FEATURE_NAMES = [
    "URL Length", "Hostname Length", "Path Length", "Query Length",
    "Path Depth", "HTTPS", "High-Risk TLD", "Subdomain Depth",
    "Has Subdomain", "IP as Host", "Domain Entropy", "Full Entropy",
    "Digit Ratio", "Letter Ratio", "Special Chars", "Dot Count",
    "Hyphen Count", "@ Signs", "Suspicious Keywords",
    "Redirect Indicator", "Encoded URL", "Non-Standard Port",
    "Query Params",
]
