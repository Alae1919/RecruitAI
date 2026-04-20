import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { draftOffer } from '../../../shared/api/aiDraft';
import { SectionCard } from './shared';

const SparklesIcon = ({ size = 13 }) => <Sparkles size={size} />;

export default function StepDescribe({ onDrafted, onSkip }) {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const draft = await draftOffer(prompt);
      onDrafted(draft);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium mb-4"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}>
          <SparklesIcon size={11} /> AI-first drafting
        </span>
        <h2 className="text-3xl font-bold tracking-tight text-brand-text-primary">
          Describe the role.<br />
          <span className="text-brand-text-muted font-normal">We'll draft the rest.</span>
        </h2>
      </div>

      <SectionCard>
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid rgba(35,42,62,0.6)' }}>
          <div className="text-[10px] font-mono text-brand-text-disabled uppercase tracking-widest">Role brief · plain English</div>
          <span className="px-2 h-5 rounded text-[10px] font-mono text-brand-text-disabled"
            style={{ background: 'rgba(35,42,62,0.6)', border: '1px solid rgba(35,42,62,0.8)' }}>
            claude-sonnet
          </span>
        </div>
        <textarea rows={6} value={prompt} onChange={e => setPrompt(e.target.value)}
          className="w-full bg-transparent p-5 text-sm text-brand-text-primary placeholder:text-brand-text-disabled resize-none outline-none"
          placeholder="e.g. Senior backend engineer, 5+ years Go, Paris hybrid, €80–100k…"
          onKeyDown={e => e.key === 'Enter' && e.ctrlKey && generate()} />
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ borderTop: '1px solid rgba(35,42,62,0.6)' }}>
          <div className="text-xs text-brand-text-disabled">Generates: title · description · requirements · questions</div>
          <button type="button" onClick={generate} disabled={generating || !prompt.trim()}
            className="h-9 px-4 text-sm rounded-xl font-semibold inline-flex items-center gap-2 transition-all disabled:opacity-50 active:scale-[.98]"
            style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)', color: '#111827', boxShadow: '0 0 20px rgba(245,158,11,0.25)' }}>
            {generating
              ? <><div className="w-3.5 h-3.5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" /> Drafting…</>
              : <>Draft with AI <SparklesIcon /></>}
          </button>
        </div>
      </SectionCard>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: 'rgba(35,42,62,0.8)' }} />
        <span className="text-[10px] font-mono text-brand-text-disabled">OR</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(35,42,62,0.8)' }} />
      </div>

      <button type="button" onClick={onSkip}
        className="w-full py-4 rounded-xl text-sm text-brand-text-muted transition-all"
        style={{ border: '1.5px dashed rgba(35,42,62,0.8)' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.25)'; e.currentTarget.style.color = '#EEF0F8'; e.currentTarget.style.background = 'rgba(245,158,11,0.02)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(35,42,62,0.8)'; e.currentTarget.style.color = ''; e.currentTarget.style.background = 'transparent'; }}>
        Start from scratch →
      </button>
    </div>
  );
}
