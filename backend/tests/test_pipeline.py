"""
Test Suite — Pipeline Orchestrator

Validates the risk scoring, verdict determination,
weighted aggregation, dynamic weights, and compound boosters.
"""

import pytest
from app.services.pipeline import (
    _compute_l1_risk,
    _aggregate_risk_score,
    _determine_verdict,
    _get_dynamic_weights,
    _apply_compound_boosters,
    BASE_WEIGHTS,
)


class TestL1RiskComputation:
    """L1 heuristic risk score tests."""

    def test_clean_url_low_risk(self):
        features = {
            "is_ip_address": False,
            "is_high_risk_tld": False,
            "is_https": True,
            "domain_entropy": 2.5,
            "url_length": 30,
            "subdomain_depth": 1,
            "keyword_count": 0,
            "has_redirect_indicator": False,
            "at_sign_count": 0,
            "has_non_standard_port": False,
            "has_encoded_url": False,
            "hyphen_count": 0,
            "dot_count": 2,
        }
        assert _compute_l1_risk(features) <= 10

    def test_suspicious_url_high_risk(self):
        features = {
            "is_ip_address": True,
            "is_high_risk_tld": True,
            "is_https": False,
            "domain_entropy": 4.5,
            "url_length": 150,
            "subdomain_depth": 5,
            "keyword_count": 4,
            "has_redirect_indicator": True,
            "at_sign_count": 1,
            "has_non_standard_port": True,
            "has_encoded_url": True,
            "hyphen_count": 5,
            "dot_count": 6,
        }
        score = _compute_l1_risk(features)
        assert score >= 80

    def test_score_capped_at_100(self):
        features = {
            "is_ip_address": True,
            "is_high_risk_tld": True,
            "is_https": False,
            "domain_entropy": 5.0,
            "url_length": 200,
            "subdomain_depth": 10,
            "keyword_count": 10,
            "has_redirect_indicator": True,
            "at_sign_count": 5,
            "has_non_standard_port": True,
            "has_encoded_url": True,
            "hyphen_count": 8,
            "dot_count": 10,
        }
        assert _compute_l1_risk(features) <= 100

    def test_medium_entropy_moderate_risk(self):
        features = {
            "is_ip_address": False,
            "is_high_risk_tld": False,
            "is_https": True,
            "domain_entropy": 3.8,
            "url_length": 70,
            "subdomain_depth": 2,
            "keyword_count": 1,
            "has_redirect_indicator": False,
            "at_sign_count": 0,
            "has_non_standard_port": False,
            "has_encoded_url": False,
            "hyphen_count": 1,
            "dot_count": 3,
        }
        score = _compute_l1_risk(features)
        assert 10 <= score <= 30


class TestDynamicWeights:
    """Dynamic weight redistribution tests."""

    def test_full_weights_sum_to_one(self):
        weights = _get_dynamic_weights(has_html=True, has_visual=True)
        assert abs(sum(weights.values()) - 1.0) < 0.01

    def test_no_html_redistributes_l6(self):
        weights = _get_dynamic_weights(has_html=False, has_visual=True)
        assert "l6_behavioral" not in weights
        assert abs(sum(weights.values()) - 1.0) < 0.01

    def test_no_visual_redistributes_l4(self):
        weights = _get_dynamic_weights(has_html=True, has_visual=False)
        assert "l4_visual" not in weights
        assert abs(sum(weights.values()) - 1.0) < 0.01

    def test_no_html_no_visual(self):
        weights = _get_dynamic_weights(has_html=False, has_visual=False)
        assert "l4_visual" not in weights
        assert "l6_behavioral" not in weights
        assert abs(sum(weights.values()) - 1.0) < 0.01


class TestRiskAggregation:
    """Weighted risk score aggregation tests."""

    def test_all_zero_returns_zero(self):
        weights = _get_dynamic_weights(has_html=True, has_visual=True)
        scores = {k: 0 for k in weights}
        assert _aggregate_risk_score(scores, weights) == 0

    def test_all_hundred_returns_100(self):
        weights = _get_dynamic_weights(has_html=True, has_visual=True)
        scores = {k: 100 for k in weights}
        assert _aggregate_risk_score(scores, weights) == 100

    def test_ml_model_dominates(self):
        weights = _get_dynamic_weights(has_html=True, has_visual=True)
        scores = {k: 0 for k in weights}
        scores["l2_ml"] = 100
        result = _aggregate_risk_score(scores, weights)
        assert 25 <= result <= 35

    def test_missing_keys_default_zero(self):
        weights = _get_dynamic_weights(has_html=True, has_visual=True)
        scores = {"l2_ml": 50}
        result = _aggregate_risk_score(scores, weights)
        assert result == round(50 * weights["l2_ml"])


class TestCompoundBoosters:
    """Compound signal boosting tests."""

    def test_brand_plus_risky_tld_boosts(self):
        result = _apply_compound_boosters(
            base_score=30,
            l1_features={"is_high_risk_tld": True, "keyword_count": 0, "is_ip_address": False},
            l3_result={"attack_vector": "typosquatting"},
            l5_result={"ssl_valid": True},
            l2_result={},
            l1_risk=20, l3_risk=80, l5_risk=10, l2_risk=40,
        )
        assert result >= 55  # 30 + 25 brand+tld boost

    def test_no_boost_for_legitimate(self):
        result = _apply_compound_boosters(
            base_score=10,
            l1_features={"is_high_risk_tld": False, "keyword_count": 0, "is_ip_address": False},
            l3_result={"attack_vector": "legitimate"},
            l5_result={"ssl_valid": True},
            l2_result={},
            l1_risk=5, l3_risk=0, l5_risk=5, l2_risk=10,
        )
        assert result == 10  # No boost applied

    def test_multiple_boosters_stack(self):
        result = _apply_compound_boosters(
            base_score=35,
            l1_features={"is_high_risk_tld": True, "keyword_count": 3, "is_ip_address": False},
            l3_result={"attack_vector": "typosquatting"},
            l5_result={"ssl_valid": False},
            l2_result={},
            l1_risk=40, l3_risk=85, l5_risk=50, l2_risk=70,
        )
        assert result >= 80  # Multiple boosters stacking

    def test_ip_host_plus_keywords(self):
        result = _apply_compound_boosters(
            base_score=40,
            l1_features={"is_high_risk_tld": False, "keyword_count": 2, "is_ip_address": True},
            l3_result={"attack_vector": "none"},
            l5_result={"ssl_valid": False},
            l2_result={},
            l1_risk=40, l3_risk=0, l5_risk=30, l2_risk=50,
        )
        assert result >= 55  # IP + keywords boost


class TestVerdictDetermination:
    """Verdict classification tests (thresholds: phishing=65, suspicious=40)."""

    def test_high_risk_phishing(self):
        assert _determine_verdict(80) == "phishing"

    def test_medium_risk_suspicious(self):
        assert _determine_verdict(50) == "suspicious"

    def test_low_risk_legitimate(self):
        assert _determine_verdict(20) == "legitimate"

    def test_boundary_65_phishing(self):
        assert _determine_verdict(65) == "phishing"

    def test_boundary_40_suspicious(self):
        assert _determine_verdict(40) == "suspicious"

    def test_boundary_39_legitimate(self):
        assert _determine_verdict(39) == "legitimate"
