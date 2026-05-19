"""
SQLAlchemy ORM models for URL analysis results, community reports, and threat graph nodes.
"""

import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, Text, JSON, Boolean
from app.models.database import Base


class URLAnalysis(Base):
    """Stores the results of each URL phishing analysis."""
    __tablename__ = "url_analyses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    url = Column(String(2048), nullable=False, index=True)
    domain = Column(String(255), nullable=False, index=True)

    # Verdict
    verdict = Column(String(20), nullable=False)  # "legitimate", "phishing", "suspicious"
    risk_score = Column(Integer, nullable=False)   # 0-100
    confidence = Column(Float, nullable=False)     # 0.0-1.0

    # Layer results (JSON blobs for flexibility)
    l1_url_features = Column(JSON, default=dict)
    l2_ml_result = Column(JSON, default=dict)
    l3_brand_similarity = Column(JSON, default=dict)
    l4_visual_clone = Column(JSON, default=dict)
    l5_threat_intel = Column(JSON, default=dict)
    l6_behavioral = Column(JSON, default=dict)
    l7_ai_narrative = Column(Text, default="")

    # Metadata
    feature_importance = Column(JSON, default=list)  # SHAP top features
    threat_type = Column(String(50), default="")     # credential_harvesting, brand_impersonation, etc.
    recommended_action = Column(String(20), default="safe")  # safe, caution, exit

    # Timestamps
    analyzed_at = Column(DateTime, default=datetime.datetime.utcnow)
    latency_ms = Column(Integer, default=0)


class CommunityReport(Base):
    """Community-submitted phishing reports with trust scoring."""
    __tablename__ = "community_reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    url = Column(String(2048), nullable=False, index=True)
    domain = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)   # credential_harvesting, scam, malware, other
    reporter_id = Column(String(100), nullable=False)

    # Trust scoring
    trust_score = Column(Float, default=0.0)
    ml_confidence = Column(Float, default=0.0)
    reporter_accuracy = Column(Float, default=0.5)
    corroborating_count = Column(Integer, default=0)

    # Status
    status = Column(String(20), default="pending")  # pending, approved, rejected
    reviewed_by = Column(String(100), nullable=True)

    # Timestamps
    reported_at = Column(DateTime, default=datetime.datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)


class ThreatNode(Base):
    """Nodes in the threat relationship graph."""
    __tablename__ = "threat_nodes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    node_id = Column(String(255), unique=True, nullable=False, index=True)
    node_type = Column(String(50), nullable=False)   # domain, ip, asn, registrar, brand
    label = Column(String(255), nullable=False)
    properties = Column(JSON, default=dict)          # Flexible metadata
    risk_score = Column(Integer, default=0)
    first_seen = Column(DateTime, default=datetime.datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)


class ThreatEdge(Base):
    """Edges connecting threat graph nodes."""
    __tablename__ = "threat_edges"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source_id = Column(String(255), nullable=False, index=True)
    target_id = Column(String(255), nullable=False, index=True)
    relationship = Column(String(50), nullable=False)  # resolves_to, hosted_by, similar_to, impersonates
    weight = Column(Float, default=1.0)
    properties = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
