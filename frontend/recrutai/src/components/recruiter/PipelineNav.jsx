import React from 'react';
import { STAGES, STAGE_META } from './candidates/stages';

/** Sidebar block: how many candidates sit in each pipeline stage. */
export default function PipelineNav({ summary }) {
  return (
    <div className="px-3 mt-4">
      <div className="text-[10px] font-mono tracking-[0.18em] text-brand-text-disabled uppercase px-3 mb-2">Pipeline</div>
      <ul className="space-y-0.5">
        {STAGES.map(stage => (
          <li key={stage} className="flex items-center gap-2.5 px-3 h-8 rounded-lg text-xs text-brand-text-muted">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: STAGE_META[stage].dot }} />
            <span>{STAGE_META[stage].label}</span>
            <span className="ml-auto font-mono text-[10px] text-brand-text-disabled"
              aria-label={`${summary ? summary.stages[stage] : 0} candidates`}>
              {summary ? summary.stages[stage] : '–'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
