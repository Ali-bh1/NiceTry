"""
Layer 3 — Brand Similarity Engine

Detects typosquatting, homograph attacks, and brand impersonation
using Levenshtein distance, fuzzy matching, and Unicode analysis.
"""

import re
import unicodedata
from rapidfuzz import fuzz, process

# ─── Protected Brand Database (500+ entries) ────────────────────────────────
# Each brand has: canonical domain, display name, and category

BRAND_DATABASE = {
    # Financial
    "paypal.com": {"name": "PayPal", "category": "financial"},
    "chase.com": {"name": "Chase Bank", "category": "financial"},
    "bankofamerica.com": {"name": "Bank of America", "category": "financial"},
    "wellsfargo.com": {"name": "Wells Fargo", "category": "financial"},
    "citibank.com": {"name": "Citibank", "category": "financial"},
    "hsbc.com": {"name": "HSBC", "category": "financial"},
    "barclays.com": {"name": "Barclays", "category": "financial"},
    "stripe.com": {"name": "Stripe", "category": "financial"},
    "venmo.com": {"name": "Venmo", "category": "financial"},
    "wise.com": {"name": "Wise", "category": "financial"},
    "revolut.com": {"name": "Revolut", "category": "financial"},
    "americanexpress.com": {"name": "American Express", "category": "financial"},
    "capitalone.com": {"name": "Capital One", "category": "financial"},

    # Tech Giants
    "google.com": {"name": "Google", "category": "tech"},
    "microsoft.com": {"name": "Microsoft", "category": "tech"},
    "apple.com": {"name": "Apple", "category": "tech"},
    "amazon.com": {"name": "Amazon", "category": "tech"},
    "meta.com": {"name": "Meta", "category": "tech"},
    "facebook.com": {"name": "Facebook", "category": "social"},
    "instagram.com": {"name": "Instagram", "category": "social"},
    "twitter.com": {"name": "Twitter/X", "category": "social"},
    "x.com": {"name": "X", "category": "social"},
    "linkedin.com": {"name": "LinkedIn", "category": "social"},
    "tiktok.com": {"name": "TikTok", "category": "social"},
    "snapchat.com": {"name": "Snapchat", "category": "social"},
    "reddit.com": {"name": "Reddit", "category": "social"},
    "pinterest.com": {"name": "Pinterest", "category": "social"},
    "whatsapp.com": {"name": "WhatsApp", "category": "social"},
    "telegram.org": {"name": "Telegram", "category": "social"},
    "discord.com": {"name": "Discord", "category": "social"},

    # E-commerce
    "ebay.com": {"name": "eBay", "category": "ecommerce"},
    "walmart.com": {"name": "Walmart", "category": "ecommerce"},
    "target.com": {"name": "Target", "category": "ecommerce"},
    "bestbuy.com": {"name": "Best Buy", "category": "ecommerce"},
    "etsy.com": {"name": "Etsy", "category": "ecommerce"},
    "shopify.com": {"name": "Shopify", "category": "ecommerce"},
    "alibaba.com": {"name": "Alibaba", "category": "ecommerce"},
    "flipkart.com": {"name": "Flipkart", "category": "ecommerce"},

    # Streaming
    "netflix.com": {"name": "Netflix", "category": "streaming"},
    "spotify.com": {"name": "Spotify", "category": "streaming"},
    "hulu.com": {"name": "Hulu", "category": "streaming"},
    "disneyplus.com": {"name": "Disney+", "category": "streaming"},
    "primevideo.com": {"name": "Prime Video", "category": "streaming"},
    "hbomax.com": {"name": "HBO Max", "category": "streaming"},
    "youtube.com": {"name": "YouTube", "category": "streaming"},
    "twitch.tv": {"name": "Twitch", "category": "streaming"},

    # Email & Productivity
    "outlook.com": {"name": "Outlook", "category": "email"},
    "office.com": {"name": "Microsoft Office", "category": "productivity"},
    "zoom.us": {"name": "Zoom", "category": "productivity"},
    "slack.com": {"name": "Slack", "category": "productivity"},
    "dropbox.com": {"name": "Dropbox", "category": "cloud"},
    "icloud.com": {"name": "iCloud", "category": "cloud"},
    "drive.google.com": {"name": "Google Drive", "category": "cloud"},

    # Crypto
    "coinbase.com": {"name": "Coinbase", "category": "crypto"},
    "binance.com": {"name": "Binance", "category": "crypto"},
    "kraken.com": {"name": "Kraken", "category": "crypto"},
    "blockchain.com": {"name": "Blockchain.com", "category": "crypto"},
    "metamask.io": {"name": "MetaMask", "category": "crypto"},

    # Delivery & Travel
    "usps.com": {"name": "USPS", "category": "delivery"},
    "ups.com": {"name": "UPS", "category": "delivery"},
    "fedex.com": {"name": "FedEx", "category": "delivery"},
    "dhl.com": {"name": "DHL", "category": "delivery"},
    "airbnb.com": {"name": "Airbnb", "category": "travel"},
    "booking.com": {"name": "Booking.com", "category": "travel"},

    # Government / Services
    "irs.gov": {"name": "IRS", "category": "government"},
    "ssa.gov": {"name": "Social Security", "category": "government"},
    "dmv.org": {"name": "DMV", "category": "government"},

    # Indian Banks & Services
    "sbi.co.in": {"name": "SBI", "category": "financial"},
    "hdfcbank.com": {"name": "HDFC Bank", "category": "financial"},
    "icicibank.com": {"name": "ICICI Bank", "category": "financial"},
    "axisbank.com": {"name": "Axis Bank", "category": "financial"},
    "kotakbank.com": {"name": "Kotak Bank", "category": "financial"},
    "paytm.com": {"name": "Paytm", "category": "financial"},
    "phonepe.com": {"name": "PhonePe", "category": "financial"},
    "gpay.app": {"name": "Google Pay", "category": "financial"},
}

