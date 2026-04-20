import React from 'react';

const PRESETS = {
  // offer statuses
  open:       { bg: 'rgba(16,185,129,0.1)',  color: '#6EE7B7', border: 'rgba(16,185,129,0.2)',  dot: '#34D399' },
  active:     { bg: 'rgba(16,185,129,0.1)',  color: '#6EE7B7', border: 'rgba(16,185,129,0.2)',  dot: '#34D399' },
  closed:     { bg: 'rgba(239,68,68,0.1)',   color: '#FCA5A5', border: 'rgba(239,68,68,0.2)',   dot: '#F87171' },
  paused:     { bg: 'rgba(245,158,11,0.1)',  color: '#FCD34D', border: 'rgba(245,158,11,0.2)',  dot: '#F59E0B' },
  draft:      { bg: 'rgba(35,42,62,0.6)',    color: '#9BA6C4', border: 'rgba(35,42,62,0.8)',    dot: '#59628A' },
  // application statuses
  pending:    { bg: 'rgba(245,158,11,0.1)',  color: '#FCD34D', border: 'rgba(245,158,11,0.2)',  dot: '#F59E0B' },
  accepted:   { bg: 'rgba(16,185,129,0.1)',  color: '#6EE7B7', border: 'rgba(16,185,129,0.2)',  dot: '#34D399' },
  rejected:   { bg: 'rgba(239,68,68,0.1)',   color: '#FCA5A5', border: 'rgba(239,68,68,0.2)',   dot: '#F87171' },
  // interview statuses
  available:  { bg: 'rgba(59,130,246,0.1)',  color: '#93C5FD', border: 'rgba(59,130,246,0.25)', dot: '#60A5FA' },
  completed:  { bg: 'rgba(16,185,129,0.1)',  color: '#6EE7B7', border: 'rgba(16,185,129,0.25)', dot: '#34D399' },
  evaluated:  { bg: 'rgba(16,185,129,0.1)',  color: '#6EE7B7', border: 'rgba(16,185,129,0.25)', dot: '#34D399' },
  processing: { bg: 'rgba(245,158,11,0.1)',  color: '#FCD34D', border: 'rgba(245,158,11,0.25)', dot: '#F59E0B' },
};

const FALLBACK = { bg: 'rgba(35,42,62,0.6)', color: '#9BA6C4', border: 'rgba(35,42,62,0.8)', dot: '#59628A' };

export default function StatusBadge({ status, label }) {
  const key = (status || '').toLowerCase();
  const s = PRESETS[key] ?? FALLBACK;
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {label ?? status ?? 'unknown'}
    </span>
  );
}
