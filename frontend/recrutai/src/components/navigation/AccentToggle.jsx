import React from 'react';
import { useTheme } from '../../context/ThemeContext';

// The swatch shows the colour you would switch *to*, so it stays visible against the current accent.
const SWATCH = { amber: '#F59E0B', blue: '#3B82F6' };

export default function AccentToggle({ className = '' }) {
  const { accent, toggleAccent } = useTheme();
  const next = accent === 'amber' ? 'blue' : 'amber';

  return (
    <button
      type="button"
      onClick={toggleAccent}
      aria-label={`Switch to ${next} accent colour`}
      title={`Switch to ${next} accent`}
      className={`w-7 h-7 rounded-lg grid place-items-center shrink-0 transition-colors hover:bg-brand-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50 ${className}`}
    >
      <span
        className="block w-3.5 h-3.5 rounded-full"
        style={{ background: SWATCH[next], boxShadow: '0 0 0 2px rgba(35,42,62,0.9)' }}
      />
    </button>
  );
}
