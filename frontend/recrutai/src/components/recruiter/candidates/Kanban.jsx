import React from 'react';
import { Plus } from 'lucide-react';
import Avatar from '../../ui/Avatar';
import MatchBar from './MatchBar';

const STAGES = ['pending', 'accepted', 'rejected'];
const STAGE_CONFIG = {
  pending:  { label: 'Applied',  dot: '#F59E0B', header: 'rgba(245,158,11,0.08)' },
  accepted: { label: 'Accepted', dot: '#34D399', header: 'rgba(16,185,129,0.08)' },
  rejected: { label: 'Rejected', dot: '#F87171', header: 'rgba(239,68,68,0.08)' },
};

export default function Kanban({ candidates, onSelect }) {
  return (
    <div className="flex-1 overflow-x-auto">
      <div className="p-6 flex gap-4 min-w-max">
        {STAGES.map(stage => {
          const col = candidates.filter(c => (c.status || 'pending') === stage);
          const cfg = STAGE_CONFIG[stage];
          return (
            <div key={stage} className="w-[300px] shrink-0 flex flex-col rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(35,42,62,0.8)', background: 'rgba(16,20,32,0.7)' }}>
              <div className="px-4 py-3 flex items-center justify-between"
                style={{ background: cfg.header, borderBottom: '1px solid rgba(35,42,62,0.7)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
                  <span className="text-sm font-semibold text-brand-text-primary">{cfg.label}</span>
                  <span className="text-[10px] font-mono text-brand-text-disabled bg-black/20 px-1.5 py-0.5 rounded-full">{col.length}</span>
                </div>
                <button className="w-6 h-6 rounded-md grid place-items-center text-brand-text-disabled transition-colors"
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(35,42,62,0.8)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <Plus size={12} strokeWidth={2.5} />
                </button>
              </div>
              <div className="flex-1 p-3 space-y-2 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                {col.map(c => (
                  <button key={c.id} onClick={() => onSelect(c)}
                    className="w-full text-left p-3 rounded-xl transition-all cursor-pointer"
                    style={{ background: 'rgba(24,30,46,0.7)', border: '1px solid rgba(35,42,62,0.7)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; e.currentTarget.style.background = 'rgba(24,30,46,1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(35,42,62,0.7)'; e.currentTarget.style.background = 'rgba(24,30,46,0.7)'; }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar name={c.candidate_name} size={28} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold truncate text-brand-text-primary">{c.candidate_name}</div>
                        <div className="text-[10px] text-brand-text-muted truncate">{c.candidate_email || '—'}</div>
                      </div>
                    </div>
                    {c.cv_analysis_score != null && (
                      <div className="pt-2" style={{ borderTop: '1px solid rgba(35,42,62,0.6)' }}>
                        <MatchBar score={c.cv_analysis_score} />
                      </div>
                    )}
                  </button>
                ))}
                {col.length === 0 && (
                  <div className="h-16 rounded-xl grid place-items-center text-[11px] text-brand-text-disabled"
                    style={{ border: '1.5px dashed rgba(35,42,62,0.6)' }}>
                    No candidates
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
