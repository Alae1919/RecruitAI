import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, X } from 'lucide-react';

const BackIcon  = ({ size = 14 }) => <ArrowLeft size={size} />;
const CheckIcon = ({ size = 10 }) => <Check size={size} strokeWidth={3} />;
const XIcon     = ({ size = 10 }) => <X size={size} />;

const FIELD_BASE = {
  background: '#101420',
  border: '1px solid rgba(35,42,62,0.8)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
};
const onFocus = e => {
  e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)';
  e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.02), 0 0 0 3px rgba(245,158,11,0.07)';
};
const onBlur = e => {
  e.currentTarget.style.borderColor = 'rgba(35,42,62,0.8)';
  e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.02)';
};

export function Field({ label, required, hint, error, icon: Icon, as = 'input', children, className = '', ...rest }) {
  const commonProps = {
    style: FIELD_BASE,
    onFocus,
    onBlur,
    className: `w-full text-sm rounded-xl text-brand-text-primary placeholder:text-brand-text-disabled outline-none transition-all ${Icon ? 'pl-9 pr-3 py-2.5' : 'px-3.5 py-2.5'} ${as === 'textarea' ? 'resize-y min-h-[96px]' : ''} ${className}`,
    ...rest,
  };
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-xs font-medium text-brand-text-muted">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-disabled pointer-events-none"><Icon /></div>}
        {as === 'select' ? <select {...commonProps}>{children}</select>
          : as === 'textarea' ? <textarea {...commonProps} />
          : <input {...commonProps} />}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-[11px] text-brand-text-disabled">{hint}</p>}
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className="relative h-5 w-9 rounded-full transition-all shrink-0"
      style={{
        background: checked ? '#F59E0B' : 'rgba(35,42,62,0.8)',
        border: `1px solid ${checked ? '#F59E0B' : 'rgba(35,42,62,1)'}`,
        boxShadow: checked ? '0 0 10px rgba(245,158,11,0.3)' : 'none',
      }}>
      <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
        style={{ transform: checked ? 'translateX(16px)' : 'translateX(2px)' }} />
    </button>
  );
}

export function SkillsEditor({ label, hint, skills, onChange }) {
  const [val, setVal] = useState('');
  const add = () => {
    const v = val.trim();
    if (!v || skills.includes(v)) return;
    onChange([...skills, v]);
    setVal('');
  };
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-brand-text-muted">{label}</label>
      <div className="flex flex-wrap gap-1.5 p-2 min-h-[52px] rounded-xl"
        style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)' }}>
        {skills.map(s => (
          <span key={s} className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1.5 rounded-lg text-xs font-medium"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}>
            {s}
            <button type="button" onClick={() => onChange(skills.filter(x => x !== s))}
              className="w-4 h-4 rounded grid place-items-center"
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <XIcon />
            </button>
          </span>
        ))}
        <input value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={skills.length ? '' : 'Type a skill and press Enter'}
          className="flex-1 min-w-[140px] bg-transparent text-sm px-2 h-7 outline-none text-brand-text-primary placeholder:text-brand-text-disabled" />
      </div>
      {hint && <p className="text-[11px] text-brand-text-disabled mt-1">{hint}</p>}
    </div>
  );
}

export function StepFooter({ onBack, onNext, nextLabel = 'Continue', loading = false }) {
  return (
    <div className="flex items-center justify-between pt-4">
      <button type="button" onClick={onBack}
        className="h-9 px-3 text-sm rounded-xl text-brand-text-muted inline-flex items-center gap-1.5 transition-all"
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(35,42,62,0.6)'; e.currentTarget.style.color = '#EEF0F8'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ''; }}>
        <BackIcon /> Back
      </button>
      <button type="button" onClick={onNext} disabled={loading}
        className="h-9 px-5 text-sm rounded-xl font-semibold inline-flex items-center gap-2 transition-all disabled:opacity-50 active:scale-[.98]"
        style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)', color: '#111827', boxShadow: '0 0 20px rgba(245,158,11,0.25)' }}>
        {loading
          ? <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
          : <>{nextLabel} <ArrowRight /></>}
      </button>
    </div>
  );
}

export function Stepper({ steps, current }) {
  return (
    <div className="flex items-center gap-2 mb-10">
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <div className={`flex items-center gap-2 text-xs font-medium transition-colors ${i === current ? 'text-brand-accent' : i < current ? 'text-brand-text-primary' : 'text-brand-text-disabled'}`}>
            <span className="w-6 h-6 rounded-full grid place-items-center font-mono text-[10px] shrink-0 transition-all"
              style={i === current
                ? { background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)', color: '#111827', boxShadow: '0 0 14px rgba(245,158,11,0.4)' }
                : i < current
                  ? { background: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: '1px solid rgba(245,158,11,0.3)' }
                  : { background: 'rgba(35,42,62,0.6)', color: '#59628A', border: '1px solid rgba(35,42,62,0.8)' }}>
              {i < current ? <CheckIcon /> : i + 1}
            </span>
            <span className="hidden sm:block">{s}</span>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-px transition-colors"
              style={{ background: i < current ? 'rgba(245,158,11,0.4)' : 'rgba(35,42,62,0.8)' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export function SectionCard({ children, className = '' }) {
  return (
    <div className={`rounded-2xl overflow-hidden ${className}`}
      style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
      {children}
    </div>
  );
}
