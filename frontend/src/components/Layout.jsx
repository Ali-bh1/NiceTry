import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Search, Share2, Flag, LayoutDashboard, X, Menu } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/scan',      icon: Search,         label: 'Scanner'   },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/graph',     icon: Share2,          label: 'Graph'     },
  { to: '/reports',   icon: Flag,            label: 'Reports'   },
];

export default function Layout() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a' }}>

      {/* ── Top navbar — same grid style as HeroNav ── */}
      <nav style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 500,
        display: 'grid',
        gridTemplateColumns: 'auto 1fr repeat(4, auto) auto',
        borderBottom: '1px solid rgba(255,255,255,0.25)',
        background: scrolled ? 'rgba(10,10,10,0.96)' : '#0a0a0a',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        transition: 'background .3s, backdrop-filter .3s',
      }}>

        {/* Logo — NICETRY, click goes home */}
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center',
            padding: '18px 28px',
            background: 'none', border: 'none',
            borderRight: '1px solid rgba(255,255,255,0.25)',
            cursor: 'pointer',
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '18px',
            fontWeight: 800,
            color: '#ff5500',
            letterSpacing: '.16em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          NICETRY
        </button>

        {/* Spacer */}
        <div style={{ borderRight: '1px solid rgba(255,255,255,0.25)' }} />

        {/* Nav links */}
        {NAV_ITEMS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              padding: '20px 28px',
              borderRight: '1px solid rgba(255,255,255,0.25)',
              textDecoration: 'none',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '12px',
              letterSpacing: '.10em',
              textTransform: 'uppercase',
              color: isActive ? '#ff5500' : 'rgba(255,255,255,0.72)',
              borderBottom: isActive ? '2px solid #ff5500' : '2px solid transparent',
              marginBottom: '-1px',
              transition: 'color .2s',
              whiteSpace: 'nowrap',
            })}
          >
            {label}
          </NavLink>
        ))}

        {/* Status dot */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '18px 24px',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '11px',
          color: 'rgba(255,255,255,0.40)',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }} />
          <span>Online</span>
        </div>

      </nav>

      {/* Content — offset by navbar height (~60px) */}
      <div style={{ paddingTop: '61px', minHeight: '100vh' }}>
        <Outlet />
      </div>

    </div>
  );
}
