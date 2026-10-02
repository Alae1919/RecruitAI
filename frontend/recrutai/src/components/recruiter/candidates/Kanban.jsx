import React, { useState } from 'react';
import Avatar from '../../ui/Avatar';
import MatchRing from './MatchRing';
import { STAGES, STAGE_META, canDrop, dropTargetFor } from './stages';
import { timeAgo } from '../../../shared/utils/time';

/**
 * Pipeline board. Cards open the detail on click and can be dragged one stage forward
 * (the same action as the detail's primary button, which remains the keyboard path).
 */
export default function Kanban({ candidates, onSelect, onAdvance, busyId }) {
  const [dragging, setDragging] = useState(null); // the candidate being dragged
  const [over, setOver] = useState(null);         // column currently hovered

  const rejected = candidates.filter(c => c.stage === 'rejected').length;
  const endDrag = () => { setDragging(null); setOver(null); };

  return (
    <div className="flex-1 overflow-x-auto">
      <div className="p-6 flex gap-4 min-w-max">
        {STAGES.map(stage => {
          const col = candidates.filter(c => c.stage === stage);
          const meta = STAGE_META[stage];
          const droppable = !!dragging && canDrop(dragging.stage, stage);
          const hovered = droppable && over === stage;
          return (
            <section key={stage} aria-label={`${meta.label} column`}
              onDragOver={e => { if (droppable) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOver(stage); } }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(o => (o === stage ? null : o)); }}
              onDrop={e => { e.preventDefault(); const c = dragging; endDrag(); if (c && canDrop(c.stage, stage)) onAdvance(c); }}
              className="w-[300px] shrink-0 flex flex-col rounded-2xl overflow-hidden transition-colors"
              style={{
                border: `1px solid ${hovered ? 'rgba(245,158,11,0.7)' : droppable ? 'rgba(245,158,11,0.3)' : 'rgba(35,42,62,0.8)'}`,
                background: hovered ? 'rgba(245,158,11,0.06)' : 'rgba(16,20,32,0.7)',
                opacity: dragging && !droppable && dragging.stage !== stage ? 0.55 : 1,
              }}>
              <div className="px-4 py-3 flex items-center gap-2"
                style={{ borderBottom: '1px solid rgba(35,42,62,0.7)' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: meta.dot }} />
                <h3 className="text-sm font-semibold text-brand-text-primary">{meta.label}</h3>
                <span className="text-[10px] font-mono text-brand-text-disabled bg-black/20 px-1.5 py-0.5 rounded-full">{col.length}</span>
              </div>
              <div className="flex-1 p-3 space-y-2 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                {col.map(c => {
                  const movable = dropTargetFor(c.stage) !== null;
                  return (
                    <button key={c.id} onClick={() => onSelect(c)}
                      draggable={movable && busyId !== c.id}
                      onDragStart={e => { setDragging(c); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(c.id)); }}
                      onDragEnd={endDrag}
                      aria-roledescription={movable ? 'draggable card' : undefined}
                      className={`w-full text-left p-3 rounded-xl transition-all hover:border-amber-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 ${movable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${dragging?.id === c.id ? 'opacity-40' : ''}`}
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
                  );
                })}
                {col.length === 0 && (
                  <div className="h-16 rounded-xl grid place-items-center text-[11px] text-brand-text-disabled"
                    style={{ border: `1.5px dashed ${droppable ? 'rgba(245,158,11,0.5)' : 'rgba(35,42,62,0.6)'}` }}>
                    {droppable ? 'Drop here' : 'No candidates'}
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
