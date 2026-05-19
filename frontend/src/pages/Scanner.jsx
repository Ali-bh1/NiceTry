import { useState } from 'react';
import { Search, Shield, AlertTriangle, Loader2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../services/api.js';

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

export default function Scanner() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showNarrative, setShowNarrative] = useState(false);

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
                      <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        <span>Domain: <strong style={{ color: 'var(--color-text-secondary)' }}>{result.domain}</strong></span>
                        <span>Confidence: <strong style={{ color: 'var(--color-text-secondary)' }}>{(result.confidence * 100).toFixed(1)}%</strong></span>
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

          {/* AI Narrative */}
          {result.ai_narrative && (
            <div className="glass-card p-5">
              <button
                className="flex items-center gap-2 w-full text-left"
                onClick={() => setShowNarrative(!showNarrative)}
              >
                <Shield size={16} style={{ color: 'var(--color-accent)' }} />
                <h3 className="text-sm font-semibold flex-1" style={{ color: 'var(--color-text-primary)' }}>AI Threat Narrative</h3>
                {showNarrative ? <ChevronUp size={16} style={{ color: 'var(--color-text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--color-text-muted)' }} />}
              </button>
              {showNarrative && (
                <p className="text-sm mt-3 leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text-secondary)' }}>
                  {result.ai_narrative}
                </p>
              )}
            </div>
          )}

          {/* Evidence */}
          {result.evidence?.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                <ExternalLink size={16} style={{ color: 'var(--color-accent)' }} />
                Evidence ({result.evidence.length} signals)
              </h3>
              <div className="space-y-1">
                {result.evidence.map((ev, i) => <EvidenceItem key={i} item={ev} />)}
              </div>
            </div>
          )}

          {/* Feature Importance */}
          {result.top_features?.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>Top Contributing Features</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {result.top_features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 px-3 rounded-lg" style={{ background: 'var(--color-bg-primary)' }}>
                    <span className="text-xs font-mono flex-1" style={{ color: 'var(--color-text-secondary)' }}>{f.feature}</span>
                    <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(Math.abs(f.importance) * 100, 100)}%`, background: 'var(--color-accent)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
