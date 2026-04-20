import React from 'react';

export default function MatchBar({ score }) {
  const color = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="h-1 flex-1 rounded-full overflow-hidden" style={{ background: 'rgba(35,42,62,0.8)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono font-bold" style={{ color }}>{score}%</span>
    </div>
  );
}
