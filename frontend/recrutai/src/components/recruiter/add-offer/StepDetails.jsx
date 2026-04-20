import React from 'react';
import { MapPin, DollarSign, Sparkles } from 'lucide-react';
import { Field, StepFooter, SectionCard } from './shared';

const MapPinIcon   = ({ size = 15 }) => <MapPin size={size} />;
const DollarIcon   = ({ size = 15 }) => <DollarSign size={size} />;
const SparklesIcon = ({ size = 10 }) => <Sparkles size={size} />;

export default function StepDetails({ data, setData, onBack, onNext }) {
  const set = (key, val) => setData(d => ({ ...d, [key]: val }));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-brand-text-primary">Role details</h2>
        <p className="text-sm text-brand-text-muted mt-1">Review and edit what AI drafted. You control every word.</p>
      </div>
      <SectionCard>
        <div className="p-6 space-y-5">
          <Field label="Job title" required value={data.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Senior Frontend Engineer" />
          <div className="grid grid-cols-3 gap-4">
            <Field label="Department" value={data.department} onChange={e => set('department', e.target.value)} />
            <Field label="Location" required value={data.location} onChange={e => set('location', e.target.value)} icon={MapPinIcon} placeholder="Remote / City" />
            <Field label="Employment type" as="select" value={data.type} onChange={e => set('type', e.target.value)}>
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract</option>
              <option>Internship</option>
            </Field>
          </div>
          <Field label="Salary range" value={data.salary_range} onChange={e => set('salary_range', e.target.value)} icon={DollarIcon} placeholder="e.g. 75,000 – 95,000 MAD/yr" />
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs font-medium text-brand-text-muted">Description</label>
              <button type="button" className="text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                style={{ color: '#F59E0B' }}
                onMouseEnter={e => e.currentTarget.style.color = '#FCD34D'}
                onMouseLeave={e => e.currentTarget.style.color = '#F59E0B'}>
                <SparklesIcon /> Rewrite with AI
              </button>
            </div>
            <textarea rows={7} value={data.description} onChange={e => set('description', e.target.value)}
              placeholder="Describe the role, responsibilities, and team…"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl text-brand-text-primary placeholder:text-brand-text-disabled outline-none transition-all resize-y"
              style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(35,42,62,0.8)'; }} />
          </div>
        </div>
      </SectionCard>
      <StepFooter onBack={onBack} onNext={onNext} />
    </div>
  );
}