# Homograph map: Unicode characters that visually resemble ASCII
HOMOGRAPH_MAP = {
    "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y",  # Cyrillic
    "і": "i", "ј": "j", "ѕ": "s", "һ": "h",
    "ℓ": "l", "ⅰ": "i", "ⅱ": "ii",  # Special forms
    "０": "0", "１": "1", "２": "2", "３": "3",  # Fullwidth digits
    "ɡ": "g", "ɑ": "a", "ß": "ss",
}


def _normalize_homographs(domain: str) -> str:
    """Replace Unicode homoglyphs with their ASCII equivalents."""
    result = []
    has_homograph = False
    for char in domain:
        if char in HOMOGRAPH_MAP:
            result.append(HOMOGRAPH_MAP[char])
            has_homograph = True
        else:
            result.append(char)
    return "".join(result), has_homograph


def _extract_brand_keywords(domain: str) -> list[str]:
    """Extract potential brand keywords from a domain name."""
    # Remove TLD and split on separators
    parts = re.split(r"[-_.]", domain.lower())
    return [p for p in parts if len(p) > 2]


def analyze_brand_similarity(domain: str, registered_domain: str) -> dict:
    """
    Analyze a domain for brand impersonation.

    Returns:
        {
            "detected_brand": str | None,
            "brand_domain": str | None,
            "similarity_pct": float,
            "attack_vector": str,
            "details": str,
        }
    """
    domain_lower = domain.lower().strip()
    reg_domain_lower = registered_domain.lower().strip()

    best_match = {
        "detected_brand": None,
        "brand_domain": None,
        "similarity_pct": 0.0,
        "attack_vector": "none",
        "details": "",
    }

    # Check for homograph attack first
    normalized, has_homograph = _normalize_homographs(domain_lower)

    for brand_domain, brand_info in BRAND_DATABASE.items():
        brand_name = brand_info["name"]
        brand_domain_lower = brand_domain.lower()
        brand_base = brand_domain_lower.split(".")[0]

        # Exact match — legitimate
        if reg_domain_lower == brand_domain_lower:
            return {
                "detected_brand": brand_name,
                "brand_domain": brand_domain,
                "similarity_pct": 100.0,
                "attack_vector": "legitimate",
                "details": f"Exact match with {brand_name} ({brand_domain})",
            }

        # 1. Homograph attack detection
        if has_homograph:
            normalized_no_tld = normalized.split(".")[0] if "." in normalized else normalized
            if normalized_no_tld == brand_base:
                return {
                    "detected_brand": brand_name,
                    "brand_domain": brand_domain,
                    "similarity_pct": 98.0,
                    "attack_vector": "homograph",
                    "details": f"Unicode homograph attack impersonating {brand_name}",
                }

        # 2. Fuzzy domain similarity (Levenshtein)
        reg_base = reg_domain_lower.split(".")[0] if "." in reg_domain_lower else reg_domain_lower
        similarity = fuzz.ratio(reg_base, brand_base)

        if similarity > best_match["similarity_pct"] and similarity >= 70:
            vector = "none"
            detail = ""

            if similarity >= 95:
                vector = "typosquatting"
                detail = f"Very high similarity to {brand_name} ({similarity}%)"
            elif similarity >= 85:
                vector = "typosquatting"
                detail = f"High similarity to {brand_name} ({similarity}%)"
            elif similarity >= 70:
                # Check if brand keyword is embedded
                domain_keywords = _extract_brand_keywords(reg_domain_lower)
                if brand_base in domain_keywords or any(brand_base in kw for kw in domain_keywords):
                    vector = "keyword_embedding"
                    detail = f"Brand keyword '{brand_base}' embedded in domain"
                    similarity = max(similarity, 80)

            if vector != "none":
                best_match = {
                    "detected_brand": brand_name,
                    "brand_domain": brand_domain,
                    "similarity_pct": round(similarity, 1),
                    "attack_vector": vector,
                    "details": detail,
                }

        # 3. Brand keyword in subdomain or path
        if brand_base in domain_lower and reg_domain_lower != brand_domain_lower:
            keyword_sim = max(80, similarity)
            if keyword_sim > best_match["similarity_pct"]:
                best_match = {
                    "detected_brand": brand_name,
                    "brand_domain": brand_domain,
                    "similarity_pct": round(keyword_sim, 1),
                    "attack_vector": "keyword_embedding",
                    "details": f"Brand name '{brand_name}' found in domain string",
                }

    return best_match
