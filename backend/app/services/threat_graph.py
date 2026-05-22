"""
Threat Graph Population Service

After each URL analysis, this service creates/updates nodes and edges
in the threat graph. This powers the /threat-graph API and the frontend
graph visualization.

Node types: domain, ip, registrar, brand, asn
Edge types: resolves_to, registered_by, impersonates, hosted_by, similar_to
"""

import logging
import datetime
from typing import Any

from sqlalchemy import func
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.schemas import ThreatNode, ThreatEdge

logger = logging.getLogger(__name__)


async def _upsert_node(
    db: AsyncSession,
    node_id: str,
    node_type: str,
    label: str,
    risk_score: int = 0,
    properties: dict | None = None,
) -> None:
    """Insert/update a threat graph node using a single UPSERT statement."""
    stmt = sqlite_insert(ThreatNode).values(
        node_id=node_id,
        node_type=node_type,
        label=label,
        risk_score=risk_score,
        properties=properties or {},
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=[ThreatNode.node_id],
        set_={
            "node_type": stmt.excluded.node_type,
            "label": stmt.excluded.label,
            "last_seen": datetime.datetime.utcnow(),
            "risk_score": func.max(ThreatNode.risk_score, stmt.excluded.risk_score),
            # Keep most recent properties payload for this entity.
            "properties": stmt.excluded.properties,
        },
    )
    await db.execute(stmt)


async def _upsert_edge(
    db: AsyncSession,
    source_id: str,
    target_id: str,
    relationship: str,
    weight: float = 1.0,
    properties: dict | None = None,
) -> None:
    """Insert a threat graph edge with conflict-safe deduplication."""
    stmt = sqlite_insert(ThreatEdge).values(
        source_id=source_id,
        target_id=target_id,
        relationship=relationship,
        weight=weight,
        properties=properties or {},
    )
    stmt = stmt.on_conflict_do_nothing(
        index_elements=[
            ThreatEdge.source_id,
            ThreatEdge.target_id,
            ThreatEdge.relationship,
        ]
    )
    await db.execute(stmt)


async def populate_threat_graph(
    db: AsyncSession,
    analysis_result: dict[str, Any],
    layer_results: dict[str, Any],
) -> None:
    """
    Extract entities from a completed analysis and populate the threat graph.

    Creates nodes for: domain, IPs, registrar, impersonated brand
    Creates edges for: resolves_to, registered_by, impersonates
    """
    domain = analysis_result.get("domain", "")
    risk_score = analysis_result.get("risk_score", 0)

    if not domain:
        return

    try:
        # ── Domain node ──
        await _upsert_node(
            db,
            node_id=f"domain:{domain}",
            node_type="domain",
            label=domain,
            risk_score=risk_score,
            properties={
                "verdict": analysis_result.get("verdict", ""),
                "url": analysis_result.get("url", ""),
            },
        )

        # ── L5 Threat Intel: IP addresses, registrar ──
        l5 = layer_results.get("l5", {})
        dns_data = l5.get("dns", {})
        a_records = dns_data.get("a_records", [])

        for ip in a_records[:5]:  # Cap at 5 IPs to avoid fast-flux explosion
            ip_id = f"ip:{ip}"
            await _upsert_node(
                db,
                node_id=ip_id,
                node_type="ip",
                label=ip,
                risk_score=0,
                properties={"hosting_country": l5.get("hosting_country", "")},
            )
            await _upsert_edge(
                db,
                source_id=f"domain:{domain}",
                target_id=ip_id,
                relationship="resolves_to",
            )

        # Registrar node
        registrar = l5.get("registrar")
        if registrar:
            registrar_id = f"registrar:{registrar.lower().replace(' ', '_')}"
            await _upsert_node(
                db,
                node_id=registrar_id,
                node_type="registrar",
                label=registrar,
            )
            await _upsert_edge(
                db,
                source_id=f"domain:{domain}",
                target_id=registrar_id,
                relationship="registered_by",
            )

        # ── L3 Brand Similarity: impersonation edge ──
        l3 = layer_results.get("l3", {})
        detected_brand = l3.get("detected_brand")
        attack_vector = l3.get("attack_vector", "none")

        if detected_brand and attack_vector not in ("none", "legitimate"):
            brand_domain = l3.get("brand_domain", detected_brand.lower())
            brand_id = f"brand:{brand_domain}"
            similarity = l3.get("similarity_pct", 0)

            await _upsert_node(
                db,
                node_id=brand_id,
                node_type="brand",
                label=detected_brand,
                properties={"canonical_domain": brand_domain},
            )
            await _upsert_edge(
                db,
                source_id=f"domain:{domain}",
                target_id=brand_id,
                relationship="impersonates",
                weight=similarity / 100.0,
                properties={"attack_vector": attack_vector},
            )

        await db.flush()
        logger.debug(f"Threat graph populated for {domain}")

    except Exception as e:
        logger.error(f"Failed to populate threat graph for {domain}: {e}")
