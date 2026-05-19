"""
Test Suite — Layer 3: Brand Similarity Engine

Validates typosquatting detection, homograph attacks,
keyword embedding, and legitimate domain recognition.
"""

import pytest
from app.services.detection.l3_brand_similarity import (
    analyze_brand_similarity,
    _normalize_homographs,
    _extract_brand_keywords,
)


class TestHomographNormalization:
    """Unicode homograph detection tests."""

    def test_cyrillic_a_normalized(self):
        # Cyrillic 'а' (U+0430) looks like Latin 'a'
        text, has_homograph = _normalize_homographs("pаypal")
        assert has_homograph is True
        assert text == "paypal"

    def test_clean_text_no_homograph(self):
        text, has_homograph = _normalize_homographs("paypal")
        assert has_homograph is False
        assert text == "paypal"

    def test_multiple_homoglyphs(self):
        # Cyrillic о and а
        text, has_homograph = _normalize_homographs("gооgle")
        assert has_homograph is True


class TestBrandKeywordExtraction:
    """Brand keyword extraction tests."""

    def test_simple_domain(self):
        keywords = _extract_brand_keywords("paypal-secure")
        assert "paypal" in keywords
        assert "secure" in keywords

    def test_short_parts_filtered(self):
        keywords = _extract_brand_keywords("a-b-paypal")
        assert "paypal" in keywords
        assert "a" not in keywords


class TestBrandSimilarity:
    """Brand similarity analysis tests."""

    def test_exact_match_legitimate(self):
        result = analyze_brand_similarity("paypal.com", "paypal.com")
        assert result["attack_vector"] == "legitimate"
        assert result["similarity_pct"] == 100.0

    def test_typosquatting_detection(self):
        # "paypall" (extra l) has ~92% similarity to "paypal" — above 70% threshold
        result = analyze_brand_similarity("paypall.com", "paypall.com")
        assert result["detected_brand"] is not None
        assert result["similarity_pct"] >= 70

    def test_keyword_embedding_detection(self):
        result = analyze_brand_similarity(
            "paypal-login-verify.com", "paypal-login-verify.com"
        )
        assert result["detected_brand"] is not None
        assert result["attack_vector"] in ("keyword_embedding", "typosquatting")

    def test_unrelated_domain_no_match(self):
        result = analyze_brand_similarity(
            "randomsite123.com", "randomsite123.com"
        )
        assert result["attack_vector"] == "none"
        assert result["similarity_pct"] == 0.0

    def test_google_typosquat(self):
        # "googlee" (extra e) has ~92% similarity to "google"
        result = analyze_brand_similarity("googlee.com", "googlee.com")
        assert result["detected_brand"] is not None

    def test_legitimate_google(self):
        result = analyze_brand_similarity("google.com", "google.com")
        assert result["attack_vector"] == "legitimate"

    def test_brand_in_subdomain(self):
        result = analyze_brand_similarity(
            "paypal.evil-domain.com", "evil-domain.com"
        )
        assert result["detected_brand"] is not None
        assert result["attack_vector"] == "keyword_embedding"
