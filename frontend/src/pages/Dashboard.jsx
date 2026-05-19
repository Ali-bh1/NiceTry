import { useState, useEffect } from 'react';
import {
  Shield, AlertTriangle, TrendingUp, Clock,
  Activity, Eye, Zap, Users,
} from 'lucide-react';
import { api } from '../services/api.js';

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between mb-3">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg"
          style={{ background: `${color}20`, color }}
        >
          <Icon size={20} />
        </div>
        <Zap size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color }} />
      </div>
      <p className="text-2xl font-bold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>{value}</p>
      <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>{label}</p>
      {sub && <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{sub}</p>}
    </div>
  );
}

function VerdictBadge({ verdict }) {
  const cls = verdict === 'phishing' ? 'badge-phishing' : verdict === 'suspicious' ? 'badge-suspicious' : 'badge-safe';
  return (
    <span className={`${cls} px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wide`}>
      {verdict}
    </span>
  );
}

function RiskBar({ score }) {
  const color = score >= 75 ? 'var(--color-risk-danger)' : score >= 50 ? 'var(--color-risk-caution)' : 'var(--color-risk-safe)';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-primary)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
      <span className="text-xs font-mono w-8 text-right" style={{ color }}>{score}</span>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [s, h] = await Promise.all([api.getDashboard(), api.getHealth()]);
        setStats(s);
        setHealth(h);
      } catch (err) {
        console.error('Dashboard load failed:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3" style={{ color: 'var(--color-text-muted)' }}>
          <Activity size={20} className="animate-pulse" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Eye}
          label="Scans (24h)"
          value={stats?.total_scans_24h ?? 0}
          sub={`${stats?.total_scans_7d ?? 0} this week`}
          color="var(--color-accent)"
        />
        <StatCard
          icon={AlertTriangle}
          label="Phishing Detected"
          value={stats?.phishing_detected_24h ?? 0}
          sub="Last 24 hours"
          color="var(--color-risk-danger)"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Risk Score"
          value={stats?.avg_risk_score?.toFixed(1) ?? '0.0'}
          sub="7-day average"
          color="var(--color-risk-caution)"
        />
        <StatCard
          icon={Clock}
          label="Avg Latency"
          value={`${((stats?.avg_latency_ms ?? 0) / 1000).toFixed(1)}s`}
          sub="Pipeline response time"
          color="var(--color-risk-safe)"
        />
      </div>

      {/* ── System Health + Reports ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Health Card */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={16} style={{ color: 'var(--color-accent)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>System Health</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'API Status', value: health?.status ?? 'unknown', ok: health?.status === 'healthy' },
              { label: 'ML Model', value: health?.model_loaded ? 'Loaded' : 'Not loaded', ok: health?.model_loaded },
              { label: 'Model Version', value: health?.model_version ?? '-', ok: true },
              { label: 'Uptime', value: `${((health?.uptime_seconds ?? 0) / 60).toFixed(0)} min`, ok: true },
              { label: 'Total Analyses', value: health?.total_analyses ?? 0, ok: true },
            ].map(({ label, value, ok }) => (
              <div key={label} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: ok ? 'var(--color-risk-safe)' : 'var(--color-risk-danger)' }} />
                  <span className="text-xs font-mono" style={{ color: 'var(--color-text-secondary)' }}>{String(value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Reports */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} style={{ color: 'var(--color-risk-caution)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Community Reports</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-6">
            <p className="text-4xl font-bold" style={{ color: 'var(--color-risk-caution)' }}>{stats?.pending_reports ?? 0}</p>
            <p className="text-sm mt-2" style={{ color: 'var(--color-text-muted)' }}>Pending Review</p>
          </div>
          <div className="text-center">
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {stats?.total_scans_30d ?? 0} total scans this month
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} style={{ color: 'var(--color-brand-gradient-end)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Detection Layers</h3>
          </div>
          <div className="space-y-2">
            {[
              { label: 'L1 URL Features', status: 'Active' },
              { label: 'L2 ML Engine', status: health?.model_loaded ? 'Active' : 'Degraded' },
              { label: 'L3 Brand Similarity', status: 'Active' },
              { label: 'L4 Visual Clone', status: 'Stub' },
              { label: 'L5 Threat Intel', status: 'Active' },
              { label: 'L6 Behavioral', status: 'Active' },
              { label: 'L7 AI Investigator', status: 'Active' },
            ].map(({ label, status }) => (
              <div key={label} className="flex items-center justify-between py-1" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded"
                  style={{
                    background: status === 'Active' ? 'rgba(16,185,129,0.1)' : status === 'Stub' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
                    color: status === 'Active' ? 'var(--color-risk-safe)' : status === 'Stub' ? 'var(--color-risk-caution)' : 'var(--color-risk-danger)',
                  }}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Incidents ── */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} style={{ color: 'var(--color-risk-danger)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>Recent Incidents</h3>
        </div>
        {(stats?.recent_incidents?.length ?? 0) === 0 ? (
          <div className="text-center py-8">
            <Shield size={32} className="mx-auto mb-3" style={{ color: 'var(--color-risk-safe)', opacity: 0.5 }} />
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>No phishing incidents detected yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Scan some URLs to see results here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Domain', 'Risk', 'Verdict', 'Threat Type', 'Time'].map(h => (
                    <th key={h} className="text-left py-2 px-3 text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recent_incidents.map((inc, i) => (
                  <tr key={i} className="hover:bg-[var(--color-bg-card-hover)] transition-colors" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="py-2.5 px-3 font-mono text-xs" style={{ color: 'var(--color-text-primary)' }}>{inc.domain}</td>
                    <td className="py-2.5 px-3"><RiskBar score={inc.risk_score} /></td>
                    <td className="py-2.5 px-3"><VerdictBadge verdict={inc.verdict} /></td>
                    <td className="py-2.5 px-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{inc.threat_type || '-'}</td>
                    <td className="py-2.5 px-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {inc.analyzed_at ? new Date(inc.analyzed_at).toLocaleTimeString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
