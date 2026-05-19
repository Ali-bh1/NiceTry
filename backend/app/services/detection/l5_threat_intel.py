"""
Layer 5 — Threat Intelligence

Infrastructure-level analysis: WHOIS registration, DNS records,
SSL certificate validation, and ASN/geolocation lookups.

All external lookups use timeouts and graceful fallbacks so the
pipeline never blocks on unreachable third-party services.
"""

import logging
import socket
import ssl
import datetime
from typing import Any

logger = logging.getLogger(__name__)

# Registrars known for lax abuse policies
SUSPICIOUS_REGISTRARS = {
    "namecheap", "namesilo", "porkbun", "dynadot",
    "freenom", "hostinger", "tucows", "enom",
}

# Hosting providers with high phishing abuse rates
HIGH_ABUSE_PROVIDERS = {
    "cloudflare", "amazon", "digitalocean", "ovh",
    "hetzner", "contabo", "hostinger", "bluehost",
}

# Countries disproportionately hosting phishing infrastructure
HIGH_RISK_COUNTRIES = {
    "RU", "CN", "NG", "BR", "IN", "VN", "ID", "PK", "UA", "RO",
}


def _whois_lookup(domain: str) -> dict[str, Any]:
    """
    Perform WHOIS lookup with timeout and structured output.

    Returns domain age, registrar, privacy flags, and expiry date.
    """
    result = {
        "domain_age_days": None,
        "registrar": None,
        "privacy_protected": False,
        "creation_date": None,
        "expiry_date": None,
        "registrant_country": None,
        "raw_available": False,
    }

    try:
        import whois
        w = whois.whois(domain)

        if w is None or w.domain_name is None:
            return result

        result["raw_available"] = True

        # Creation date → domain age
        creation = w.creation_date
        if isinstance(creation, list):
            creation = creation[0]
        if isinstance(creation, datetime.datetime):
            age = (datetime.datetime.utcnow() - creation).days
            result["domain_age_days"] = age
            result["creation_date"] = creation.isoformat()

        # Expiry date
        expiry = w.expiration_date
        if isinstance(expiry, list):
            expiry = expiry[0]
        if isinstance(expiry, datetime.datetime):
            result["expiry_date"] = expiry.isoformat()

        # Registrar
        registrar = w.registrar
        if registrar:
            result["registrar"] = str(registrar)

        # Privacy detection
        org = str(w.org or "").lower()
        name = str(w.name or "").lower()
        privacy_indicators = [
            "privacy", "protect", "proxy", "redacted",
            "whoisguard", "domains by proxy", "contactprivacy",
            "withheld", "data protected",
        ]
        result["privacy_protected"] = any(
            indicator in org or indicator in name
            for indicator in privacy_indicators
        )

        # Registrant country
        if hasattr(w, "country") and w.country:
            result["registrant_country"] = str(w.country).upper()

    except Exception as e:
        logger.warning(f"WHOIS lookup failed for {domain}: {e}")

    return result


