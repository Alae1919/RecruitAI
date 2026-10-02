import React from 'react';
import { Brain, Sparkles } from 'lucide-react';
import { Toggle, StepFooter, SectionCard } from './shared';

const BrainIcon    = ({ size = 15 }) => <Brain size={size} />;
const SparklesIcon = ({ size = 12 }) => <Sparkles size={size} />;

const REQUIREMENTS = [
  { k: 'cv',    t: 'Resume / CV',          s: 'Parsed and scored automatically.', required: true },
  { k: 'cover', t: 'Cover letter',          s: 'AI flags generic or LLM-written letters.' },
  { k: 'video', t: 'Async video interview', s: '3–5 AI-generated questions; responses scored for signal.' },
];

export default function StepScreening({ data, setData, onBack, onNext }) {
  const setScreening = (key, val) => setData(d => ({ ...d, screening: { ...d.screening, [key]: val } }));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-brand-text-primary">Screening</h2>
        <p className="text-sm text-brand-text-muted mt-1">What should candidates submit? AI handles the evaluation.</p>
      </div>
      <SectionCard>
        {REQUIREMENTS.map((r, i) => (
          <div key={r.k} className="px-6 py-4 flex items-center gap-4"
            style={{ borderBottom: i < 2 ? '1px solid rgba(35,42,62,0.6)' : 'none' }}>
            <div className="flex-1">
              <div className="text-sm font-semibold text-brand-text-primary flex items-center gap-2">
                {r.t}
                {r.required && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-brand-text-disabled"
                    style={{ background: 'rgba(35,42,62,0.6)', border: '1px solid rgba(35,42,62,0.8)' }}>
                    required
                  </span>
                )}
              </div>
              <div className="text-xs text-brand-text-muted mt-0.5">{r.s}</div>
            </div>
            <Toggle checked={data.screening[r.k]} onChange={v => !r.required && setScreening(r.k, v)} />
          </div>
        ))}
        {data.screening.video && (
          <div className="px-6 py-4 flex items-center justify-between"
            style={{ borderTop: '1px solid rgba(35,42,62,0.5)', background: 'rgba(245,158,11,0.03)' }}>
            <div className="flex items-center gap-2 text-xs text-brand-text-muted">
              <SparklesIcon /> AI will generate questions per candidate
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-brand-text-muted">Questions:</span>
              <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(35,42,62,0.8)' }}>
                {[3, 5, 7].map(n => (
                  <button key={n} type="button" onClick={() => setScreening('questions', n)}
                    className="w-9 h-7 text-xs font-mono transition-colors"
                    style={data.screening.questions === n
                      ? { background: '#F59E0B', color: '#111827' }
                      : { background: 'rgba(16,20,32,0.8)', color: '#9BA6C4' }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      <div className="rounded-2xl p-5" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
        <div className="flex gap-3 items-start">
          <div className="w-8 h-8 rounded-lg grid place-items-center shrink-0"
            style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
            <BrainIcon />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-brand-text-primary">AI auto-shortlist</div>
            <div className="text-xs text-brand-text-muted mt-0.5">Auto-move candidates with match ≥ 75 into the Screening stage.</div>
          </div>
          <Toggle label="AI auto-shortlist" checked={data.screening.auto_shortlist !== false} onChange={v => setScreening('auto_shortlist', v)} />
        </div>
      </div>
      <StepFooter onBack={onBack} onNext={onNext} />
    </div>
  );
}
