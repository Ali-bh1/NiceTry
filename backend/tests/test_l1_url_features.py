"""
Test Suite — Layer 1: URL Feature Extraction

Validates all feature extraction logic against known phishing
and legitimate URL patterns.
"""

import pytest
from app.services.detection.l1_url_features import (
    extract_features,
    get_ml_feature_vector,
    _shannon_entropy,
)


class TestShannonEntropy:
    """Shannon entropy calculation tests."""

    def test_empty_string_returns_zero(self):
        assert _shannon_entropy("") == 0.0

    def test_single_char_returns_zero(self):
        assert _shannon_entropy("a") == 0.0

    def test_uniform_distribution_high_entropy(self):
        # All unique characters → high entropy
        entropy = _shannon_entropy("abcdefghij")
        assert entropy > 3.0

    def test_repeated_char_low_entropy(self):
        entropy = _shannon_entropy("aaaaaaaaaa")
        assert entropy == 0.0

    def test_random_string_higher_than_repetitive(self):
        random_ent = _shannon_entropy("x7k9qm2f")
        repeat_ent = _shannon_entropy("aaabbbccc")
        assert random_ent > repeat_ent


class TestExtractFeatures:
    """URL feature extraction tests."""

    def test_legitimate_https_url(self):
        features = extract_features("https://www.google.com/search?q=test")
        assert features["is_https"] == 1
        assert features["is_ip_address"] == 0
        assert features["is_high_risk_tld"] == 0
        assert features["registered_domain"] == "google.com"

    def test_http_url_no_https(self):
        features = extract_features("http://example.com")
        assert features["is_https"] == 0

    def test_ip_address_detection(self):
        features = extract_features("http://192.168.1.1/login")
        assert features["is_ip_address"] == 1

    def test_high_risk_tld(self):
        features = extract_features("https://phishing-site.tk")
        assert features["is_high_risk_tld"] == 1

    def test_normal_tld(self):
        features = extract_features("https://example.com")
        assert features["is_high_risk_tld"] == 0

    def test_subdomain_depth(self):
        features = extract_features("https://a.b.c.d.example.com")
        assert features["subdomain_depth"] >= 3

    def test_suspicious_keywords(self):
        features = extract_features("https://login-verify-account.tk/secure")
        assert features["keyword_count"] >= 2
        assert "login" in features["keyword_matches"]

    def test_at_sign_detection(self):
        features = extract_features("https://google.com@evil.com")
        assert features["at_sign_count"] >= 1

    def test_redirect_indicator(self):
        features = extract_features("https://evil.com/redirect=https://google.com")
        assert features["has_redirect_indicator"] == 1

    def test_non_standard_port(self):
        features = extract_features("https://example.com:8443/path")
        assert features["has_non_standard_port"] == 1

    def test_standard_port_not_flagged(self):
        features = extract_features("https://example.com:443/path")
        assert features["has_non_standard_port"] == 0

    def test_url_length(self):
        long_path = "a" * 200
        features = extract_features(f"https://example.com/{long_path}")
        assert features["url_length"] > 200


class TestMLFeatureVector:
    """ML feature vector conversion tests."""

    def test_vector_length(self):
        features = extract_features("https://example.com")
        vector = get_ml_feature_vector(features)
        assert len(vector) == 23  # Matches FEATURE_ORDER

    def test_vector_all_numeric(self):
        features = extract_features("https://example.com/path?q=test")
        vector = get_ml_feature_vector(features)
        assert all(isinstance(v, float) for v in vector)

    def test_missing_features_default_zero(self):
        vector = get_ml_feature_vector({})
        assert all(v == 0.0 for v in vector)
