import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Shield, Search, Share2, Flag, LayoutDashboard, Menu, X, Home } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/scan', icon: Search, label: 'URL Scanner' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Admin Dashboard' },
  { to: '/graph', icon: Share2, label: 'Threat Graph' },
  { to: '/reports', icon: Flag, label: 'Reports' },
];

function SidebarContent({ setOpen, mobile }) {
  return (
    <>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 20px 18px', borderBottom: '1px solid #e5e5e5',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', background: '#111', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={15} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px', color: '#111' }}>NiceTry</div>
            <div style={{ fontSize: '11px', color: '#999' }}>Detect · Protect</div>
          </div>
        </div>
        {mobile && (
          <button onClick={() => setOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#999' }}>
            <X size={18} />
          </button>
        )}
      </div>

      <nav style={{ padding: '12px 10px', flex: 1 }}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            onClick={() => setOpen(false)}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 12px', borderRadius: '7px', marginBottom: '2px',
              textDecoration: 'none', fontSize: '14px',
              background: isActive ? '#f5f5f5' : 'transparent',
              color: isActive ? '#111' : '#666',
              fontWeight: isActive ? 500 : 400,
            })}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '14px 16px', borderTop: '1px solid #e5e5e5' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          <span style={{ fontSize: '12px', color: '#999' }}>System Online</span>
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#ccc' }}>v2.0</span>
        </div>
      </div>
    </>
  );
}

export default function Layout() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fff' }}>

      {/* Desktop sidebar */}
      <aside style={{
        width: '220px', flexShrink: 0, borderRight: '1px solid #e5e5e5',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        <SidebarContent setOpen={setOpen} />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.15)', zIndex: 40 }} />
          <aside style={{
            width: '220px', borderRight: '1px solid #e5e5e5',
            display: 'flex', flexDirection: 'column',
            position: 'fixed', inset: '0 auto 0 0', zIndex: 50, background: '#fff',
          }}>
            <SidebarContent setOpen={setOpen} mobile />
          </aside>
        </>
      )}

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Mobile topbar */}
        {/* <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '14px 20px', borderBottom: '1px solid #e5e5e5',
        }} className="lg:hidden">
          <button onClick={() => setOpen(true)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#555' }}>
            <Menu size={20} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{ width: '24px', height: '24px', background: '#111', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={13} color="#fff" />
            </div>
            <span style={{ fontWeight: 600, fontSize: '14px' }}>NiceTry</span>
          </div>
        </div> */}

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}