import React from 'react';

const colorFor = (score) => (score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444');

/** Circular CV-match score (0-100). Renders an empty muted ring when unscored. */
export default function MatchRing({ score, size = 46, stroke = 4, label = true }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const scored = score != null;
  const pct = scored ? Math.max(0, Math.min(100, score)) : 0;
  const color = scored ? colorFor(pct) : '#59628A';

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}
      role="img" aria-label={scored ? `CV match ${pct} out of 100` : 'Not scored yet'}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(35,42,62,0.9)" strokeWidth={stroke} />
        {scored && (
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
            style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.2,.8,.2,1)' }} />
        )}
      </svg>
      {label && (
        <div className="absolute inset-0 grid place-items-center font-mono font-bold"
          style={{ color, fontSize: Math.max(9, size * 0.28) }}>
          {scored ? pct : '–'}
        </div>
      )}
    </div>
  );
}
