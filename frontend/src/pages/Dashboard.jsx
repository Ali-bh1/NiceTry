import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, TrendingUp, Clock, Eye, Zap } from 'lucide-react';
import { api } from '../services/api.js';

const S = {
  page: { maxWidth: '960px', margin: '0 auto', padding: '40px 32px' },
  label: { fontSize: '12px', color: '#aaa', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '10px' },
  card: { background: '#fff', border: '1px solid #e5e5e5', borderRadius: '10px', padding: '20px' },
  row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #f5f5f5', fontSize: '13px' },
};

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div style={S.card}>
      <div style={{ width: '32px', height: '32px', borderRadius: '7px', background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
        <Icon size={16} color={color} />
      </div>
      <div style={{ fontSize: '26px', fontWeight: 600, letterSpacing: '-0.5px', color: '#111', marginBottom: '4px' }}>{value}</div>
      <div style={{ fontSize: '13px', color: '#555' }}>{label}</div>
      {sub && <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>{sub}</div>}
    </div>
  );
}

function VerdictBadge({ verdict }) {
  const map = {
    phishing: { bg: '#fef2f2', color: '#b91c1c' },
    suspicious: { bg: '#fffbeb', color: '#b45309' },
    legitimate: { bg: '#f0fdf4', color: '#15803d' },
  };
  const s = map[verdict] || map.legitimate;
  return (
    <span style={{ ...s, padding: '3px 10px', borderRadius: '5px', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' }}>
      {verdict}
    </span>
  );
}

function RiskBar({ score }) {
  const color = score >= 75 ? '#dc2626' : score >= 50 ? '#d97706' : '#16a34a';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '80px', height: '3px', background: '#f0f0f0', borderRadius: '2px', overflow: 'hidden' }}>
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
      <h1 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '28px', letterSpacing: '-0.3px' }}>Overview</h1>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        <StatCard icon={Eye} label="Scans (24h)" value={stats?.total_scans_24h ?? 0} sub={`${stats?.total_scans_7d ?? 0} this week`} color="#3b82f6" />
        <StatCard icon={AlertTriangle} label="Phishing Detected" value={stats?.phishing_detected_24h ?? 0} sub="Last 24 hours" color="#dc2626" />
        <StatCard icon={TrendingUp} label="Avg Risk Score" value={stats?.avg_risk_score?.toFixed(1) ?? '0.0'} sub="7-day average" color="#d97706" />
        <StatCard icon={Clock} label="Avg Latency" value={`${((stats?.avg_latency_ms ?? 0) / 1000).toFixed(1)}s`} sub="Pipeline response" color="#16a34a" />
      </div>

      {/* System health + layers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '20px' }}>

        <div style={S.card}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#111', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Shield size={14} color="#888" /> System Health
          </div>
          {[
            { label: 'API Status', value: health?.status ?? '—', ok: health?.status === 'healthy' },
            { label: 'ML Model', value: health?.model_loaded ? 'Loaded' : 'Not loaded', ok: health?.model_loaded },
            { label: 'Model Version', value: health?.model_version ?? '—', ok: true },
            { label: 'Uptime', value: `${((health?.uptime_seconds ?? 0) / 60).toFixed(0)} min`, ok: true },
            { label: 'Total Analyses', value: health?.total_analyses ?? 0, ok: true },
          ].map(({ label, value, ok }) => (
            <div key={label} style={S.row}>
              <span style={{ color: '#888' }}>{label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: ok ? '#22c55e' : '#dc2626', display: 'inline-block' }} />
                <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#333' }}>{String(value)}</span>
              </div>
            </div>
          ))}
        </div>

        <div style={S.card}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#111', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Eye size={14} color="#888" /> Community Reports
          </div>
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '40px', fontWeight: 600, color: '#d97706', letterSpacing: '-1px' }}>{stats?.pending_reports ?? 0}</div>
            <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>Pending review</div>
            <div style={{ fontSize: '12px', color: '#bbb', marginTop: '8px' }}>{stats?.total_scans_30d ?? 0} scans this month</div>
          </div>
        </div>

        <div style={S.card}>
          <div style={{ fontSize: '13px', fontWeight: 500, color: '#111', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Zap size={14} color="#888" /> Detection Layers
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
              <span style={{ color: '#888', fontSize: '12px' }}>{label}</span>
              <span style={{
                fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '4px',
                background: status === 'Active' ? '#f0fdf4' : status === 'Stub' ? '#fffbeb' : '#fef2f2',
                color: status === 'Active' ? '#15803d' : status === 'Stub' ? '#b45309' : '#b91c1c',
              }}>{status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent incidents */}
      <div style={S.card}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#111', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '7px' }}>
          <AlertTriangle size={14} color="#888" /> Recent Incidents
        </div>
        {(stats?.recent_incidents?.length ?? 0) === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb', fontSize: '14px' }}>
            No incidents yet — scan some URLs to see results here
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                {['Domain', 'Risk', 'Verdict', 'Threat Type', 'Time'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: '#aaa', fontWeight: 500, fontSize: '12px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {stats.recent_incidents.map((inc, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '12px', color: '#333' }}>{inc.domain}</td>
                  <td style={{ padding: '10px 12px' }}><RiskBar score={inc.risk_score} /></td>
                  <td style={{ padding: '10px 12px' }}><VerdictBadge verdict={inc.verdict} /></td>
                  <td style={{ padding: '10px 12px', color: '#666', fontSize: '12px' }}>{inc.threat_type || '—'}</td>
                  <td style={{ padding: '10px 12px', color: '#aaa', fontSize: '12px' }}>{inc.analyzed_at ? new Date(inc.analyzed_at).toLocaleTimeString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}