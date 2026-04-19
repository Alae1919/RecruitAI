import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from './ThemeToggle';

export default function DashboardHeader({ navItems = [], brandLabel = 'RecrutAI' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.first_name
    ? `${user.first_name[0]}${user.last_name?.[0] || ''}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-brand-surface/80 backdrop-blur-md border-b border-surface-border dark:border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
        {/* Brand */}
        <span className="text-base font-bold tracking-tight text-gray-900 dark:text-brand-text-primary shrink-0">
          {brandLabel}
          <span className="text-brand-accent">.</span>
        </span>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {navItems.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-brand-accent/10 text-brand-accent'
                    : 'text-gray-600 dark:text-brand-text-muted hover:bg-gray-100 dark:hover:bg-brand-elevated hover:text-gray-900 dark:hover:text-brand-text-primary'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">
          <ThemeToggle />

          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center text-xs font-bold text-gray-900 shrink-0">
            {initials}
          </div>

          {/* Logout — desktop */}
          <button
            onClick={handleLogout}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 dark:text-brand-text-muted hover:text-gray-900 dark:hover:text-brand-text-primary hover:bg-gray-100 dark:hover:bg-brand-elevated rounded-lg transition-all duration-150"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>

          {/* Mobile burger */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 dark:text-brand-text-muted hover:bg-gray-100 dark:hover:bg-brand-elevated transition-colors"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {menuOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>
              }
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {menuOpen && (
        <div className="md:hidden border-t border-surface-border dark:border-brand-border bg-white dark:bg-brand-surface px-4 py-3 space-y-1 animate-slideDown">
          {navItems.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-accent/10 text-brand-accent'
                    : 'text-gray-700 dark:text-brand-text-muted hover:bg-gray-100 dark:hover:bg-brand-elevated'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
}
