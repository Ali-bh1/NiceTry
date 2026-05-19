"""
API Routes — FastAPI endpoint definitions.

Implements all 6 API endpoints from the PRD:
  POST /check-url          — Full 7-layer analysis
  POST /analyze-screenshot — Visual clone analysis
  POST /report-domain      — Community report submission
  GET  /dashboard          — Aggregated stats
  GET  /threat-graph       — Subgraph query
  GET  /health             — Service health
"""

import datetime
import logging
import time

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.database import get_db
from app.models.schemas import URLAnalysis, CommunityReport, ThreatNode, ThreatEdge
from app.schemas import (
    URLCheckRequest, URLCheckResponse,
    ScreenshotAnalysisRequest,
    ReportDomainRequest, ReportDomainResponse,
    DashboardStats, ThreatGraphResponse, GraphNode, GraphEdge,
    HealthResponse,
)
from app.services import pipeline
from app.services.detection import l2_ml_engine
from app.services.threat_graph import populate_threat_graph
from app.utils.sanitizer import sanitize_url, URLValidationError

logger = logging.getLogger(__name__)
router = APIRouter()

_start_time = time.time()


# ─── POST /check-url ────────────────────────────────────────────────────────

@router.post("/check-url", response_model=URLCheckResponse)
async def check_url(
    request: URLCheckRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Analyze a URL through the 7-layer detection pipeline.

    Returns verdict, risk score, feature explanations,
    brand analysis, threat intel, behavioral flags,
    and an AI-generated threat narrative.
    """
    # Sanitize and validate the URL
    try:
        clean_url = sanitize_url(request.url)
    except URLValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))

    result = await pipeline.analyze_url(
        url=clean_url,
        html_snapshot=request.html_snapshot,
        include_visual=request.include_visual,
    )

    # Persist analysis and populate threat graph
    layer_data = result.pop("_layer_results", {})
    try:
        analysis = URLAnalysis(
            url=result["url"],
            domain=result["domain"],
            verdict=result["verdict"],
            risk_score=result["risk_score"],
            confidence=result["confidence"],
            l1_url_features=layer_data.get("l1", {}),
            l2_ml_result=layer_data.get("l2", {}),
            l3_brand_similarity=layer_data.get("l3", {}),
            l4_visual_clone=layer_data.get("l4", {}),
            l5_threat_intel=layer_data.get("l5", {}),
            l6_behavioral=layer_data.get("l6", {}),
            l7_ai_narrative=result.get("ai_narrative", ""),
            feature_importance=result.get("top_features", []),
            threat_type=result.get("threat_type", ""),
            recommended_action=result.get("recommended_action", "safe"),
            latency_ms=result.get("latency_ms", 0),
        )
        db.add(analysis)
        await db.flush()

        # Populate threat graph with entities from this analysis
        await populate_threat_graph(db, result, layer_data)

    except Exception as e:
        logger.error(f"Failed to persist analysis: {e}")

    return URLCheckResponse(**result)


# ─── POST /analyze-screenshot ───────────────────────────────────────────────

@router.post("/analyze-screenshot")
async def analyze_screenshot(request: ScreenshotAnalysisRequest):
    """
    Analyze a screenshot for visual clone detection.

    Accepts a URL and a base64-encoded screenshot image.
    Currently returns stub results (CLIP/pHash not installed).
    """
    try:
        clean_url = sanitize_url(request.url)
    except URLValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))

    from app.services.detection import l4_visual_clone
    result = l4_visual_clone.analyze_visual_clone(clean_url, request.screenshot_b64)
    return result


# ─── POST /report-domain ────────────────────────────────────────────────────

@router.post("/report-domain", response_model=ReportDomainResponse)
async def report_domain(
    request: ReportDomainRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a community phishing report.

    Trust score is computed from ML confidence + reporter history.
    """
    try:
        clean_url = sanitize_url(request.url)
    except URLValidationError as e:
        raise HTTPException(status_code=422, detail=str(e))

    from urllib.parse import urlparse
    parsed = urlparse(clean_url)
    domain = parsed.hostname or clean_url

    # Compute initial trust score
    # Formula: (ML confidence × 0.4) + (reporter accuracy × 0.4) + (corroborating reports × 0.1)
    ml_confidence = 0.5  # Default — will be enriched async
    reporter_accuracy = 0.5  # Default for new reporters
    trust_score = (ml_confidence * 0.4) + (reporter_accuracy * 0.4) + (0.1 * 1)

    report = CommunityReport(
        url=clean_url,
        domain=domain,
        category=request.category,
        reporter_id=request.reporter_id,
        trust_score=round(trust_score, 3),
        ml_confidence=ml_confidence,
        reporter_accuracy=reporter_accuracy,
        status="pending",
    )
    db.add(report)
    await db.flush()

    return ReportDomainResponse(
        report_id=report.id,
        trust_score=report.trust_score,
        status="pending",
        message="Report submitted. It will be reviewed by our analysts.",
    )


# ─── GET /dashboard ─────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=DashboardStats)
async def dashboard(db: AsyncSession = Depends(get_db)):
    """
    Get aggregated dashboard statistics.
    """
    now = datetime.datetime.utcnow()
    day_ago = now - datetime.timedelta(days=1)
    week_ago = now - datetime.timedelta(days=7)
    month_ago = now - datetime.timedelta(days=30)

    # Total scans
    q24 = await db.execute(
        select(func.count()).where(URLAnalysis.analyzed_at >= day_ago)
    )
    q7d = await db.execute(
        select(func.count()).where(URLAnalysis.analyzed_at >= week_ago)
    )
    q30d = await db.execute(
        select(func.count()).where(URLAnalysis.analyzed_at >= month_ago)
    )

    # Phishing detected 24h
    qp = await db.execute(
        select(func.count()).where(
            URLAnalysis.analyzed_at >= day_ago,
            URLAnalysis.verdict == "phishing",
        )
    )

    # Avg risk score
    qavg = await db.execute(
        select(func.avg(URLAnalysis.risk_score)).where(
            URLAnalysis.analyzed_at >= week_ago
        )
    )

    # Avg latency
    qlat = await db.execute(
        select(func.avg(URLAnalysis.latency_ms)).where(
            URLAnalysis.analyzed_at >= week_ago
        )
    )

    # Recent incidents
    recent = await db.execute(
        select(URLAnalysis)
        .where(URLAnalysis.verdict.in_(["phishing", "suspicious"]))
        .order_by(URLAnalysis.analyzed_at.desc())
        .limit(10)
    )
    incidents = [
        {
            "url": r.url, "domain": r.domain,
            "risk_score": r.risk_score, "verdict": r.verdict,
            "threat_type": r.threat_type,
            "analyzed_at": r.analyzed_at.isoformat() if r.analyzed_at else "",
        }
        for r in recent.scalars().all()
    ]

    # Pending reports
    qpr = await db.execute(
        select(func.count()).where(CommunityReport.status == "pending")
    )

    return DashboardStats(
        total_scans_24h=q24.scalar() or 0,
        total_scans_7d=q7d.scalar() or 0,
        total_scans_30d=q30d.scalar() or 0,
        phishing_detected_24h=qp.scalar() or 0,
        avg_risk_score=round(qavg.scalar() or 0, 1),
        avg_latency_ms=round(qlat.scalar() or 0, 1),
        recent_incidents=incidents,
        pending_reports=qpr.scalar() or 0,
    )


# ─── GET /threat-graph ──────────────────────────────────────────────────────

@router.get("/threat-graph", response_model=ThreatGraphResponse)
async def threat_graph(
    domain: str = Query(None, description="Filter by domain"),
    depth: int = Query(2, ge=1, le=5, description="Traversal depth"),
    db: AsyncSession = Depends(get_db),
):
    """
    Query the threat relationship graph.
    """
    nodes_q = select(ThreatNode).limit(100)
    edges_q = select(ThreatEdge).limit(200)

    if domain:
        nodes_q = nodes_q.where(ThreatNode.label.contains(domain))

    nodes_result = await db.execute(nodes_q)
    edges_result = await db.execute(edges_q)

    nodes = [
        GraphNode(
            id=n.node_id, type=n.node_type,
            label=n.label, risk_score=n.risk_score,
            properties=n.properties or {},
        )
        for n in nodes_result.scalars().all()
    ]

    edges = [
        GraphEdge(
            source=e.source_id, target=e.target_id,
            relationship=e.relationship, weight=e.weight,
        )
        for e in edges_result.scalars().all()
    ]

    return ThreatGraphResponse(
        nodes=nodes, edges=edges,
        total_nodes=len(nodes), total_edges=len(edges),
    )


# ─── GET /health ─────────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse)
async def health(db: AsyncSession = Depends(get_db)):
    """Service health check."""
    total = await db.execute(select(func.count()).select_from(URLAnalysis))

    return HealthResponse(
        status="healthy",
        version=settings.APP_VERSION,
        model_loaded=l2_ml_engine.is_model_loaded(),
        model_version="xgboost-v1",
        uptime_seconds=round(time.time() - _start_time, 1),
        total_analyses=total.scalar() or 0,
    )
