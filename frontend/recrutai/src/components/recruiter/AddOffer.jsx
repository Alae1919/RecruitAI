import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createJobOffer } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { ArrowRight, ArrowLeft, Check, Sparkles, X, MapPin, DollarSign, Brain, Bell } from 'lucide-react';

const BackIcon     = ({ size = 14 }) => <ArrowLeft size={size} />;
const CheckIcon    = ({ size = 10 }) => <Check size={size} strokeWidth={3} />;
const SparklesIcon = ({ size = 13 }) => <Sparkles size={size} />;
const XIcon        = ({ size = 10 }) => <X size={size} />;
const MapPinIcon   = ({ size = 15 }) => <MapPin size={size} />;
const DollarIcon   = ({ size = 15 }) => <DollarSign size={size} />;
const BrainIcon    = ({ size = 15 }) => <Brain size={size} />;
const BellIcon     = ({ size = 15 }) => <Bell size={size} />;

/* ── Inline field ───────────────────────────────────────────────────── */
function Field({ label, required, hint, error, icon: Icon, as = 'input', children, className = '', ...rest }) {
  const Tag = as;
  const base = {
    background: '#101420',
    border: '1px solid rgba(35,42,62,0.8)',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
  };

  const handleFocus = (e) => {
    e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)';
    e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.02), 0 0 0 3px rgba(245,158,11,0.07)';
  };
  const handleBlur = (e) => {
    e.currentTarget.style.borderColor = 'rgba(35,42,62,0.8)';
    e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.02)';
  };

  const commonProps = {
    style: base,
    onFocus: handleFocus,
    onBlur: handleBlur,
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
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-disabled pointer-events-none"><Icon /></div>
        )}
        {as === 'select' ? (
          <select {...commonProps}>{children}</select>
        ) : as === 'textarea' ? (
          <textarea {...commonProps} />
        ) : (
          <input {...commonProps} />
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-[11px] text-brand-text-disabled">{hint}</p>}
    </div>
  );
}

/* ── Toggle ─────────────────────────────────────────────────────────── */
function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative h-5 w-9 rounded-full transition-all shrink-0"
      style={{
        background: checked ? '#F59E0B' : 'rgba(35,42,62,0.8)',
        border: `1px solid ${checked ? '#F59E0B' : 'rgba(35,42,62,1)'}`,
        boxShadow: checked ? '0 0 10px rgba(245,158,11,0.3)' : 'none',
      }}
    >
      <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform"
        style={{ transform: checked ? 'translateX(16px)' : 'translateX(2px)' }} />
    </button>
  );
}

/* ── Skills editor ──────────────────────────────────────────────────── */
function SkillsEditor({ label, hint, skills, onChange }) {
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
        <input
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={skills.length ? '' : 'Type a skill and press Enter'}
          className="flex-1 min-w-[140px] bg-transparent text-sm px-2 h-7 outline-none text-brand-text-primary placeholder:text-brand-text-disabled"
        />
      </div>
      {hint && <p className="text-[11px] text-brand-text-disabled mt-1">{hint}</p>}
    </div>
  );
}

