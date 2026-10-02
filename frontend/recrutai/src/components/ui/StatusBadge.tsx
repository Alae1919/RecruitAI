import React from 'react';

export type BadgeStatus =
  | 'open' | 'active' | 'closed' | 'paused' | 'draft'
  | 'pending' | 'accepted' | 'rejected' | 'offer' | 'hired'
  | 'applied' | 'screening' | 'interview'
  | 'available' | 'completed' | 'evaluated' | 'processing';

interface BadgePreset {
  bg: string;
  color: string;
  border: string;
  dot: string;
}

const PRESETS: Record<BadgeStatus, BadgePreset> = {
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
  offer:      { bg: 'rgba(16,185,129,0.1)',  color: '#6EE7B7', border: 'rgba(16,185,129,0.2)',  dot: '#34D399' },
  hired:      { bg: 'rgba(139,92,246,0.12)', color: '#C4B5FD', border: 'rgba(139,92,246,0.25)', dot: '#A78BFA' },
  // recruiter pipeline stages
  applied:    { bg: 'rgba(35,42,62,0.6)',    color: '#9BA6C4', border: 'rgba(35,42,62,0.8)',    dot: '#59628A' },
  screening:  { bg: 'rgba(56,189,248,0.1)',  color: '#7DD3FC', border: 'rgba(56,189,248,0.25)', dot: '#38BDF8' },
  interview:  { bg: 'rgba(245,158,11,0.1)',  color: '#FCD34D', border: 'rgba(245,158,11,0.25)', dot: '#F59E0B' },
  // interview statuses
  available:  { bg: 'rgba(59,130,246,0.1)',  color: '#93C5FD', border: 'rgba(59,130,246,0.25)', dot: '#60A5FA' },
  completed:  { bg: 'rgba(16,185,129,0.1)',  color: '#6EE7B7', border: 'rgba(16,185,129,0.25)', dot: '#34D399' },
  evaluated:  { bg: 'rgba(16,185,129,0.1)',  color: '#6EE7B7', border: 'rgba(16,185,129,0.25)', dot: '#34D399' },
  processing: { bg: 'rgba(245,158,11,0.1)',  color: '#FCD34D', border: 'rgba(245,158,11,0.25)', dot: '#F59E0B' },
};

const FALLBACK: BadgePreset = { bg: 'rgba(35,42,62,0.6)', color: '#9BA6C4', border: 'rgba(35,42,62,0.8)', dot: '#59628A' };

interface StatusBadgeProps {
  status?: BadgeStatus | string;
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const key = (status || '') as BadgeStatus;
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
