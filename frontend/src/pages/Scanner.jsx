import { useState } from 'react';
import {
  Search, Shield, AlertTriangle, Loader2, ExternalLink,
  ChevronDown, ChevronUp, Globe, Lock, Server, Clock,
  Eye, ArrowRightLeft, Layers, MousePointer, Clipboard,
  Fingerprint, Brain, Target,
} from 'lucide-react';
import { api } from '../services/api.js';

const S = {
  page: { maxWidth: '860px', margin: '0 auto', padding: '40px 32px' },
  card: {
    background: '#111', border: '1px solid #2a2a2a',
    borderRadius: '8px', padding: '24px', marginBottom: '12px',
  },
  label: {
    fontSize: '11px', color: 'rgba(255,255,255,0.50)', letterSpacing: '0.08em',
    textTransform: 'uppercase', marginBottom: '10px', fontFamily: 'monospace',
  },
  input: {
    flex: 1, border: '1px solid #2a2a2a', borderRadius: '6px',
    padding: '11px 14px', fontSize: '14px', outline: 'none',
    color: '#FFF5EE', fontFamily: 'inherit', background: '#0a0a0a',
    transition: 'border-color 0.15s',
  },
  btn: {
    background: '#ff5500', color: '#fff', border: 'none',
    padding: '11px 22px', borderRadius: '6px', fontSize: '14px',
    fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px',
    whiteSpace: 'nowrap', transition: 'background 0.15s',
    fontFamily: 'monospace', letterSpacing: '0.04em',
  },
  row: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '9px 0', borderBottom: '1px solid #1e1e1e', fontSize: '13px',
  },
  rowLabel: { color: 'rgba(255,255,255,0.55)' },
  sectionHead: {
    display: 'flex', alignItems: 'center', gap: '8px',
    cursor: 'pointer', width: '100%', textAlign: 'left',
    border: 'none', background: 'none', padding: 0, color: '#FFF5EE',
  },
};

function RiskRing({ score }) {
  const size = 100, stroke = 7, radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const color = score >= 75 ? '#f87171' : score >= 50 ? '#ff7733' : '#4ade80';
  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#222" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '22px', fontWeight: 700, color, lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: '10px', color: '#333', fontFamily: 'monospace' }}>/ 100</div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, subtitle, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={S.card}>
      <button style={S.sectionHead} onClick={() => setOpen(!open)}>
        <Icon size={15} color="rgba(255,255,255,0.45)" />
        <span style={{ fontSize: '13px', fontWeight: 600, flex: 1, color: '#FFF5EE' }}>{title}</span>
        {subtitle && <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', marginRight: '8px', fontFamily: 'monospace' }}>{subtitle}</span>}
        {open ? <ChevronUp size={15} color="rgba(255,255,255,0.35)" /> : <ChevronDown size={15} color="rgba(255,255,255,0.35)" />}
      </button>
      {open && <div style={{ marginTop: '16px' }}>{children}</div>}
    </div>
  );
}

