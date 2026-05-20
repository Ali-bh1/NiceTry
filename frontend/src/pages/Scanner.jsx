import { useState } from 'react';
import {
  Search, Shield, AlertTriangle, Loader2, ExternalLink,
  ChevronDown, ChevronUp, Globe, Lock, Server, Clock,
  Eye, ArrowRightLeft, Layers, MousePointer, Clipboard,
  Fingerprint, Brain, Target,
} from 'lucide-react';
import { api } from '../services/api.js';

/* ── Risk Score Ring ─────────────────────────────────────────────────────── */

function RiskRing({ score }) {
  const size = 120;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? 'var(--color-risk-danger)' : score >= 50 ? 'var(--color-risk-caution)' : 'var(--color-risk-safe)';

  return (
    <div className="risk-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-border)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>/ 100</span>
      </div>
    </div>
  );
}

/* ── Evidence Item ───────────────────────────────────────────────────────── */

function EvidenceItem({ item }) {
  return (
    <div className="flex items-start gap-3 py-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
      <div className="w-1 h-8 rounded-full mt-0.5 shrink-0" style={{
        background: item.confidence >= 0.8 ? 'var(--color-risk-danger)' :
          item.confidence >= 0.5 ? 'var(--color-risk-caution)' : 'var(--color-text-muted)',
      }} />
      <div className="flex-1 min-w-0">
        <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{item.description}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Confidence: {(item.confidence * 100).toFixed(0)}% · Source: {item.source}
        </p>
      </div>
    </div>
  );
}

/* ── Collapsible Section Wrapper ─────────────────────────────────────────── */

function Section({ icon: Icon, title, subtitle, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="glass-card p-5">
      <button className="flex items-center gap-2 w-full text-left" onClick={() => setOpen(!open)}>
        <Icon size={16} style={{ color: 'var(--color-accent)' }} />
        <h3 className="text-sm font-semibold flex-1" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
        {subtitle && <span className="text-xs mr-2" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</span>}
        {open ? <ChevronUp size={16} style={{ color: 'var(--color-text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--color-text-muted)' }} />}
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}

/* ── Stat Row ────────────────────────────────────────────────────────────── */

function StatRow({ icon: Icon, label, value, valueColor }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="flex items-center gap-2">
        <Icon size={14} style={{ color: 'var(--color-text-muted)' }} />
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
      </div>
      <span className="text-xs font-mono font-semibold" style={{ color: valueColor || 'var(--color-text-secondary)' }}>{value}</span>
    </div>
  );
}

/* ── Boolean Flag Pill ───────────────────────────────────────────────────── */

function FlagPill({ icon: Icon, label, active }) {
  const bg = active ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.1)';
  const color = active ? 'var(--color-risk-danger)' : 'var(--color-risk-safe)';
  const text = active ? 'Detected' : 'Clean';

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: bg }}>
      <div className="flex items-center gap-2">
        <Icon size={14} style={{ color }} />
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      </div>
      <span className="text-xs font-semibold" style={{ color }}>{text}</span>
    </div>
  );
}

/* ── Main Scanner Component ──────────────────────────────────────────────── */

