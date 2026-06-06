import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, TrendingUp, Clock, Eye, Zap } from 'lucide-react';
import { api } from '../services/api.js';

const S = {
  page: { maxWidth: '960px', margin: '0 auto', padding: '40px 32px' },
  label: {
    fontSize: '11px', color: '#555', letterSpacing: '0.08em',
    textTransform: 'uppercase', marginBottom: '10px', fontFamily: 'monospace',
  },
  card: {
    background: '#111', border: '1px solid #1e1e1e',
    borderRadius: '8px', padding: '20px',
  },
  row: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '9px 0', borderBottom: '1px solid #1a1a1a', fontSize: '13px',
  },
};

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div style={S.card}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '6px',
        background: color + '18', display: 'flex', alignItems: 'center',
        justifyContent: 'center', marginBottom: '14px',
      }}>
        <Icon size={16} color={color} />
      </div>
      <div style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.5px', color: '#f0f0f0', marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ fontSize: '13px', color: '#888' }}>{label}</div>
      {sub && <div style={{ fontSize: '12px', color: '#444', marginTop: '2px', fontFamily: 'monospace' }}>{sub}</div>}
    </div>
  );
}

function VerdictBadge({ verdict }) {
  const map = {
    phishing:   { bg: 'rgba(220,38,38,0.12)',  color: '#f87171', border: 'rgba(220,38,38,0.25)' },
    suspicious: { bg: 'rgba(255,85,0,0.12)',   color: '#ff7733', border: 'rgba(255,85,0,0.25)' },
    legitimate: { bg: 'rgba(34,197,94,0.1)',   color: '#4ade80', border: 'rgba(34,197,94,0.25)' },
  };
  const s = map[verdict] || map.legitimate;
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: '3px 10px', borderRadius: '4px', fontSize: '11px',
      fontWeight: 600, textTransform: 'uppercase', fontFamily: 'monospace',
    }}>
      {verdict}
    </span>
  );
}

function RiskBar({ score }) {
  const color = score >= 75 ? '#f87171' : score >= 50 ? '#ff7733' : '#4ade80';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '80px', height: '3px', background: '#222', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: '2px' }} />
      </div>
      <span style={{ fontSize: '12px', fontFamily: 'monospace', color }}>{score}</span>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    api.getDashboard().then(setStats).catch(() => {});
    api.getHealth().then(setHealth).catch(() => {});
  }, []);

  return (
    <div style={S.page}>
      <p style={S.label}>Admin Dashboard</p>
      <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '28px', letterSpacing: '-0.3px', color: '#f0f0f0' }}>
        Overview
      </h1>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <StatCard icon={Eye} label="Scans (24h)" value={stats?.total_scans_24h ?? 0} sub={`${stats?.total_scans_7d ?? 0} this week`} color="#ff5500" />
        <StatCard icon={AlertTriangle} label="Phishing Detected" value={stats?.phishing_detected_24h ?? 0} sub="Last 24 hours" color="#f87171" />
        <StatCard icon={TrendingUp} label="Avg Risk Score" value={stats?.avg_risk_score?.toFixed(1) ?? '0.0'} sub="7-day average" color="#ff7733" />
        <StatCard icon={Clock} label="Avg Latency" value={`${((stats?.avg_latency_ms ?? 0) / 1000).toFixed(1)}s`} sub="Pipeline response" color="#4ade80" />
      </div>

      {/* System health + layers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>

        <div style={S.card}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#ccc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Shield size={14} color="#555" /> System Health
          </div>
          {[
            { label: 'API Status', value: health?.status ?? '—', ok: health?.status === 'healthy' },
            { label: 'ML Model', value: health?.model_loaded ? 'Loaded' : 'Not loaded', ok: health?.model_loaded },
            { label: 'Model Version', value: health?.model_version ?? '—', ok: true },
            { label: 'Uptime', value: `${((health?.uptime_seconds ?? 0) / 60).toFixed(0)} min`, ok: true },
            { label: 'Total Analyses', value: health?.total_analyses ?? 0, ok: true },
          ].map(({ label, value, ok }) => (
            <div key={label} style={S.row}>
              <span style={{ color: '#555', fontSize: '13px' }}>{label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: ok ? '#22c55e' : '#dc2626', display: 'inline-block' }} />
                <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#aaa' }}>{String(value)}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={S.card}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#ccc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Eye size={14} color="#555" /> Community Reports
          </div>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '40px', fontWeight: 700, color: '#ff5500', letterSpacing: '-1px' }}>{stats?.pending_reports ?? 0}</div>
            <div style={{ fontSize: '13px', color: '#555', marginTop: '4px' }}>Pending review</div>
            <div style={{ fontSize: '12px', color: '#333', marginTop: '8px', fontFamily: 'monospace' }}>{stats?.total_scans_30d ?? 0} scans this month</div>
          </div>
        </div>

        <div style={S.card}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#ccc', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Zap size={14} color="#555" /> Detection Layers
          </div>
          {[
            { label: 'L1 URL Features', status: 'Active' },
            { label: 'L2 ML Engine', status: health?.model_loaded ? 'Active' : 'Degraded' },
            { label: 'L3 Brand Similarity', status: 'Active' },
            { label: 'L4 Visual Clone', status: 'Stub' },
            { label: 'L5 Threat Intel', status: 'Active' },
            { label: 'L6 Behavioral', status: 'Active' },
            { label: 'L7 AI Investigator', status: 'Active' },
          ].map(({ label, status }) => (
            <div key={label} style={S.row}>
              <span style={{ color: '#555', fontSize: '12px' }}>{label}</span>
              <span style={{
                fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                fontFamily: 'monospace',
                background: status === 'Active' ? 'rgba(34,197,94,0.1)' : status === 'Stub' ? 'rgba(255,85,0,0.1)' : 'rgba(220,38,38,0.1)',
                color: status === 'Active' ? '#4ade80' : status === 'Stub' ? '#ff7733' : '#f87171',
              }}>{status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent incidents */}
      <div style={S.card}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#ccc', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <AlertTriangle size={14} color="#555" /> Recent Incidents
        </div>
        {(stats?.recent_incidents?.length ?? 0) === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#333', fontSize: '14px' }}>
            No incidents yet — scan some URLs to see results here
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e1e1e' }}>
                {['Domain', 'Risk', 'Verdict', 'Threat Type', 'Time'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#444', fontWeight: 500, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'monospace' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recent_incidents.map((inc, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #181818' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '12px', color: '#aaa' }}>{inc.domain}</td>
                  <td style={{ padding: '10px 12px' }}><RiskBar score={inc.risk_score} /></td>
                  <td style={{ padding: '10px 12px' }}><VerdictBadge verdict={inc.verdict} /></td>
                  <td style={{ padding: '10px 12px', color: '#555', fontSize: '12px' }}>{inc.threat_type || '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#333', fontSize: '12px', fontFamily: 'monospace' }}>
                    {inc.analyzed_at ? new Date(inc.analyzed_at).toLocaleTimeString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
