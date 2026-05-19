"""
Test Suite — Layer 7: AI Threat Investigator

Validates threat classification, evidence ranking, action
recommendations, and narrative generation.
"""

import pytest
from app.services.detection.l7_ai_investigator import (
    _classify_threat,
    _build_evidence_list,
    _recommend_action,
    generate_report,
)


class TestThreatClassification:
    """Threat type classification tests."""

    def test_brand_impersonation_priority(self):
        results = {
            "l3": {"similarity_pct": 90, "attack_vector": "typosquatting"},
            "l6": {"hidden_forms": True},
        }
        assert _classify_threat(results) == "brand_impersonation"

    def test_credential_harvesting(self):
        results = {
            "l3": {"similarity_pct": 20, "attack_vector": "none"},
            "l6": {"hidden_forms": True, "fake_login_overlay": False},
        }
        assert _classify_threat(results) == "credential_harvesting"

    def test_technical_exploit(self):
        results = {
            "l3": {"similarity_pct": 0, "attack_vector": "none"},
            "l6": {
                "hidden_forms": False,
                "fake_login_overlay": False,
                "detected_behaviors": ["keylogger_suspected", "eval_usage"],
                "popup_loops": False,
                "clipboard_hijack": False,
            },
        }
        assert _classify_threat(results) == "technical_exploit"

    def test_scam_detection(self):
        results = {
            "l3": {"similarity_pct": 0, "attack_vector": "none"},
            "l6": {
                "hidden_forms": False,
                "fake_login_overlay": False,
                "detected_behaviors": [],
                "popup_loops": True,
                "clipboard_hijack": False,
            },
        }
        assert _classify_threat(results) == "scam"

    def test_unknown_when_no_signals(self):
        results = {
            "l3": {"similarity_pct": 0, "attack_vector": "none"},
            "l6": {
                "hidden_forms": False,
                "fake_login_overlay": False,
                "detected_behaviors": [],
                "popup_loops": False,
                "clipboard_hijack": False,
            },
        }
        assert _classify_threat(results) == "unknown"


class TestEvidenceBuilding:
    """Evidence list construction tests."""

    def test_evidence_sorted_by_confidence(self):
        results = {
            "l1": {"is_ip_address": True, "is_high_risk_tld": True, "tld": "tk"},
            "l2": {"phishing_probability": 0.95},
            "l3": {"detected_brand": "PayPal", "attack_vector": "typosquatting", "similarity_pct": 92},
            "l5": {"domain_age_days": 3, "privacy_protected": True, "infrastructure_risk": 60},
            "l6": {"hidden_forms": True, "clipboard_hijack": False, "iframe_abuse": False},
        }
        evidence = _build_evidence_list(results)
        assert len(evidence) >= 3

        # Should be sorted by confidence descending
        confidences = [e["confidence"] for e in evidence]
        assert confidences == sorted(confidences, reverse=True)

    def test_empty_results_no_evidence(self):
        evidence = _build_evidence_list({})
        assert evidence == []


class TestActionRecommendation:
    """Recommended action tests."""

    def test_high_risk_exit(self):
        assert _recommend_action(85) == "exit"

    def test_medium_risk_caution(self):
        assert _recommend_action(50) == "caution"

    def test_low_risk_safe(self):
        assert _recommend_action(15) == "safe"

    def test_boundary_75_exit(self):
        assert _recommend_action(75) == "exit"

    def test_boundary_40_caution(self):
        assert _recommend_action(40) == "caution"


class TestGenerateReport:
    """Full report generation tests."""

    def test_high_risk_report(self):
        report = generate_report(
            url="https://paypa1-secure.tk/login",
            domain="paypa1-secure.tk",
            risk_score=92,
            layer_results={
                "l1": {"is_high_risk_tld": True, "tld": "tk", "is_ip_address": False},
                "l2": {"phishing_probability": 0.93},
                "l3": {
                    "detected_brand": "PayPal",
                    "brand_domain": "paypal.com",
                    "similarity_pct": 94,
                    "attack_vector": "typosquatting",
                },
                "l4": {},
                "l5": {"domain_age_days": 2, "privacy_protected": True, "infrastructure_risk": 75, "registrar": "NameCheap"},
                "l6": {"hidden_forms": True, "clipboard_hijack": False, "iframe_abuse": False},
            },
        )
        assert report["threat_type"] == "brand_impersonation"
        assert report["recommended_action"] == "exit"
        assert "PayPal" in report["narrative"]
        assert len(report["evidence"]) >= 3

    def test_low_risk_report(self):
        report = generate_report(
            url="https://google.com",
            domain="google.com",
            risk_score=5,
            layer_results={
                "l1": {"is_high_risk_tld": False, "is_ip_address": False},
                "l2": {"phishing_probability": 0.03},
                "l3": {"detected_brand": "Google", "similarity_pct": 100, "attack_vector": "legitimate"},
                "l4": {},
                "l5": {"domain_age_days": 9000, "privacy_protected": False, "infrastructure_risk": 0},
                "l6": {"hidden_forms": False, "clipboard_hijack": False, "iframe_abuse": False},
            },
        )
        assert report["recommended_action"] == "safe"
        assert "legitimate" in report["narrative"].lower() or "safe" in report["narrative"].lower()
