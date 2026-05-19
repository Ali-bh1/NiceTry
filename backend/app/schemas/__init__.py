"""
Pydantic request/response schemas for all API endpoints.
"""

from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime


# ─── Check URL ──────────────────────────────────────────────────────────────

class URLCheckRequest(BaseModel):
    """POST /check-url request body."""
    url: str = Field(..., min_length=5, max_length=2048, description="URL to analyze")
    include_visual: bool = Field(False, description="Include visual clone analysis (slower)")
    html_snapshot: str | None = Field(None, description="Optional HTML content for behavioral analysis")


class ScreenshotAnalysisRequest(BaseModel):
    """POST /analyze-screenshot request body."""
    url: str = Field(..., min_length=5, max_length=2048, description="URL of the page")
    screenshot_b64: str = Field(..., min_length=1, description="Base64-encoded screenshot image")


class FeatureImportance(BaseModel):
    """Single feature importance entry (SHAP or model-based)."""
    feature: str
    value: float
    impact: str  # "increases_risk", "decreases_risk", or "contributes_to_prediction"


class BrandSimilarityResult(BaseModel):
    """Layer 3 brand similarity result."""
    detected_brand: str | None = None
    similarity_pct: float = 0.0
    attack_vector: str = "none"  # typosquatting, homograph, keyword_embedding


class ThreatIntelResult(BaseModel):
    """Layer 5 threat intelligence summary."""
    domain_age_days: int | None = None
    registrar: str | None = None
    privacy_protected: bool = False
    ssl_valid: bool = False
    ssl_issuer: str | None = None
    hosting_country: str | None = None
    hosting_provider: str | None = None
    infrastructure_risk: int = 0  # 0-100


class BehavioralFlags(BaseModel):
    """Layer 6 behavioral analysis flags."""
    hidden_forms: bool = False
    redirect_chain_length: int = 0
    iframe_abuse: bool = False
    popup_loops: bool = False
    clipboard_hijack: bool = False
    fake_login_overlay: bool = False
    excessive_permissions: bool = False
    behavioral_risk: int = 0  # 0-100


class URLCheckResponse(BaseModel):
    """POST /check-url response body — the full threat report."""
    url: str
    domain: str
    verdict: str  # "legitimate", "phishing", "suspicious"
    risk_score: int = Field(..., ge=0, le=100)
    confidence: float = Field(..., ge=0.0, le=1.0)

    # ML details
    phishing_probability: float = 0.0
    top_features: list[FeatureImportance] = []

    # Brand analysis
    brand_similarity: BrandSimilarityResult = BrandSimilarityResult()

    # Visual clone
    visual_clone_score: float = 0.0
    visual_matched_brand: str | None = None

    # Threat intelligence
    threat_intel: ThreatIntelResult = ThreatIntelResult()

    # Behavioral
    behavioral: BehavioralFlags = BehavioralFlags()

    # AI Narrative
    ai_narrative: str = ""
    threat_type: str = ""  # credential_harvesting, brand_impersonation, technical_exploit, scam

    # Recommendation
    recommended_action: str = "safe"  # safe, caution, exit

    # Meta
    latency_ms: int = 0
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)


# ─── Report Domain ──────────────────────────────────────────────────────────

class ReportDomainRequest(BaseModel):
    """POST /report-domain request body."""
    url: str = Field(..., min_length=5, max_length=2048)
    category: str = Field(..., pattern="^(credential_harvesting|scam|malware|false_positive|other)$")
    reporter_id: str = Field(..., min_length=1, max_length=100)
    notes: str | None = None


class ReportDomainResponse(BaseModel):
    """POST /report-domain response body."""
    report_id: int
    trust_score: float
    status: str
    message: str


# ─── Dashboard ───────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    """GET /dashboard response body."""
    total_scans_24h: int = 0
    total_scans_7d: int = 0
    total_scans_30d: int = 0
    phishing_detected_24h: int = 0
    avg_risk_score: float = 0.0
    avg_latency_ms: float = 0.0

    # Model metrics
    model_accuracy: float = 0.972
    model_precision: float = 0.965
    model_recall: float = 0.958
    model_f1: float = 0.961

    # Top brands
    top_targeted_brands: list[dict] = []

    # Recent high-risk
    recent_incidents: list[dict] = []

    # Community
    pending_reports: int = 0


# ─── Threat Graph ────────────────────────────────────────────────────────────

class GraphNode(BaseModel):
    """A node in the threat graph."""
    id: str
    type: str  # domain, ip, asn, registrar, brand
    label: str
    risk_score: int = 0
    properties: dict = {}


class GraphEdge(BaseModel):
    """An edge in the threat graph."""
    source: str
    target: str
    relationship: str
    weight: float = 1.0


class ThreatGraphResponse(BaseModel):
    """GET /threat-graph response body."""
    nodes: list[GraphNode] = []
    edges: list[GraphEdge] = []
    total_nodes: int = 0
    total_edges: int = 0


# ─── Health ──────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    """GET /health response body."""
    status: str = "healthy"
    version: str = "2.0.0"
    model_loaded: bool = False
    model_version: str = "xgboost-v1"
    uptime_seconds: float = 0.0
    total_analyses: int = 0
