"""
Pipeline Orchestrator

Coordinates all 7 detection layers into a single async analysis pipeline.
L1-L3 run synchronously (fast, CPU-only), L4-L6 run concurrently via
asyncio (network-bound), and L7 runs last to synthesize all results.

Scoring uses dynamic weight redistribution and compound signal boosting
to ensure multi-layer agreement correctly escalates risk.
"""

import asyncio
import logging
import time
from typing import Any
from urllib.parse import urlparse

import tldextract

from app.services.detection import l1_url_features
from app.services.detection import l2_ml_engine
from app.services.detection import l3_brand_similarity
from app.services.detection import l4_visual_clone
from app.services.detection import l5_threat_intel
from app.services.detection import l6_behavioral
from app.services.detection import l7_ai_investigator
from app.config import settings

logger = logging.getLogger(__name__)

# Base layer weight distribution for risk score aggregation
BASE_WEIGHTS = {
    "l2_ml": 0.30,        # ML model is primary signal
    "l3_brand": 0.20,     # Brand impersonation is strong indicator
    "l5_infra": 0.20,     # Infrastructure intelligence
    "l6_behavioral": 0.15, # Behavioral analysis
    "l1_heuristic": 0.10,  # URL heuristics
    "l4_visual": 0.05,     # Visual clone (stub weight)
}


def _compute_l1_risk(features: dict) -> int:
    """Derive a 0-100 risk score from L1 URL features."""
    score = 0
    if features.get("is_ip_address"):
        score += 25
    if features.get("is_high_risk_tld"):
        score += 20
    if not features.get("is_https"):
        score += 12
    if features.get("domain_entropy", 0) > 4.0:
        score += 12
    elif features.get("domain_entropy", 0) > 3.5:
        score += 6
    if features.get("url_length", 0) > 100:
        score += 10
    elif features.get("url_length", 0) > 60:
        score += 5
    if features.get("subdomain_depth", 0) > 3:
        score += 10
    elif features.get("subdomain_depth", 0) > 1:
        score += 4
    if features.get("keyword_count", 0) > 3:
        score += 15
    elif features.get("keyword_count", 0) > 1:
        score += 8
    elif features.get("keyword_count", 0) == 1:
        score += 4
    if features.get("has_redirect_indicator"):
        score += 8
    if features.get("at_sign_count", 0) > 0:
        score += 15
    if features.get("has_non_standard_port"):
        score += 10
    if features.get("has_encoded_url"):
        score += 8
    if features.get("hyphen_count", 0) > 3:
        score += 6
    if features.get("dot_count", 0) > 4:
        score += 5
    return min(score, 100)


def _get_dynamic_weights(
    has_html: bool, has_visual: bool
) -> dict[str, float]:
    """
    Redistribute weights from inactive layers to active ones.

    When L6 (behavioral) has no HTML input, its weight goes to L1+L3+L5.
    When L4 (visual) is a stub, its weight goes to L2+L3.
    """
    weights = dict(BASE_WEIGHTS)

    # L4 is always a stub currently
    if not has_visual:
        l4_weight = weights.pop("l4_visual")
        weights["l2_ml"] += l4_weight * 0.6
        weights["l3_brand"] += l4_weight * 0.4

    # L6 needs HTML to function; without it, redistribute
    if not has_html:
        l6_weight = weights.pop("l6_behavioral")
        weights["l1_heuristic"] += l6_weight * 0.3
        weights["l3_brand"] += l6_weight * 0.3
        weights["l5_infra"] += l6_weight * 0.4

    return weights


def _aggregate_risk_score(
    layer_scores: dict[str, int],
    weights: dict[str, float],
) -> int:
    """Compute weighted aggregate risk score from all layers."""
    total = 0.0
    for key, weight in weights.items():
        total += layer_scores.get(key, 0) * weight
    return min(int(round(total)), 100)