function StatRow({ icon: Icon, label, value, valueColor }) {
  return (
    <div style={{ ...S.row }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <Icon size={13} color="#333" />
        <span style={S.rowLabel}>{label}</span>
      </div>
      <span style={{ fontSize: '13px', fontWeight: 500, color: valueColor || '#ccc', fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}

function FlagPill({ icon: Icon, label, active }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 12px', borderRadius: '6px', marginBottom: '4px',
      background: active ? 'rgba(220,38,38,0.08)' : '#0d0d0d', fontSize: '13px',
      border: `1px solid ${active ? 'rgba(220,38,38,0.2)' : '#1a1a1a'}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: '#888' }}>
        <Icon size={13} />
        {label}
      </div>
      <span style={{ fontSize: '11px', fontWeight: 600, color: active ? '#f87171' : '#4ade80', fontFamily: 'monospace' }}>
        {active ? 'Detected' : 'Clean'}
      </span>
    </div>
  );
}

export default function Scanner() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleScan(e) {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true); setError(''); setResult(null);
    try {
      setResult(await api.checkUrl(url.trim()));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const ti = result?.threat_intel || {};
  const bh = result?.behavioral || {};
  const br = result?.brand_similarity || {};

  const verdictMeta = {
    phishing:   { color: '#f87171', bg: 'rgba(220,38,38,0.08)',  border: 'rgba(220,38,38,0.2)',  label: 'Phishing detected' },
    suspicious: { color: '#ff7733', bg: 'rgba(255,85,0,0.08)',   border: 'rgba(255,85,0,0.2)',   label: 'Suspicious' },
    legitimate: { color: '#4ade80', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.2)',  label: 'Legitimate' },
  };

  return (
    <div style={S.page}>
      <p style={S.label}>URL Scanner</p>
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '24px', letterSpacing: '-0.3px', color: '#f0f0f0' }}>
        Analyze a URL
      </h1>

      {/* Input */}
      <div style={{ ...S.card }}>
        <form onSubmit={handleScan} style={{ display: 'flex', gap: '10px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={14} color="#444" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com"
              disabled={loading}
              style={{ ...S.input, paddingLeft: '36px', width: '100%' }}
              onFocus={e => e.target.style.borderColor = '#ff5500'}
              onBlur={e => e.target.style.borderColor = '#222'}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !url.trim()}
            style={{
              ...S.btn,
              opacity: loading || !url.trim() ? 0.4 : 1,
              cursor: loading || !url.trim() ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => { if (!loading && url.trim()) e.currentTarget.style.background = '#e64d00'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#ff5500'; }}
          >
            {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Shield size={15} />}
            {loading ? 'Analyzing...' : 'Scan'}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div style={{ ...S.card, borderColor: 'rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={16} color="#f87171" />
          <span style={{ fontSize: '14px', color: '#f87171' }}>{error}</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ ...S.card, textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '14px', color: '#555' }}>Running 7-layer analysis…</div>
          <div style={{ fontSize: '12px', color: '#333', marginTop: '6px', fontFamily: 'monospace' }}>
            URL → ML → Brand → Visual → Threat Intel → Behavioral → AI
          </div>
        </div>
      )}

      {/* Results */}
      {result && (() => {
        const v = verdictMeta[result.verdict] || verdictMeta.legitimate;
        return (
          <div>
            {/* Verdict */}
            <div style={{ ...S.card, background: v.bg, borderColor: v.border }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <RiskRing score={result.risk_score} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '17px', fontWeight: 700, color: v.color, marginBottom: '4px' }}>
                    {v.label}
                  </div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace', marginBottom: '8px' }}>{result.url}</div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'rgba(255,255,255,0.50)', fontFamily: 'monospace' }}>
                    <span>Domain: <strong style={{ color: 'rgba(255,255,255,0.85)' }}>{result.domain}</strong></span>
                    <span>Confidence: <strong style={{ color: 'rgba(255,255,255,0.85)' }}>{(result.confidence * 100).toFixed(1)}%</strong></span>
                    <span>ML prob: <strong style={{ color: 'rgba(255,255,255,0.85)' }}>{(result.phishing_probability * 100).toFixed(1)}%</strong></span>
                    <span>Latency: <strong style={{ color: 'rgba(255,255,255,0.85)' }}>{result.latency_ms}ms</strong></span>
                  </div>
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: 700, padding: '6px 14px', borderRadius: '4px',
                  background: v.color + '18', color: v.color, textTransform: 'uppercase',
                  fontFamily: 'monospace', letterSpacing: '0.06em', border: `1px solid ${v.border}`,
                }}>
                  {result.recommended_action}
                </span>
              </div>
            </div>

            {/* Threat Intel */}
            <Section icon={Globe} title="Threat Intelligence (L5)" subtitle={`Infra risk: ${ti.infrastructure_risk ?? 0}/100`} defaultOpen>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                <StatRow icon={Clock} label="Domain Age" value={ti.domain_age_days != null ? `${ti.domain_age_days} days` : 'Unknown'} valueColor={ti.domain_age_days != null && ti.domain_age_days < 30 ? '#f87171' : undefined} />
                <StatRow icon={Fingerprint} label="Registrar" value={ti.registrar || 'Unknown'} />
                <StatRow icon={Lock} label="SSL Valid" value={ti.ssl_valid ? '✓ Valid' : '✗ Invalid'} valueColor={ti.ssl_valid ? '#4ade80' : '#f87171'} />
                <StatRow icon={Lock} label="SSL Issuer" value={ti.ssl_issuer || 'N/A'} />
                <StatRow icon={Server} label="Hosting" value={ti.hosting_provider || 'Unknown'} />
                <StatRow icon={Globe} label="Country" value={ti.hosting_country || 'Unknown'} />
                <StatRow icon={Eye} label="WHOIS Privacy" value={ti.privacy_protected ? 'Protected' : 'Public'} />
                <StatRow icon={Target} label="Infra Risk" value={`${ti.infrastructure_risk ?? 0}/100`} valueColor={ti.infrastructure_risk >= 60 ? '#f87171' : ti.infrastructure_risk >= 30 ? '#ff7733' : '#4ade80'} />
              </div>
            </Section>

            {/* Behavioral */}
            <Section icon={Brain} title="Behavioral Analysis (L6)" subtitle={`Behavioral risk: ${bh.behavioral_risk ?? 0}/100`}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                <FlagPill icon={Eye} label="Hidden Forms" active={bh.hidden_forms} />
                <FlagPill icon={Layers} label="iFrame Abuse" active={bh.iframe_abuse} />
                <FlagPill icon={MousePointer} label="Popup Loops" active={bh.popup_loops} />
                <FlagPill icon={Clipboard} label="Clipboard Hijack" active={bh.clipboard_hijack} />
                <FlagPill icon={Lock} label="Fake Login Overlay" active={bh.fake_login_overlay} />
                <FlagPill icon={Shield} label="Excessive Permissions" active={bh.excessive_permissions} />
              </div>
              <div style={{ marginTop: '8px' }}>
                <StatRow icon={ArrowRightLeft} label="Redirect Chain" value={`${bh.redirect_chain_length ?? 0} hops`} valueColor={bh.redirect_chain_length > 3 ? '#f87171' : undefined} />
              </div>
            </Section>

            {/* Brand */}
            {(br.detected_brand || br.similarity_pct > 0) && (
              <Section icon={Target} title="Brand Impersonation (L3)" subtitle={br.detected_brand ? `Target: ${br.detected_brand}` : undefined} defaultOpen>
                <StatRow icon={Target} label="Detected Brand" value={br.detected_brand || 'None'} valueColor={br.detected_brand ? '#f87171' : undefined} />
                <StatRow icon={Fingerprint} label="Similarity" value={`${br.similarity_pct?.toFixed(1) ?? 0}%`} valueColor={br.similarity_pct >= 80 ? '#f87171' : br.similarity_pct >= 50 ? '#ff7733' : '#4ade80'} />
                <StatRow icon={Shield} label="Attack Vector" value={br.attack_vector?.replace(/_/g, ' ') || 'none'} />
              </Section>
            )}

            {/* AI Narrative */}
            {result.ai_narrative && (
              <Section icon={Brain} title="AI Threat Narrative (L7)">
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{result.ai_narrative}</p>
              </Section>
            )}

            {/* Evidence */}
            {result.evidence?.length > 0 && (
              <Section icon={ExternalLink} title={`Evidence (${result.evidence.length} signals)`} defaultOpen>
                {result.evidence.map((ev, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', padding: '8px 0', borderBottom: '1px solid #181818' }}>
                    <div style={{ width: '3px', borderRadius: '2px', background: ev.confidence >= 0.8 ? '#f87171' : ev.confidence >= 0.5 ? '#ff7733' : '#333', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '13px', color: '#ccc' }}>{ev.description}</div>
                      <div style={{ fontSize: '12px', color: '#444', marginTop: '2px', fontFamily: 'monospace' }}>
                        Confidence: {(ev.confidence * 100).toFixed(0)}% · {ev.source}
                      </div>
                    </div>
                  </div>
                ))}
              </Section>
            )}

            {/* ML Features */}
            {result.top_features?.length > 0 && (
              <Section icon={Layers} title="ML Feature Importance (L2)" subtitle={`Phishing prob: ${(result.phishing_probability * 100).toFixed(1)}%`}>
                {result.top_features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: '1px solid #181818' }}>
                    <span style={{ fontSize: '12px', color: '#555', flex: 1, fontFamily: 'monospace' }}>{f.feature}</span>
                    <div style={{ width: '80px', height: '3px', background: '#1e1e1e', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(Math.abs(f.importance) * 100, 100)}%`, background: f.impact === 'increases_risk' ? '#f87171' : '#4ade80', borderRadius: '2px' }} />
                    </div>
                    <span style={{ fontSize: '12px', color: f.impact === 'increases_risk' ? '#f87171' : '#4ade80', width: '10px' }}>
                      {f.impact === 'increases_risk' ? '↑' : '↓'}
                    </span>
                  </div>
                ))}
              </Section>
            )}

            {/* Meta */}
            <div style={{ ...S.card, display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '12px', color: '#333', fontFamily: 'monospace' }}>
              <span>Analyzed: <strong style={{ color: '#666' }}>{result.analyzed_at ? new Date(result.analyzed_at).toLocaleString() : 'Just now'}</strong></span>
              <span>Latency: <strong style={{ color: '#666' }}>{result.latency_ms}ms</strong></span>
              <span>Layers: <strong style={{ color: '#ff5500' }}>L1–L7</strong></span>
            </div>
          </div>
        );
      })()}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