def _dns_analysis(domain: str) -> dict[str, Any]:
    """
    Analyze DNS records for anomalies.

    Checks A, MX, NS, TXT records for suspicious patterns
    like fast-flux hosting or missing mail infrastructure.
    """
    result = {
        "has_a_record": False,
        "a_records": [],
        "has_mx_record": False,
        "mx_count": 0,
        "has_ns_record": False,
        "ns_count": 0,
        "has_txt_record": False,
        "has_spf": False,
        "has_dmarc": False,
        "multiple_ips": False,
        "dns_anomaly_flags": [],
    }

    try:
        import dns.resolver

        resolver = dns.resolver.Resolver()
        resolver.timeout = 5
        resolver.lifetime = 5

        # A records
        try:
            a_records = resolver.resolve(domain, "A")
            ips = [str(r) for r in a_records]
            result["has_a_record"] = True
            result["a_records"] = ips
            result["multiple_ips"] = len(ips) > 3  # Fast-flux indicator
            if result["multiple_ips"]:
                result["dns_anomaly_flags"].append("fast_flux_suspected")
        except Exception:
            result["dns_anomaly_flags"].append("no_a_record")

        # MX records
        try:
            mx_records = resolver.resolve(domain, "MX")
            result["has_mx_record"] = True
            result["mx_count"] = len(list(mx_records))
        except Exception:
            result["dns_anomaly_flags"].append("no_mx_record")

        # NS records
        try:
            ns_records = resolver.resolve(domain, "NS")
            result["has_ns_record"] = True
            result["ns_count"] = len(list(ns_records))
        except Exception:
            pass

        # TXT records (SPF / DMARC)
        try:
            txt_records = resolver.resolve(domain, "TXT")
            result["has_txt_record"] = True
            for record in txt_records:
                txt_str = str(record).lower()
                if "v=spf1" in txt_str:
                    result["has_spf"] = True
                if "v=dmarc1" in txt_str:
                    result["has_dmarc"] = True
        except Exception:
            pass

        # Flag domains without standard email infrastructure
        if not result["has_mx_record"] and not result["has_spf"]:
            result["dns_anomaly_flags"].append("no_email_infrastructure")

    except Exception as e:
        logger.warning(f"DNS analysis failed for {domain}: {e}")

    return result