def _apply_compound_boosters(
    base_score: int,
    l1_features: dict,
    l3_result: dict,
    l5_result: dict,
    l2_result: dict,
    l1_risk: int,
    l3_risk: int,
    l5_risk: int,
    l2_risk: int,
) -> int:
    """
    Apply compound signal boosters when multiple layers independently
    confirm a threat. These rules catch cases where individual layer
    scores are moderate but their COMBINATION is highly suspicious.
    """
    boost = 0

    # ── Compound 1: Brand impersonation + high-risk TLD ──
    # If someone registered "paypal-login.tk", that's near-certain phishing
    is_brand_attack = l3_result.get("attack_vector") not in ("none", "legitimate", None)
    is_risky_tld = bool(l1_features.get("is_high_risk_tld"))

    if is_brand_attack and is_risky_tld:
        boost += 25
        logger.info("Compound boost: brand impersonation + high-risk TLD (+25)")

    # ── Compound 2: Brand impersonation + suspicious keywords ──
    if is_brand_attack and l1_features.get("keyword_count", 0) >= 2:
        boost += 15
        logger.info("Compound boost: brand impersonation + keywords (+15)")

    # ── Compound 3: New/dead domain + no SSL ──
    no_ssl = not l5_result.get("ssl_valid", False)
    domain_suspicious = l5_risk >= 30
    if domain_suspicious and no_ssl:
        boost += 10
        logger.info("Compound boost: suspicious infrastructure + no SSL (+10)")

    # ── Compound 4: ML high confidence + heuristic agreement ──
    if l2_risk >= 60 and l1_risk >= 30:
        boost += 10
        logger.info("Compound boost: ML + heuristic agreement (+10)")

    # ── Compound 5: IP address host + suspicious keywords ──
    if l1_features.get("is_ip_address") and l1_features.get("keyword_count", 0) >= 1:
        boost += 15
        logger.info("Compound boost: IP host + keywords (+15)")

    # ── Compound 6: Brand impersonation + bad infrastructure ──
    if is_brand_attack and l5_risk >= 30:
        boost += 15
        logger.info("Compound boost: brand attack + bad infrastructure (+15)")

    boosted = min(base_score + boost, 100)
    if boost > 0:
        logger.info(
            f"Risk boosted: {base_score} → {boosted} (total boost: +{boost})"
        )
    return boosted


def _determine_verdict(risk_score: int) -> str:
    """Map risk score to verdict string."""
    if risk_score >= 65:
        return "phishing"
    elif risk_score >= 40:
        return "suspicious"
    return "legitimate"


async def _run_threat_intel(domain: str) -> dict:
    """Run L5 in thread pool (blocking I/O)."""
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(
        None, l5_threat_intel.analyze_threat_intel, domain
    )


async def _run_behavioral(html: str | None, url: str) -> dict:
    """Run L6 (CPU-bound but fast)."""
    return l6_behavioral.analyze_behavior(html, url)


async def _run_visual(url: str, screenshot: str | None) -> dict:
    """Run L4 visual clone analysis."""
    return l4_visual_clone.analyze_visual_clone(url, screenshot)


