import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react';

const ThemeContext = createContext(null);

const ACCENTS = ['amber', 'blue'];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [accent, setAccent] = useState(() => {
    const stored = localStorage.getItem('accent');
    return ACCENTS.includes(stored) ? stored : 'amber';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Layout effect so the accent is on <html> before the first paint (no amber flash for blue users).
  useLayoutEffect(() => {
    document.documentElement.dataset.accent = accent;
    localStorage.setItem('accent', accent);
  }, [accent]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  const toggleAccent = () => setAccent(a => (a === 'amber' ? 'blue' : 'amber'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark', accent, setAccent, toggleAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