def _ssl_check(domain: str) -> dict[str, Any]:
    """
    Validate SSL/TLS certificate for the domain.

    Checks issuer trust, validity period, SAN coverage, and self-signed status.
    """
    result = {
        "ssl_valid": False,
        "ssl_issuer": None,
        "ssl_subject": None,
        "ssl_expiry": None,
        "ssl_days_remaining": None,
        "is_self_signed": False,
        "san_mismatch": False,
        "ssl_flags": [],
    }

    try:
        context = ssl.create_default_context()
        with socket.create_connection((domain, 443), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as ssock:
                cert = ssock.getpeercert()

                if not cert:
                    result["ssl_flags"].append("no_certificate")
                    return result

                result["ssl_valid"] = True

                # Issuer
                issuer_parts = dict(x[0] for x in cert.get("issuer", []))
                issuer_org = issuer_parts.get("organizationName", "Unknown")
                result["ssl_issuer"] = issuer_org

                # Subject
                subject_parts = dict(x[0] for x in cert.get("subject", []))
                result["ssl_subject"] = subject_parts.get("commonName", "")

                # Self-signed detection
                if issuer_org == subject_parts.get("organizationName", ""):
                    result["is_self_signed"] = True
                    result["ssl_flags"].append("self_signed")

                # Expiry
                not_after = cert.get("notAfter", "")
                if not_after:
                    expiry = datetime.datetime.strptime(
                        not_after, "%b %d %H:%M:%S %Y %Z"
                    )
                    result["ssl_expiry"] = expiry.isoformat()
                    remaining = (expiry - datetime.datetime.utcnow()).days
                    result["ssl_days_remaining"] = remaining
                    if remaining < 7:
                        result["ssl_flags"].append("expiring_soon")
                    if remaining < 0:
                        result["ssl_flags"].append("expired")

                # SAN check
                sans = cert.get("subjectAltName", [])
                san_domains = [v for t, v in sans if t == "DNS"]
                if domain not in san_domains and f"*.{domain}" not in san_domains:
                    # Check wildcard match
                    parts = domain.split(".")
                    if len(parts) > 2:
                        wildcard = "*." + ".".join(parts[1:])
                        if wildcard not in san_domains:
                            result["san_mismatch"] = True
                            result["ssl_flags"].append("san_mismatch")

                # Free certificate issuers (not inherently bad, but common in phishing)
                free_issuers = {"let's encrypt", "zerossl", "buypass", "ssl.com"}
                if issuer_org.lower() in free_issuers:
                    result["ssl_flags"].append("free_certificate")

    except ssl.SSLCertVerificationError:
        result["ssl_flags"].append("verification_failed")
    except socket.timeout:
        result["ssl_flags"].append("connection_timeout")
    except ConnectionRefusedError:
        result["ssl_flags"].append("connection_refused")
    except Exception as e:
        logger.warning(f"SSL check failed for {domain}: {e}")
        result["ssl_flags"].append("check_failed")

    return result


def _compute_infrastructure_risk(
    whois_data: dict, dns_data: dict, ssl_data: dict
) -> int:
    """
    Compute a 0-100 infrastructure risk score from all intel signals.

    Higher score = more suspicious infrastructure.
    Domains with missing infrastructure (no WHOIS, no DNS, no SSL)
    are treated as HIGH risk — legitimate sites always have these.
    """
    score = 0

    # Domain age — strongest single indicator
    age = whois_data.get("domain_age_days")
    if age is not None:
        if age < 7:
            score += 35
        elif age < 30:
            score += 25
        elif age < 90:
            score += 15
        elif age < 365:
            score += 5

    # No WHOIS data at all — strong signal (legitimate domains always have WHOIS)
    if not whois_data.get("raw_available"):
        score += 20

    # Privacy-protected registration
    if whois_data.get("privacy_protected"):
        score += 8

    # Suspicious registrar
    registrar = (whois_data.get("registrar") or "").lower()
    if any(sus in registrar for sus in SUSPICIOUS_REGISTRARS):
        score += 7

    # High-risk registrant country
    country = whois_data.get("registrant_country", "")
    if country in HIGH_RISK_COUNTRIES:
        score += 8

    # DNS anomalies
    anomalies = dns_data.get("dns_anomaly_flags", [])
    if "fast_flux_suspected" in anomalies:
        score += 12
    if "no_a_record" in anomalies:
        score += 15  # No DNS resolution = likely dead/disposable domain
    if "no_email_infrastructure" in anomalies:
        score += 5

    # SSL issues
    ssl_flags = ssl_data.get("ssl_flags", [])
    if "self_signed" in ssl_flags:
        score += 15
    if "verification_failed" in ssl_flags:
        score += 12
    if "expired" in ssl_flags:
        score += 10
    if "san_mismatch" in ssl_flags:
        score += 8
    if "connection_refused" in ssl_flags:
        score += 8
    if "connection_timeout" in ssl_flags:
        score += 8
    if not ssl_data.get("ssl_valid"):
        score += 10

    # Compound: completely unresolvable domain (no WHOIS + no DNS + no SSL)
    no_whois = not whois_data.get("raw_available")
    no_dns = not dns_data.get("has_a_record")
    no_ssl = not ssl_data.get("ssl_valid")
    if no_whois and no_dns and no_ssl:
        score += 15  # Ghost domain bonus

    return min(score, 100)


def analyze_threat_intel(domain: str) -> dict[str, Any]:
    """
    Run full threat intelligence analysis on a domain.

    Performs WHOIS, DNS, and SSL lookups, then computes an
    aggregate infrastructure risk score.

    Returns:
        {
            "domain_age_days": int | None,
            "registrar": str | None,
            "privacy_protected": bool,
            "ssl_valid": bool,
            "ssl_issuer": str | None,
            "hosting_country": str | None,
            "infrastructure_risk": int (0-100),
            "whois": {...},
            "dns": {...},
            "ssl": {...},
        }
    """
    whois_data = _whois_lookup(domain)
    dns_data = _dns_analysis(domain)
    ssl_data = _ssl_check(domain)

    infra_risk = _compute_infrastructure_risk(whois_data, dns_data, ssl_data)

    return {
        "domain_age_days": whois_data["domain_age_days"],
        "registrar": whois_data["registrar"],
        "privacy_protected": whois_data["privacy_protected"],
        "ssl_valid": ssl_data["ssl_valid"],
        "ssl_issuer": ssl_data["ssl_issuer"],
        "hosting_country": whois_data.get("registrant_country"),
        "infrastructure_risk": infra_risk,
        "whois": whois_data,
        "dns": dns_data,
        "ssl": ssl_data,
    }
