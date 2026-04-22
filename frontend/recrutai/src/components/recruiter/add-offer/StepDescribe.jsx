import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useGenerateJobDescription } from '../../../shared/hooks/useJobOffers';
import { SectionCard } from './shared';
import AsyncTaskBanner from '../../ui/AsyncTaskBanner';

const SparklesIcon = ({ size = 13 }) => <Sparkles size={size} />;

const EXPERIENCE_LEVELS = [
  { value: 'junior',    label: 'Junior (0–2 yrs)' },
  { value: 'mid',       label: 'Mid-level (2–5 yrs)' },
  { value: 'senior',    label: 'Senior (5–10 yrs)' },
  { value: 'lead',      label: 'Lead / Staff (10+ yrs)' },
  { value: 'executive', label: 'Executive / Director' },
];

export default function StepDescribe({ onDrafted, onSkip }) {
  const [title, setTitle]               = useState('');
  const [skillInput, setSkillInput]     = useState('');
  const [skills, setSkills]             = useState([]);
  const [experienceLevel, setExpLevel]  = useState('mid');
  const [bannerState, setBannerState]   = useState('idle');

  const generateMutation = useGenerateJobDescription();

  const addSkill = (raw) => {
    const trimmed = raw.trim().replace(/,$/, '');
    if (!trimmed) return;
    setSkills(prev => prev.includes(trimmed) ? prev : [...prev, trimmed]);
    setSkillInput('');
  };

  const handleSkillKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(skillInput); }
    if (e.key === 'Backspace' && !skillInput && skills.length) {
      setSkills(prev => prev.slice(0, -1));
    }
  };

  const generate = async () => {
    if (!title.trim() || skills.length === 0) return;
    setBannerState('pending');
    try {
      const result = await generateMutation.mutateAsync({
        title: title.trim(),
        skills,
        experience_level: experienceLevel,
      });
      setBannerState('success');
      onDrafted({ title: title.trim(), description: result.description });
    } catch {
      setBannerState('failed');
    }
  };

  const canGenerate = title.trim() && skills.length > 0 && bannerState !== 'pending';

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
          <div className="text-[10px] font-mono text-brand-text-disabled uppercase tracking-widest">Role details</div>
          <span className="px-2 h-5 rounded text-[10px] font-mono text-brand-text-disabled"
            style={{ background: 'rgba(35,42,62,0.6)', border: '1px solid rgba(35,42,62,0.8)' }}>
            deepseek-reasoner
          </span>
        </div>

        <div className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-[11px] font-medium text-brand-text-muted uppercase tracking-wider mb-1.5">
              Job title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              className="w-full h-9 px-3 rounded-lg text-sm text-brand-text-primary placeholder-brand-text-disabled outline-none"
              style={{ background: 'rgba(35,42,62,0.4)', border: '1px solid rgba(35,42,62,0.8)' }}
            />
          </div>

          {/* Skills */}
          <div>
            <label className="block text-[11px] font-medium text-brand-text-muted uppercase tracking-wider mb-1.5">
              Key skills <span className="text-red-400">*</span>
              <span className="ml-1 font-normal normal-case text-brand-text-disabled">(press Enter or comma to add)</span>
            </label>
            <div className="min-h-[40px] px-2 py-1.5 rounded-lg flex flex-wrap gap-1.5"
              style={{ background: 'rgba(35,42,62,0.4)', border: '1px solid rgba(35,42,62,0.8)' }}>
              {skills.map(s => (
                <span key={s} className="inline-flex items-center gap-1 h-6 px-2 rounded-md text-[11px] font-medium"
                  style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}>
                  {s}
                  <button onClick={() => setSkills(prev => prev.filter(x => x !== s))} className="ml-0.5 opacity-70 hover:opacity-100">
                    <X size={10} />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKey}
                onBlur={() => addSkill(skillInput)}
                placeholder={skills.length === 0 ? 'Go, PostgreSQL, Docker…' : ''}
                className="flex-1 min-w-[120px] bg-transparent text-sm text-brand-text-primary placeholder-brand-text-disabled outline-none h-6 px-1"
              />
            </div>
          </div>

          {/* Experience level */}
          <div>
            <label className="block text-[11px] font-medium text-brand-text-muted uppercase tracking-wider mb-1.5">
              Experience level
            </label>
            <select
              value={experienceLevel}
              onChange={e => setExpLevel(e.target.value)}
              className="w-full h-9 px-3 rounded-lg text-sm text-brand-text-primary outline-none appearance-none"
              style={{ background: 'rgba(35,42,62,0.4)', border: '1px solid rgba(35,42,62,0.8)' }}
            >
              {EXPERIENCE_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </div>

        {bannerState !== 'idle' && (
          <div className="px-5 pb-4">
            <AsyncTaskBanner
              state={bannerState}
              label="Drafting job description"
              onRetry={() => { setBannerState('idle'); }}
            />
          </div>
        )}

        <div className="px-5 py-4 flex items-center justify-between"
          style={{ borderTop: '1px solid rgba(35,42,62,0.6)' }}>
          <div className="text-xs text-brand-text-disabled">Generates title · description based on your inputs</div>
          <button type="button" onClick={generate} disabled={!canGenerate}
            className="h-9 px-4 text-sm rounded-xl font-semibold inline-flex items-center gap-2 transition-all disabled:opacity-50 active:scale-[.98]"
            style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)', color: '#111827', boxShadow: '0 0 20px rgba(245,158,11,0.25)' }}>
            {bannerState === 'pending'
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