/* ── Step footer ────────────────────────────────────────────────────── */
function StepFooter({ onBack, onNext, nextLabel = 'Continue', loading = false }) {
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

/* ── Stepper ────────────────────────────────────────────────────────── */
function Stepper({ steps, current }) {
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

/* ── Section card ───────────────────────────────────────────────────── */
function SectionCard({ children, className = '' }) {
  return (
    <div className={`rounded-2xl overflow-hidden ${className}`}
      style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
      {children}
    </div>
  );
}

const STEPS = ['Describe', 'Details', 'Requirements', 'Screening', 'Preview'];

const EMPTY = {
  title: '', department: 'Engineering', location: '', type: 'Full-time',
  salary_range: '', description: '', requirements: '',
  mustSkills: [], niceSkills: [], yearsMin: 3, yearsMax: 8,
  screening: { cv: true, cover: false, video: true, questions: 3 },
};

export default function AddOffer() {
  const [step, setStep] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [data, setData] = useState(EMPTY);
  const [publishing, setPublishing] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();

  const generate = () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      const words = prompt.split(' ');
      setData(d => ({
        ...d,
        title: words.slice(0, 4).join(' '),
        location: 'Remote',
        description: `We're looking for a ${words.slice(0, 4).join(' ')} to join our growing team.\n\nYou'll work closely with Product, Design, and Engineering. You'll ship fast, mentor peers, and help us build something people actually want to use.`,
        mustSkills: ['Communication', 'Problem solving', 'Collaboration'],
        niceSkills: ['Startup experience'],
      }));
      setGenerating(false);
      setStep(1);
    }, 1400);
  };

  const handlePublish = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { toast.error('Authentication required.'); return; }
    setPublishing(true);
    try {
      await createJobOffer({
        title: data.title,
        description: data.description,
        requirements: [...data.mustSkills, ...data.niceSkills].join(', ') || data.requirements,
        salary_range: data.salary_range,
        location: data.location,
      }, token);
      toast.success('Offer published!');
      navigate('/recruiter-dashboard/view-offers');
    } catch {
      toast.error('Failed to publish offer. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex-1 animate-fadeIn">
      {/* Topbar */}
      <div className="h-14 px-6 flex items-center gap-3 sticky top-0 z-20"
        style={{ borderBottom: '1px solid rgba(35,42,62,0.7)', background: 'rgba(9,12,20,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-mono text-brand-text-disabled mb-0.5">Job offers / new</div>
          <h1 className="text-[15px] font-semibold text-brand-text-primary">New job offer</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-lg text-brand-text-muted grid place-items-center transition-colors"
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(35,42,62,0.6)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <BellIcon />
          </button>
          <button onClick={() => navigate('/recruiter-dashboard/view-offers')}
            className="h-8 px-3 text-xs rounded-lg text-brand-text-muted transition-all"
            style={{ border: '1px solid rgba(35,42,62,0.7)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(35,42,62,0.5)'; e.currentTarget.style.color = '#EEF0F8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ''; }}>
            Cancel
          </button>
        </div>
      </div>

      <div className="max-w-[980px] mx-auto px-8 py-8">
        <Stepper steps={STEPS} current={step} />

        {/* ── Step 0: Describe ── */}
        {step === 0 && (
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
              <textarea
                rows={6}
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                className="w-full bg-transparent p-5 text-sm text-brand-text-primary placeholder:text-brand-text-disabled resize-none outline-none"
                placeholder="e.g. Senior backend engineer, 5+ years Go, Paris hybrid, €80–100k…"
                onKeyDown={e => e.key === 'Enter' && e.ctrlKey && generate()}
              />
              <div className="px-5 py-4 flex items-center justify-between"
                style={{ borderTop: '1px solid rgba(35,42,62,0.6)' }}>
                <div className="text-xs text-brand-text-disabled">Generates: title · description · requirements · questions</div>
                <button
                  type="button"
                  onClick={generate}
                  disabled={generating || !prompt.trim()}
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

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full py-4 rounded-xl text-sm text-brand-text-muted transition-all"
              style={{ border: '1.5px dashed rgba(35,42,62,0.8)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.25)'; e.currentTarget.style.color = '#EEF0F8'; e.currentTarget.style.background = 'rgba(245,158,11,0.02)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(35,42,62,0.8)'; e.currentTarget.style.color = ''; e.currentTarget.style.background = 'transparent'; }}>
              Start from scratch →
            </button>
          </div>
        )}

        {/* ── Step 1: Details ── */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-brand-text-primary">Role details</h2>
              <p className="text-sm text-brand-text-muted mt-1">Review and edit what AI drafted. You control every word.</p>
            </div>
            <SectionCard>
              <div className="p-6 space-y-5">
                <Field label="Job title" required value={data.title} onChange={e => setData({ ...data, title: e.target.value })} placeholder="e.g. Senior Frontend Engineer" />
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Department" value={data.department} onChange={e => setData({ ...data, department: e.target.value })} />
                  <Field label="Location" required value={data.location} onChange={e => setData({ ...data, location: e.target.value })} icon={MapPinIcon} placeholder="Remote / City" />
                  <Field label="Employment type" as="select" value={data.type} onChange={e => setData({ ...data, type: e.target.value })}>
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                  </Field>
                </div>
                <Field label="Salary range" value={data.salary_range} onChange={e => setData({ ...data, salary_range: e.target.value })} icon={DollarIcon} placeholder="e.g. 75,000 – 95,000 MAD/yr" />
                <div>
                  <div className="flex justify-between mb-1.5">
                    <label className="text-xs font-medium text-brand-text-muted">Description</label>
                    <button type="button" className="text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                      style={{ color: '#F59E0B' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#FCD34D'}
                      onMouseLeave={e => e.currentTarget.style.color = '#F59E0B'}>
                      <SparklesIcon size={10} /> Rewrite with AI
                    </button>
                  </div>
                  <textarea
                    rows={7}
                    value={data.description}
                    onChange={e => setData({ ...data, description: e.target.value })}
                    placeholder="Describe the role, responsibilities, and team…"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl text-brand-text-primary placeholder:text-brand-text-disabled outline-none transition-all resize-y"
                    style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)' }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'rgba(35,42,62,0.8)'; }}
                  />
                </div>
              </div>
            </SectionCard>
            <StepFooter onBack={() => setStep(0)} onNext={() => setStep(2)} />
          </div>
        )}

        {/* ── Step 2: Requirements ── */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-brand-text-primary">Requirements</h2>
              <p className="text-sm text-brand-text-muted mt-1">AI uses these to score and rank candidates automatically.</p>
            </div>
            <SectionCard>
              <div className="p-6 space-y-5">
                <SkillsEditor label="Must-have skills" hint="AI will require these for match scoring" skills={data.mustSkills} onChange={s => setData({ ...data, mustSkills: s })} />
                <SkillsEditor label="Nice-to-have" hint="Bonus signal, not a deal-breaker" skills={data.niceSkills} onChange={s => setData({ ...data, niceSkills: s })} />
                <div>
                  <label className="block text-xs font-medium text-brand-text-muted mb-2">Experience required</label>
                  <div className="flex items-center gap-3">
                    {[
                      { label: 'Min', key: 'yearsMin' },
                      { label: 'Max', key: 'yearsMax' },
                    ].map(({ label, key }, i) => (
                      <React.Fragment key={key}>
                        {i > 0 && <span className="text-brand-text-disabled font-mono">—</span>}
                        <div className="h-10 px-3 rounded-xl flex items-center gap-2 flex-1"
                          style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)' }}>
                          <span className="text-brand-text-disabled text-xs">{label}</span>
                          <input
                            type="number"
                            value={data[key]}
                            onChange={e => setData({ ...data, [key]: +e.target.value })}
                            className="bg-transparent text-sm w-full outline-none text-brand-text-primary"
                          />
                          <span className="text-xs text-brand-text-disabled">yrs</span>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
            <StepFooter onBack={() => setStep(1)} onNext={() => setStep(3)} />
          </div>
        )}

        {/* ── Step 3: Screening ── */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-brand-text-primary">Screening</h2>
              <p className="text-sm text-brand-text-muted mt-1">What should candidates submit? AI handles the evaluation.</p>
            </div>
            <SectionCard>
              {[
                { k: 'cv',    t: 'Resume / CV',          s: 'Parsed and scored automatically.', required: true },
                { k: 'cover', t: 'Cover letter',          s: 'AI flags generic or LLM-written letters.' },
                { k: 'video', t: 'Async video interview', s: '3–5 AI-generated questions; responses scored for signal.' },
              ].map((r, i) => (
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
                  <Toggle
                    checked={data.screening[r.k]}
                    onChange={v => !r.required && setData({ ...data, screening: { ...data.screening, [r.k]: v } })}
                  />
                </div>
              ))}
              {data.screening.video && (
                <div className="px-6 py-4 flex items-center justify-between"
                  style={{ borderTop: '1px solid rgba(35,42,62,0.5)', background: 'rgba(245,158,11,0.03)' }}>
                  <div className="flex items-center gap-2 text-xs text-brand-text-muted">
                    <SparklesIcon size={12} /> AI will generate questions per candidate
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-brand-text-muted">Questions:</span>
                    <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid rgba(35,42,62,0.8)' }}>
                      {[3, 5, 7].map(n => (
                        <button key={n} type="button"
                          onClick={() => setData({ ...data, screening: { ...data.screening, questions: n } })}
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

            {/* AI auto-shortlist */}
            <div className="rounded-2xl p-5" style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-lg grid place-items-center shrink-0"
                  style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                  <BrainIcon />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-brand-text-primary">AI auto-shortlist</div>
                  <div className="text-xs text-brand-text-muted mt-0.5">Auto-move candidates with match ≥ 75 into Screening stage.</div>
                </div>
                <Toggle checked={true} onChange={() => {}} />
              </div>
            </div>
            <StepFooter onBack={() => setStep(2)} onNext={() => setStep(4)} />
          </div>
        )}

        {/* ── Step 4: Preview ── */}
        {step === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-brand-text-primary">Preview</h2>
              <p className="text-sm text-brand-text-muted mt-1">This is how candidates will see your job.</p>
            </div>
            <SectionCard>
              <div className="p-8" style={{ borderBottom: '1px solid rgba(35,42,62,0.6)' }}>
                <div className="text-[10px] font-mono text-brand-text-disabled uppercase tracking-widest mb-2">{data.department}</div>
                <h1 className="text-3xl font-extrabold tracking-tight text-brand-text-primary">{data.title || 'Untitled role'}</h1>
                <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-sm text-brand-text-muted">
                  <span className="flex items-center gap-1.5"><MapPinIcon size={13} />{data.location || 'Location TBD'}</span>
                  <span>{data.type}</span>
                  {data.salary_range && <span className="flex items-center gap-1.5"><DollarIcon size={13} />{data.salary_range}</span>}
                </div>
              </div>
              <div className="p-8 space-y-6">
                {data.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-brand-text-primary mb-2">About the role</h3>
                    <p className="text-sm text-brand-text-muted leading-relaxed whitespace-pre-line">{data.description}</p>
                  </div>
                )}
                {data.mustSkills.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-brand-text-primary mb-2">Must have</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {data.mustSkills.map(s => (
                        <span key={s} className="inline-flex items-center px-2.5 h-7 rounded-lg text-xs font-medium text-brand-text-muted"
                          style={{ background: 'rgba(35,42,62,0.6)', border: '1px solid rgba(35,42,62,0.8)' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {data.niceSkills.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-brand-text-primary mb-2">Nice to have</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {data.niceSkills.map(s => (
                        <span key={s} className="inline-flex items-center px-2.5 h-7 rounded-lg text-xs font-medium text-brand-text-muted"
                          style={{ background: 'rgba(35,42,62,0.6)', border: '1px solid rgba(35,42,62,0.8)' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="text-xs font-mono text-brand-text-disabled pt-4"
                  style={{ borderTop: '1px solid rgba(35,42,62,0.6)' }}>
                  Experience · {data.yearsMin}–{data.yearsMax} yrs
                </div>
              </div>
            </SectionCard>

            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setStep(3)}
                className="h-9 px-3 text-sm rounded-xl text-brand-text-muted inline-flex items-center gap-1.5 transition-all"
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(35,42,62,0.6)'; e.currentTarget.style.color = '#EEF0F8'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ''; }}>
                <BackIcon /> Back
              </button>
              <div className="flex gap-2">
                <button type="button"
                  className="h-9 px-4 text-sm rounded-xl text-brand-text-primary transition-all"
                  style={{ border: '1px solid rgba(35,42,62,0.8)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(35,42,62,0.5)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  Save as draft
                </button>
                <button type="button" onClick={handlePublish} disabled={publishing}
                  className="h-9 px-5 text-sm rounded-xl font-semibold inline-flex items-center gap-2 transition-all disabled:opacity-50 active:scale-[.98]"
                  style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)', color: '#111827', boxShadow: '0 0 20px rgba(245,158,11,0.25)' }}>
                  {publishing
                    ? <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                    : <>Publish offer <ArrowRight /></>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
