import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`
        w-9 h-9 rounded-lg flex items-center justify-center
        text-gray-500 dark:text-brand-text-muted
        hover:bg-gray-100 dark:hover:bg-brand-elevated
        hover:text-gray-700 dark:hover:text-brand-text-primary
        transition-all duration-200
        ${className}
      `}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
