"""
Layer 7 — AI Threat Investigator

Synthesizes all layer outputs into a human-readable threat narrative.
Uses template-based generation by default; can optionally use OpenAI/Gemini
when an API key is configured.
"""

import logging
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)

# Threat type classification rules
THREAT_TYPES = {
    "credential_harvesting": "Credential Harvesting",
    "brand_impersonation": "Brand Impersonation",
    "technical_exploit": "Technical Exploit",
    "scam": "Scam / Social Engineering",
    "unknown": "Unclassified Threat",
}


def _classify_threat(layer_results: dict) -> str:
    """Classify the dominant threat type from all layer signals."""
    brand = layer_results.get("l3", {})
    behavioral = layer_results.get("l6", {})

    # Brand impersonation takes priority when detected
    brand_sim = brand.get("similarity_pct", 0)
    brand_vector = brand.get("attack_vector", "none")
    if brand_sim >= 80 and brand_vector != "legitimate":
        return "brand_impersonation"

    # Credential harvesting via form analysis
    if behavioral.get("hidden_forms") or behavioral.get("fake_login_overlay"):
        return "credential_harvesting"

    # Technical exploit via JS obfuscation / keylogging
    behaviors = behavioral.get("detected_behaviors", [])
    if any(b in behaviors for b in ["keylogger_suspected", "eval_usage", "anti_debug"]):
        return "technical_exploit"

    # Behavioral flags suggesting scam
    if behavioral.get("popup_loops") or behavioral.get("clipboard_hijack"):
        return "scam"

    return "unknown"


def _build_evidence_list(layer_results: dict) -> list[dict]:
    """Build ranked evidence list from all layer findings."""
    evidence = []

    # L2 ML confidence
    l2 = layer_results.get("l2", {})
    prob = l2.get("phishing_probability", 0)
    if prob >= 0.5:
        evidence.append({
            "source": "ML Model",
            "confidence": prob,
            "detail": f"XGBoost classifier rated phishing probability at {prob*100:.1f}%",
        })

    # L3 Brand similarity
    l3 = layer_results.get("l3", {})
    if l3.get("detected_brand") and l3.get("attack_vector") != "legitimate":
        evidence.append({
            "source": "Brand Analysis",
            "confidence": l3["similarity_pct"] / 100,
            "detail": f"Domain impersonates {l3['detected_brand']} "
                      f"({l3['similarity_pct']}% similarity, {l3['attack_vector']})",
        })

    # L5 Threat intelligence
    l5 = layer_results.get("l5", {})
    age = l5.get("domain_age_days")
    if age is not None and age < 30:
        evidence.append({
            "source": "Threat Intelligence",
            "confidence": 0.85 if age < 7 else 0.65,
            "detail": f"Domain registered only {age} day(s) ago",
        })
    if l5.get("privacy_protected"):
        evidence.append({
            "source": "Threat Intelligence",
            "confidence": 0.5,
            "detail": "WHOIS registration is privacy-protected",
        })
    infra_risk = l5.get("infrastructure_risk", 0)
    if infra_risk >= 50:
        evidence.append({
            "source": "Infrastructure",
            "confidence": infra_risk / 100,
            "detail": f"Infrastructure risk score: {infra_risk}/100",
        })

    # L6 Behavioral
    l6 = layer_results.get("l6", {})
    if l6.get("hidden_forms"):
        evidence.append({
            "source": "Behavioral Analysis",
            "confidence": 0.9,
            "detail": "Hidden credential-harvesting forms detected",
        })
    if l6.get("clipboard_hijack"):
        evidence.append({
            "source": "Behavioral Analysis",
            "confidence": 0.85,
            "detail": "Clipboard hijacking script detected",
        })
    if l6.get("iframe_abuse"):
        evidence.append({
            "source": "Behavioral Analysis",
            "confidence": 0.7,
            "detail": "Suspicious iframe usage detected",
        })

    # L1 URL features
    l1 = layer_results.get("l1", {})
    if l1.get("is_ip_address"):
        evidence.append({
            "source": "URL Analysis",
            "confidence": 0.7,
            "detail": "URL uses raw IP address instead of domain name",
        })
    if l1.get("is_high_risk_tld"):
        evidence.append({
            "source": "URL Analysis",
            "confidence": 0.6,
            "detail": f"Uses high-risk TLD: .{l1.get('tld', 'unknown')}",
        })

    # Sort by confidence descending
    evidence.sort(key=lambda e: e["confidence"], reverse=True)
    return evidence


