import React, { useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Logo } from '../navigation/PublicHeader';
import { Briefcase, Users, Plus, LogOut, User, Calendar } from 'lucide-react';
import Avatar from '../ui/Avatar';

const BriefcaseIcon = Briefcase;

/* ── Sidebar ───────────────────────────────────────────────────────── */
function Sidebar({ navItems, user, onLogout, extra }) {
  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.email || 'User';

  const defaultIcons = [Briefcase, Users, Plus, User, Calendar];

  return (
    <aside className="w-[232px] shrink-0 h-screen sticky top-0 flex flex-col overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0D1018 0%, #090C14 100%)',
        borderRight: '1px solid rgba(35,42,62,0.7)',
      }}>

      {/* Ambient glow at top */}
      <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.06) 0%, transparent 70%)' }} />

      {/* Logo header */}
      <div className="h-14 px-5 flex items-center gap-2 shrink-0 relative"
        style={{ borderBottom: '1px solid rgba(35,42,62,0.6)' }}>
        <Logo />
      </div>

      {/* Nav items */}
      <nav className="p-3 space-y-0.5 flex-1 overflow-y-auto slim-scroll relative">
        <div className="text-[10px] font-mono tracking-[0.18em] text-brand-text-disabled uppercase px-3 mb-2 mt-1">Navigation</div>
        {navItems.map(({ label, to, icon: Icon, action, badge }, i) => {
          const NavIcon = Icon || defaultIcons[i] || BriefcaseIcon;
          return (
            <NavLink
              key={to}
              to={to}
              style={{ animationDelay: `${i * 0.05}s` }}
              className={({ isActive }) => {
                const base = 'w-full flex items-center gap-2.5 px-3 h-9 rounded-xl text-sm transition-all duration-200 relative overflow-hidden group animate-slide-in-l';
                if (action) return `${base} font-semibold`;
                if (isActive) return `${base} font-medium nav-active-glow`;
                return `${base} text-brand-text-muted hover:text-brand-text-primary`;
              }}>
              {({ isActive }) => (
                <>
                  {/* Active/action background */}
                  {action ? (
                    <span className="absolute inset-0 rounded-xl"
                      style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0.08) 100%)', border: '1px solid rgba(245,158,11,0.3)', boxShadow: '0 0 15px rgba(245,158,11,0.08)' }} />
                  ) : isActive ? (
                    <span className="absolute inset-0 rounded-xl"
                      style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(24,30,46,0.8) 100%)', border: '1px solid rgba(245,158,11,0.18)' }} />
                  ) : (
                    <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'rgba(24,30,46,0.7)' }} />
                  )}
                  {/* Hover shine */}
                  <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.03) 50%, transparent 60%)' }} />
                  <span className={`relative ${action ? 'text-brand-accent' : isActive ? 'text-brand-accent' : 'text-brand-text-disabled group-hover:text-brand-text-muted'} transition-colors`}>
                    <NavIcon size={15} />
                  </span>
                  <span className={`relative font-medium ${action ? 'text-brand-accent' : isActive ? 'text-brand-text-primary' : ''}`}>{label}</span>
                  {badge != null && !action && (
                    <span className="ml-auto relative text-[10px] font-mono text-brand-text-disabled">{badge}</span>
                  )}
                  {action && (
                    <span className="ml-auto relative w-4 h-4 rounded-full text-brand-accent flex items-center justify-center"
                      style={{ background: 'rgba(245,158,11,0.2)' }}>
                      <Plus size={8} strokeWidth={3} />
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
        {extra}
      </nav>

      {/* User footer */}
      <div className="p-3 shrink-0" style={{ borderTop: '1px solid rgba(35,42,62,0.6)' }}>
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl cursor-pointer group transition-all duration-200"
          style={{ border: '1px solid transparent' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(35,42,62,0.7)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
          <Avatar name={displayName} size={32} />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-brand-text-primary truncate">{displayName}</div>
            <div className="text-[11px] text-brand-text-disabled truncate font-mono">{user?.role || 'User'}</div>
          </div>
          <button onClick={onLogout}
            className="w-7 h-7 rounded-lg grid place-items-center text-brand-text-disabled hover:text-red-400 hover:bg-red-400/10 transition-all shrink-0"
            title="Logout">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}

/* ── Dashboard Layout ──────────────────────────────────────────────── */
export default function DashboardLayout({ navItems = [], sidebarExtra = null }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen" style={{ background: '#090C14' }}>
      <Sidebar navItems={navItems} user={user} onLogout={handleLogout} extra={sidebarExtra} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
}
