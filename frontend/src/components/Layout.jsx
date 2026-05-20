import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  Shield, Search, Share2, Flag, Menu, X,
  Activity, ChevronRight, Users,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: Activity, label: 'Dashboard' },
  { to: '/scan', icon: Search, label: 'URL Scanner' },
  { to: '/graph', icon: Share2, label: 'Threat Graph' },
  { to: '/reports', icon: Flag, label: 'Reports' },
  { to: '/about', icon: Users, label: 'About' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const pageTitle = NAV_ITEMS.find(n => n.to === location.pathname)?.label || 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ background: 'var(--color-bg-secondary)', borderRight: '1px solid var(--color-border)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div
            className="flex items-center justify-center w-10 h-10 rounded-lg"
            style={{ background: 'linear-gradient(135deg, var(--color-brand-gradient-start), var(--color-brand-gradient-end))' }}
          >
            <Shield size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>NiceTry</h1>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Detect · Explain · Protect</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="ml-auto lg:hidden" style={{ color: 'var(--color-text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3 space-y-1">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive ? 'active-nav' : ''
                }`
              }
              style={({ isActive }) => ({
                background: isActive ? 'var(--color-accent-glow)' : 'transparent',
                color: isActive ? 'var(--color-accent-hover)' : 'var(--color-text-secondary)',
                border: isActive ? '1px solid rgba(59,130,246,0.2)' : '1px solid transparent',
              })}
            >
              <Icon size={18} />
              <span>{label}</span>
              {location.pathname === to && (
                <ChevronRight size={14} className="ml-auto opacity-60" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--color-bg-card)' }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--color-risk-safe)' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>System Online</span>
            <span className="ml-auto text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>v2.0</span>
          </div>
        </div>
      </aside>

      {/* ── Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header
          className="flex items-center gap-4 px-6 py-4 shrink-0"
          style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}
        >
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden" style={{ color: 'var(--color-text-secondary)' }}>
            <Menu size={22} />
          </button>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{pageTitle}</h2>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs" style={{ background: 'var(--color-bg-card)', color: 'var(--color-text-muted)' }}>
              <Shield size={12} style={{ color: 'var(--color-accent)' }} />
              7-Layer AI Pipeline Active
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
