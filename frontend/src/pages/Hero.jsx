import { useNavigate } from 'react-router-dom';
import { Shield, ExternalLink, LayoutDashboard, Flag, Info } from 'lucide-react';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#111' }}>

      {/* Navbar */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: '60px', borderBottom: '1px solid #e5e5e5',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', background: '#111', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={15} color="#fff" />
          </div>
          <span style={{ fontWeight: 600, fontSize: '15px' }}>NiceTry</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {[
            { label: 'Dashboard', icon: LayoutDashboard, action: () => navigate('/dashboard') },
            { label: 'About Us', icon: Info, action: () => navigate('/about') },
            { label: 'GitHub', icon: ExternalLink, action: () => window.open('https://github.com', '_blank') },
            { label: 'Report', icon: Flag, action: () => navigate('/reports') },
          ].map(({ label, icon: Icon, action }) => (
            <button key={label} onClick={action} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '7px 14px', borderRadius: '7px', border: 'none',
              background: 'transparent', cursor: 'pointer',
              fontSize: '14px', color: '#555',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '100px 24px 64px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '7px',
          border: '1px solid #e5e5e5', borderRadius: '99px',
          padding: '5px 14px', marginBottom: '32px',
          fontSize: '12px', color: '#888',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          7-layer AI pipeline · Real-time detection
        </div>

        <h1 style={{
          fontSize: '52px', fontWeight: 600, lineHeight: 1.1,
          letterSpacing: '-1.5px', marginBottom: '20px',
        }}>
          Phishing detection<br />
          <span style={{ color: '#aaa' }}>that actually works.</span>
        </h1>

        <p style={{
          fontSize: '17px', color: '#666', lineHeight: 1.7,
          maxWidth: '460px', margin: '0 auto 44px',
        }}>
          Paste any URL and get an instant risk verdict — powered by ML,
          brand similarity matching, and real-time threat intelligence.
        </p>

        <button
          onClick={() => navigate('/scan')}
          style={{
            background: '#111', color: '#fff', border: 'none',
            padding: '14px 36px', borderRadius: '9px', fontSize: '15px',
            fontWeight: 500, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: '8px',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <Shield size={16} />
          Scan a URL
        </button>
      </div>

      {/* Stats strip */}
      <div style={{ borderTop: '1px solid #e5e5e5', borderBottom: '1px solid #e5e5e5', display: 'flex', justifyContent: 'center' }}>
        {[
          { num: '2.4M+', label: 'URLs analyzed' },
          { num: '94.7%', label: 'Detection accuracy' },
          { num: '< 1.2s', label: 'Avg response time' },
          { num: '7', label: 'Detection layers' },
        ].map(({ num, label }, i, arr) => (
          <div key={label} style={{
            padding: '28px 56px', textAlign: 'center',
            borderRight: i < arr.length - 1 ? '1px solid #e5e5e5' : 'none',
          }}>
            <div style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.5px' }}>{num}</div>
            <div style={{ fontSize: '13px', color: '#888', marginTop: '3px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Detection layers */}
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '56px 24px 80px' }}>
        <p style={{ fontSize: '12px', color: '#aaa', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '20px' }}>
          Detection layers
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {[
            { n: 'L1', name: 'URL features', active: true },
            { n: 'L2', name: 'ML engine', active: true },
            { n: 'L3', name: 'Brand match', active: true },
            { n: 'L4', name: 'Visual clone', active: false },
            { n: 'L5', name: 'Threat intel', active: true },
            { n: 'L6', name: 'Behavioral', active: true },
            { n: 'L7', name: 'AI narrative', active: true },
          ].map(({ n, name, active }) => (
            <div key={n} style={{ border: '1px solid #e5e5e5', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <span style={{ fontSize: '11px', color: '#ccc' }}>{n}</span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: active ? '#22c55e' : '#f59e0b', display: 'inline-block' }} />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#333' }}>{name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}