export default function Scanner() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleScan(e) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await api.checkUrl(url.trim());
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const verdictConfig = {
    phishing: { color: 'var(--color-risk-danger)', bg: 'rgba(239,68,68,0.1)', icon: AlertTriangle, label: '⚠ PHISHING DETECTED' },
    suspicious: { color: 'var(--color-risk-caution)', bg: 'rgba(245,158,11,0.1)', icon: AlertTriangle, label: '⚡ SUSPICIOUS' },
    legitimate: { color: 'var(--color-risk-safe)', bg: 'rgba(16,185,129,0.1)', icon: Shield, label: '✓ LEGITIMATE' },
  };

  const ti = result?.threat_intel || {};
  const bh = result?.behavioral || {};
  const br = result?.brand_similarity || {};

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Search Bar ── */}
      <div className="glass-card p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>URL Threat Scanner</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Analyze any URL through our 7-layer AI detection pipeline
          </p>
        </div>
        <form onSubmit={handleScan} className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL to analyze (e.g., https://example.com)"
              className="input-dark pl-10"
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn-primary flex items-center gap-2 whitespace-nowrap" disabled={loading || !url.trim()}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
            {loading ? 'Analyzing...' : 'Scan URL'}
          </button>
        </form>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="glass-card p-4 flex items-center gap-3" style={{ borderColor: 'var(--color-risk-danger)' }}>
          <AlertTriangle size={18} style={{ color: 'var(--color-risk-danger)' }} />
          <p className="text-sm" style={{ color: 'var(--color-risk-danger)' }}>{error}</p>
        </div>
      )}

      {/* ── Scanning Animation ── */}
      {loading && (
        <div className="glass-card p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'var(--color-accent-glow)' }} />
              <div className="absolute inset-0 flex items-center justify-center rounded-full" style={{ background: 'var(--color-bg-card)' }}>
                <Shield size={24} style={{ color: 'var(--color-accent)' }} className="animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Running 7-Layer Analysis</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>URL Features → ML Engine → Brand Check → Visual → Threat Intel → Behavioral → AI Report</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {result && (
        <div className="space-y-4">
          {/* Verdict Header */}
          {(() => {
            const v = verdictConfig[result.verdict] || verdictConfig.legitimate;
            const VIcon = v.icon;
            return (
              <div className="glass-card p-6" style={{ borderColor: v.color, background: v.bg }}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <RiskRing score={result.risk_score} />
                    <div>
                      <div className="flex items-center gap-2">
                        <VIcon size={20} style={{ color: v.color }} />
                        <h3 className="text-lg font-bold" style={{ color: v.color }}>{v.label}</h3>
                      </div>
                      <p className="text-sm mt-1 font-mono" style={{ color: 'var(--color-text-secondary)' }}>{result.url}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs flex-wrap" style={{ color: 'var(--color-text-muted)' }}>
                        <span>Domain: <strong style={{ color: 'var(--color-text-secondary)' }}>{result.domain}</strong></span>
                        <span>Confidence: <strong style={{ color: 'var(--color-text-secondary)' }}>{(result.confidence * 100).toFixed(1)}%</strong></span>
                        <span>ML Probability: <strong style={{ color: 'var(--color-text-secondary)' }}>{(result.phishing_probability * 100).toFixed(1)}%</strong></span>
                        <span>Threat: <strong style={{ color: 'var(--color-text-secondary)' }}>{result.threat_type || 'N/A'}</strong></span>
                        <span>Latency: <strong style={{ color: 'var(--color-text-secondary)' }}>{result.latency_ms}ms</strong></span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase"
                      style={{
                        background: result.recommended_action === 'exit' ? 'rgba(239,68,68,0.2)' :
                          result.recommended_action === 'caution' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)',
                        color: result.recommended_action === 'exit' ? 'var(--color-risk-danger)' :
                          result.recommended_action === 'caution' ? 'var(--color-risk-caution)' : 'var(--color-risk-safe)',
                      }}
                    >
                      Action: {result.recommended_action}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ── L5 Threat Intelligence ── */}
          <Section icon={Globe} title="Threat Intelligence (L5)" subtitle={`Infrastructure Risk: ${ti.infrastructure_risk ?? 0}/100`} defaultOpen>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <StatRow icon={Clock} label="Domain Age" value={ti.domain_age_days != null ? `${ti.domain_age_days} days` : 'Unknown'} valueColor={ti.domain_age_days != null && ti.domain_age_days < 30 ? 'var(--color-risk-danger)' : undefined} />
              <StatRow icon={Fingerprint} label="Registrar" value={ti.registrar || 'Unknown'} />
              <StatRow icon={Lock} label="SSL Valid" value={ti.ssl_valid ? '✓ Valid' : '✗ Invalid'} valueColor={ti.ssl_valid ? 'var(--color-risk-safe)' : 'var(--color-risk-danger)'} />
              <StatRow icon={Lock} label="SSL Issuer" value={ti.ssl_issuer || 'N/A'} />
              <StatRow icon={Server} label="Hosting Provider" value={ti.hosting_provider || 'Unknown'} />
              <StatRow icon={Globe} label="Hosting Country" value={ti.hosting_country || 'Unknown'} />
              <StatRow icon={Eye} label="WHOIS Privacy" value={ti.privacy_protected ? 'Protected' : 'Public'} valueColor={ti.privacy_protected ? 'var(--color-risk-caution)' : undefined} />
              <StatRow icon={Target} label="Infra Risk Score" value={`${ti.infrastructure_risk ?? 0} / 100`} valueColor={ti.infrastructure_risk >= 60 ? 'var(--color-risk-danger)' : ti.infrastructure_risk >= 30 ? 'var(--color-risk-caution)' : 'var(--color-risk-safe)'} />
            </div>
          </Section>

          {/* ── L6 Behavioral Analysis ── */}
          <Section icon={Brain} title="Behavioral Analysis (L6)" subtitle={`Behavioral Risk: ${bh.behavioral_risk ?? 0}/100`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <FlagPill icon={Eye} label="Hidden Forms" active={bh.hidden_forms} />
              <FlagPill icon={Layers} label="iFrame Abuse" active={bh.iframe_abuse} />
              <FlagPill icon={MousePointer} label="Popup Loops" active={bh.popup_loops} />
              <FlagPill icon={Clipboard} label="Clipboard Hijack" active={bh.clipboard_hijack} />
              <FlagPill icon={Lock} label="Fake Login Overlay" active={bh.fake_login_overlay} />
              <FlagPill icon={Shield} label="Excessive Permissions" active={bh.excessive_permissions} />
              <StatRow icon={ArrowRightLeft} label="Redirect Chain" value={`${bh.redirect_chain_length ?? 0} hops`} valueColor={bh.redirect_chain_length > 3 ? 'var(--color-risk-danger)' : undefined} />
              <StatRow icon={Target} label="Behavioral Risk" value={`${bh.behavioral_risk ?? 0} / 100`} valueColor={bh.behavioral_risk >= 60 ? 'var(--color-risk-danger)' : bh.behavioral_risk >= 30 ? 'var(--color-risk-caution)' : 'var(--color-risk-safe)'} />
            </div>
          </Section>

          {/* ── L3 Brand Similarity ── */}
          {(br.detected_brand || br.similarity_pct > 0) && (
            <Section icon={Target} title="Brand Impersonation (L3)" subtitle={br.detected_brand ? `Target: ${br.detected_brand}` : 'No brand detected'} defaultOpen>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <StatRow icon={Target} label="Detected Brand" value={br.detected_brand || 'None'} valueColor={br.detected_brand ? 'var(--color-risk-danger)' : undefined} />
                <StatRow icon={Fingerprint} label="Similarity" value={`${br.similarity_pct?.toFixed(1) ?? 0}%`} valueColor={br.similarity_pct >= 80 ? 'var(--color-risk-danger)' : br.similarity_pct >= 50 ? 'var(--color-risk-caution)' : 'var(--color-risk-safe)'} />
                <StatRow icon={Shield} label="Attack Vector" value={br.attack_vector?.replace(/_/g, ' ') || 'none'} valueColor={br.attack_vector !== 'none' ? 'var(--color-risk-caution)' : undefined} />
              </div>
            </Section>
          )}

          {/* ── Visual Clone ── */}
          {(result.visual_clone_score > 0 || result.visual_matched_brand) && (
            <Section icon={Eye} title="Visual Clone Analysis (L4)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <StatRow icon={Eye} label="Clone Score" value={`${(result.visual_clone_score * 100).toFixed(1)}%`} valueColor={result.visual_clone_score >= 0.85 ? 'var(--color-risk-danger)' : undefined} />
                <StatRow icon={Target} label="Matched Brand" value={result.visual_matched_brand || 'None'} />
              </div>
            </Section>
          )}

          {/* ── AI Narrative ── */}
          {result.ai_narrative && (
            <Section icon={Brain} title="AI Threat Narrative (L7)">
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>
                {result.ai_narrative}
              </p>
            </Section>
          )}

          {/* ── Evidence ── */}
          {result.evidence?.length > 0 && (
            <Section icon={ExternalLink} title={`Evidence (${result.evidence.length} signals)`} defaultOpen>
              <div className="space-y-1">
                {result.evidence.map((ev, i) => <EvidenceItem key={i} item={ev} />)}
              </div>
            </Section>
          )}

          {/* ── Feature Importance ── */}
          {result.top_features?.length > 0 && (
            <Section icon={Layers} title="ML Feature Importance (L2)" subtitle={`Phishing Prob: ${(result.phishing_probability * 100).toFixed(1)}%`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.top_features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 px-3 rounded-lg" style={{ background: 'var(--color-bg-primary)' }}>
                    <span className="text-xs font-mono flex-1" style={{ color: 'var(--color-text-secondary)' }}>{f.feature}</span>
                    <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(Math.abs(f.importance) * 100, 100)}%`, background: f.impact === 'increases_risk' ? 'var(--color-risk-danger)' : 'var(--color-accent)' }} />
                    </div>
                    <span className="text-[10px] font-mono w-8 text-right" style={{ color: f.impact === 'increases_risk' ? 'var(--color-risk-danger)' : 'var(--color-risk-safe)' }}>
                      {f.impact === 'increases_risk' ? '↑' : '↓'}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* ── Analysis Metadata ── */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-6 text-xs flex-wrap" style={{ color: 'var(--color-text-muted)' }}>
              <span>Analyzed: <strong style={{ color: 'var(--color-text-secondary)' }}>{result.analyzed_at ? new Date(result.analyzed_at).toLocaleString() : 'Just now'}</strong></span>
              <span>Pipeline Latency: <strong style={{ color: 'var(--color-text-secondary)' }}>{result.latency_ms}ms</strong></span>
              <span>Layers Active: <strong style={{ color: 'var(--color-text-secondary)' }}>L1–L7</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
