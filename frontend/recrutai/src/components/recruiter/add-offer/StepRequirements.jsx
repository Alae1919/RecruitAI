import React from 'react';
import { SkillsEditor, StepFooter, SectionCard } from './shared';

export default function StepRequirements({ data, setData, onBack, onNext }) {
  const set = (key, val) => setData(d => ({ ...d, [key]: val }));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-brand-text-primary">Requirements</h2>
        <p className="text-sm text-brand-text-muted mt-1">AI uses these to score and rank candidates automatically.</p>
      </div>
      <SectionCard>
        <div className="p-6 space-y-5">
          <SkillsEditor label="Must-have skills" hint="AI will require these for match scoring" skills={data.mustSkills} onChange={s => set('mustSkills', s)} />
          <SkillsEditor label="Nice-to-have" hint="Bonus signal, not a deal-breaker" skills={data.niceSkills} onChange={s => set('niceSkills', s)} />
          <div>
            <label className="block text-xs font-medium text-brand-text-muted mb-2">Experience required</label>
            <div className="flex items-center gap-3">
              {[{ label: 'Min', key: 'yearsMin' }, { label: 'Max', key: 'yearsMax' }].map(({ label, key }, i) => (
                <React.Fragment key={key}>
                  {i > 0 && <span className="text-brand-text-disabled font-mono">—</span>}
                  <div className="h-10 px-3 rounded-xl flex items-center gap-2 flex-1"
                    style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)' }}>
                    <span className="text-brand-text-disabled text-xs">{label}</span>
                    <input type="number" value={data[key]} onChange={e => set(key, +e.target.value)}
                      className="bg-transparent text-sm w-full outline-none text-brand-text-primary" />
                    <span className="text-xs text-brand-text-disabled">yrs</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>
      <StepFooter onBack={onBack} onNext={onNext} />
    </div>
  );
}