def _recommend_action(risk_score: int) -> str:
    """Determine recommended user action based on risk score."""
    if risk_score >= 75:
        return "exit"
    elif risk_score >= 40:
        return "caution"
    return "safe"


def _generate_template_narrative(
    url: str, domain: str, risk_score: int,
    threat_type: str, evidence: list[dict],
    layer_results: dict,
) -> str:
    """Generate a human-readable threat narrative from templates."""
    threat_label = THREAT_TYPES.get(threat_type, "Unclassified Threat")

    if risk_score < 30:
        opening = (
            f"This website ({domain}) appears to be legitimate. "
            f"No significant threats were detected during analysis."
        )
    elif risk_score < 60:
        opening = (
            f"This website ({domain}) shows some suspicious characteristics "
            f"that warrant caution. Risk classification: {threat_label}."
        )
    else:
        opening = (
            f"⚠️ This website ({domain}) is highly likely to be malicious. "
            f"Threat classification: {threat_label}. "
            f"Risk score: {risk_score}/100."
        )

    # Evidence section
    evidence_lines = []
    for i, e in enumerate(evidence[:5], 1):
        evidence_lines.append(f"{i}. [{e['source']}] {e['detail']}")
    evidence_text = "\n".join(evidence_lines) if evidence_lines else "No significant evidence collected."

    # Brand warning
    brand_warning = ""
    l3 = layer_results.get("l3", {})
    if l3.get("detected_brand") and l3.get("attack_vector") != "legitimate":
        brand_warning = (
            f"\n\nBrand Impersonation Alert: This domain appears to impersonate "
            f"{l3['detected_brand']} ({l3.get('brand_domain', 'unknown')}). "
            f"Similarity: {l3.get('similarity_pct', 0)}%. "
            f"Attack vector: {l3.get('attack_vector', 'unknown')}."
        )

    # Infrastructure warning
    infra_warning = ""
    l5 = layer_results.get("l5", {})
    age = l5.get("domain_age_days")
    if age is not None and age < 30:
        registrar = l5.get("registrar", "unknown registrar")
        privacy = "privacy-protected" if l5.get("privacy_protected") else "public"
        infra_warning = (
            f"\n\nInfrastructure Alert: Domain was registered {age} day(s) ago "
            f"through {registrar} ({privacy} registration)."
        )

    # Recommendation
    action = _recommend_action(risk_score)
    if action == "exit":
        rec = "Immediate exit is strongly recommended. Do not enter any credentials."
    elif action == "caution":
        rec = "Proceed with caution. Verify the website's identity before submitting any information."
    else:
        rec = "This website appears safe to use."

    narrative = f"""{opening}

Evidence (ranked by confidence):
{evidence_text}{brand_warning}{infra_warning}

Recommendation: {rec}"""

    return narrative.strip()


def generate_report(
    url: str, domain: str, risk_score: int, layer_results: dict,
) -> dict[str, Any]:
    """
    Generate the final AI Investigator report.

    Args:
        url: The analyzed URL
        domain: Extracted domain
        risk_score: Aggregated risk score (0-100)
        layer_results: Dict with keys l1, l2, l3, l4, l5, l6

    Returns:
        {
            "narrative": str,
            "threat_type": str,
            "recommended_action": str,
            "evidence": [...],
        }
    """
    threat_type = _classify_threat(layer_results)
    evidence = _build_evidence_list(layer_results)
    action = _recommend_action(risk_score)

    narrative = _generate_template_narrative(
        url=url, domain=domain, risk_score=risk_score,
        threat_type=threat_type, evidence=evidence,
        layer_results=layer_results,
    )

    return {
        "narrative": narrative,
        "threat_type": threat_type,
        "recommended_action": action,
        "evidence": evidence,
    }
