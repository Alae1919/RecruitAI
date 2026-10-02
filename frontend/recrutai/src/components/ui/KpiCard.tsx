import React from 'react';

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  sub?: string;
  loading?: boolean;
  accentColor?: string;
}

export default function KpiCard({ label, value, sub, loading, accentColor = 'var(--accent)' }: KpiCardProps) {
  return (
    <div className="rounded-xl p-5 relative overflow-hidden card-dark">
      <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl"
        style={{ background: `linear-gradient(90deg, color-mix(in srgb, ${accentColor} 38%, transparent) 0%, color-mix(in srgb, ${accentColor} 12%, transparent) 100%)` }} />
      <div className="text-[10px] font-mono uppercase tracking-widest text-brand-text-disabled">{label}</div>
      <div className="mt-2 text-3xl font-bold font-mono tracking-tight text-brand-text-primary">
        {loading
          ? <span className="inline-block w-12 h-8 rounded animate-pulse" style={{ background: 'rgba(35,42,62,0.8)' }} />
          : value}
      </div>
      {sub && <div className="text-[11px] text-brand-text-disabled mt-1">{sub}</div>}
    </div>
  );
}
