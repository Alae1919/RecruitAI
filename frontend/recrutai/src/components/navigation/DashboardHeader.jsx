import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ThemeToggle from './ThemeToggle';
import { LogOut, Menu, X } from 'lucide-react';

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
            <LogOut size={14} />
            Logout
          </button>

          {/* Mobile burger */}
          <button
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-gray-600 dark:text-brand-text-muted hover:bg-gray-100 dark:hover:bg-brand-elevated transition-colors"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
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