async def analyze_url(
    url: str,
    html_snapshot: str | None = None,
    screenshot_b64: str | None = None,
    include_visual: bool = False,
) -> dict[str, Any]:
    """
    Run the full 7-layer detection pipeline on a URL.

    Args:
        url: URL to analyze
        html_snapshot: Optional HTML content for behavioral analysis
        screenshot_b64: Optional screenshot for visual clone detection
        include_visual: Whether to run visual analysis

    Returns:
        Complete analysis result dict matching URLCheckResponse schema
    """
    start_time = time.time()

    # Extract domain info
    parsed = urlparse(url)
    extracted = tldextract.extract(url)
    domain = parsed.hostname or extracted.registered_domain or url
    registered_domain = extracted.registered_domain or domain

    # ── Phase 1: Synchronous fast layers (L1 → L2 → L3) ──
    # L1: URL Feature Extraction
    l1_result = l1_url_features.extract_features(url)
    l1_risk = _compute_l1_risk(l1_result)

    # L2: ML Detection Engine
    feature_vector = l1_url_features.get_ml_feature_vector(l1_result)
    l2_result = l2_ml_engine.predict(feature_vector)
    l2_risk = int(l2_result["phishing_probability"] * 100)

    # L3: Brand Similarity
    l3_result = l3_brand_similarity.analyze_brand_similarity(
        domain, registered_domain
    )
    l3_risk = int(l3_result["similarity_pct"]) if (
        l3_result["attack_vector"] not in ("none", "legitimate")
    ) else 0

    # ── Phase 2: Concurrent async layers (L4, L5, L6) ──
    tasks = [
        _run_threat_intel(registered_domain),
        _run_behavioral(html_snapshot, url),
    ]
    has_visual = include_visual and screenshot_b64
    if has_visual:
        tasks.append(_run_visual(url, screenshot_b64))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    # Unpack results with error handling
    l5_result = results[0] if not isinstance(results[0], Exception) else {}
    l6_result = results[1] if not isinstance(results[1], Exception) else {}
    l4_result = {}
    if len(results) > 2:
        l4_result = results[2] if not isinstance(results[2], Exception) else {}

    if isinstance(results[0], Exception):
        logger.error(f"L5 Threat Intel failed: {results[0]}")
    if isinstance(results[1], Exception):
        logger.error(f"L6 Behavioral failed: {results[1]}")

    l5_risk = l5_result.get("infrastructure_risk", 0)
    l6_risk = l6_result.get("behavioral_risk", 0)
    l4_risk = int(l4_result.get("visual_similarity_score", 0) * 100)

    # ── Dynamic Weight Redistribution ──
    has_html = html_snapshot is not None and len(html_snapshot or "") > 0
    weights = _get_dynamic_weights(has_html=has_html, has_visual=bool(has_visual))

    # ── Risk Aggregation ──
    layer_scores = {
        "l1_heuristic": l1_risk,
        "l2_ml": l2_risk,
        "l3_brand": l3_risk,
        "l4_visual": l4_risk,
        "l5_infra": l5_risk,
        "l6_behavioral": l6_risk,
    }

    base_risk = _aggregate_risk_score(layer_scores, weights)

    # ── Compound Signal Boosting ──
    risk_score = _apply_compound_boosters(
        base_score=base_risk,
        l1_features=l1_result,
        l3_result=l3_result,
        l5_result=l5_result,
        l2_result=l2_result,
        l1_risk=l1_risk,
        l3_risk=l3_risk,
        l5_risk=l5_risk,
        l2_risk=l2_risk,
    )

    verdict = _determine_verdict(risk_score)

    # Log layer breakdown for debugging
    logger.info(
        f"Pipeline [{domain}] L1={l1_risk} L2={l2_risk} L3={l3_risk} "
        f"L4={l4_risk} L5={l5_risk} L6={l6_risk} → "
        f"base={base_risk} → boosted={risk_score} → {verdict}"
    )

    # ── Phase 3: L7 AI Investigator (synthesis) ──
    layer_results_for_l7 = {
        "l1": l1_result,
        "l2": l2_result,
        "l3": l3_result,
        "l4": l4_result,
        "l5": l5_result,
        "l6": l6_result,
    }
    l7_result = l7_ai_investigator.generate_report(
        url=url, domain=domain,
        risk_score=risk_score,
        layer_results=layer_results_for_l7,
    )

    latency_ms = int((time.time() - start_time) * 1000)

    # ── Build response ──
    return {
        "url": url,
        "domain": domain,
        "verdict": verdict,
        "risk_score": risk_score,
        "confidence": l2_result.get("confidence", 0.0),
        "phishing_probability": l2_result.get("phishing_probability", 0.0),
        "top_features": l2_result.get("top_features", []),
        "brand_similarity": {
            "detected_brand": l3_result.get("detected_brand"),
            "similarity_pct": l3_result.get("similarity_pct", 0.0),
            "attack_vector": l3_result.get("attack_vector", "none"),
        },
        "visual_clone_score": l4_result.get("visual_similarity_score", 0.0),
        "visual_matched_brand": l4_result.get("matched_brand"),
        "threat_intel": {
            "domain_age_days": l5_result.get("domain_age_days"),
            "registrar": l5_result.get("registrar"),
            "privacy_protected": l5_result.get("privacy_protected", False),
            "ssl_valid": l5_result.get("ssl_valid", False),
            "ssl_issuer": l5_result.get("ssl_issuer"),
            "hosting_country": l5_result.get("hosting_country"),
            "hosting_provider": None,
            "infrastructure_risk": l5_result.get("infrastructure_risk", 0),
        },
        "behavioral": {
            "hidden_forms": l6_result.get("hidden_forms", False),
            "redirect_chain_length": l6_result.get("redirect_chain_length", 0),
            "iframe_abuse": l6_result.get("iframe_abuse", False),
            "popup_loops": l6_result.get("popup_loops", False),
            "clipboard_hijack": l6_result.get("clipboard_hijack", False),
            "fake_login_overlay": l6_result.get("fake_login_overlay", False),
            "excessive_permissions": l6_result.get("excessive_permissions", False),
            "behavioral_risk": l6_result.get("behavioral_risk", 0),
        },
        "ai_narrative": l7_result.get("narrative", ""),
        "threat_type": l7_result.get("threat_type", ""),
        "recommended_action": l7_result.get("recommended_action", "safe"),
        "latency_ms": latency_ms,
        # Internal data for DB storage
        "_layer_results": {
            "l1": l1_result,
            "l2": l2_result,
            "l3": l3_result,
            "l4": l4_result,
            "l5": l5_result,
            "l6": l6_result,
        },
    }
