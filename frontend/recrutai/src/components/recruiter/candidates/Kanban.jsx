import React from 'react';
import Avatar from '../../ui/Avatar';
import MatchRing from './MatchRing';
import { STAGES, STAGE_META } from './stages';
import { timeAgo } from '../../../shared/utils/time';

export default function Kanban({ candidates, onSelect }) {
  const rejected = candidates.filter(c => c.stage === 'rejected').length;

  return (
    <div className="flex-1 overflow-x-auto">
      <div className="p-6 flex gap-4 min-w-max">
        {STAGES.map(stage => {
          const col = candidates.filter(c => c.stage === stage);
          const meta = STAGE_META[stage];
          return (
            <section key={stage} aria-label={`${meta.label} column`}
              className="w-[300px] shrink-0 flex flex-col rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(35,42,62,0.8)', background: 'rgba(16,20,32,0.7)' }}>
              <div className="px-4 py-3 flex items-center gap-2"
                style={{ borderBottom: '1px solid rgba(35,42,62,0.7)' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: meta.dot }} />
                <h3 className="text-sm font-semibold text-brand-text-primary">{meta.label}</h3>
                <span className="text-[10px] font-mono text-brand-text-disabled bg-black/20 px-1.5 py-0.5 rounded-full">{col.length}</span>
              </div>
              <div className="flex-1 p-3 space-y-2 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                {col.map(c => (
                  <button key={c.id} onClick={() => onSelect(c)}
                    className="w-full text-left p-3 rounded-xl transition-all cursor-pointer hover:border-amber-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
                    style={{ background: 'rgba(24,30,46,0.7)', border: '1px solid rgba(35,42,62,0.7)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar name={c.candidate_name} size={28} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold truncate text-brand-text-primary">{c.candidate_name}</div>
                        <div className="text-[10px] text-brand-text-muted truncate">{c.headline || c.candidate_email || '—'}</div>
                      </div>
                      <MatchRing score={c.match_score} size={32} stroke={3} label={false} />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {(c.resume_profile?.skills ?? []).slice(0, 2).map(s => (
                        <span key={s} className="px-1.5 h-4 rounded text-[9px] font-mono leading-4 text-brand-text-muted"
                          style={{ background: 'rgba(16,20,32,0.9)', border: '1px solid rgba(35,42,62,0.8)' }}>{s}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-brand-text-disabled mt-2 pt-2"
                      style={{ borderTop: '1px solid rgba(35,42,62,0.6)' }}>
                      <span>{timeAgo(c.applied_at)}</span>
                      {c.match_score != null && <span className="font-bold text-brand-accent">{c.match_score}%</span>}
                    </div>
                  </button>
                ))}
                {col.length === 0 && (
                  <div className="h-16 rounded-xl grid place-items-center text-[11px] text-brand-text-disabled"
                    style={{ border: '1.5px dashed rgba(35,42,62,0.6)' }}>
                    No candidates
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
      {rejected > 0 && (
        <p className="px-6 pb-4 text-xs text-brand-text-disabled">{rejected} rejected candidate{rejected > 1 ? 's' : ''} not shown — use the list view's All tab.</p>
      )}
    </div>
  );
}
