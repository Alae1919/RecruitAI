import React from 'react';
import { ArrowRight, ArrowLeft, MapPin, DollarSign } from 'lucide-react';
import { SectionCard } from './shared';

const BackIcon   = ({ size = 14 }) => <ArrowLeft size={size} />;
const MapPinIcon = ({ size = 13 }) => <MapPin size={size} />;
const DollarIcon = ({ size = 13 }) => <DollarSign size={size} />;

export default function StepPreview({ data, onBack, onPublish, onSaveDraft, publishing }) {
  return (
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
            <span className="flex items-center gap-1.5"><MapPinIcon />{data.location || 'Location TBD'}</span>
            <span>{data.type}</span>
            {data.salary_range && <span className="flex items-center gap-1.5"><DollarIcon />{data.salary_range}</span>}
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
                    style={{ background: 'rgba(35,42,62,0.6)', border: '1px solid rgba(35,42,62,0.8)' }}>{s}</span>
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
                    style={{ background: 'rgba(35,42,62,0.6)', border: '1px solid rgba(35,42,62,0.8)' }}>{s}</span>
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
        <button type="button" onClick={onBack}
          className="h-9 px-3 text-sm rounded-xl text-brand-text-muted inline-flex items-center gap-1.5 transition-all"
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(35,42,62,0.6)'; e.currentTarget.style.color = '#EEF0F8'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ''; }}>
          <BackIcon /> Back
        </button>
        <div className="flex gap-2">
          <button type="button" onClick={onSaveDraft} disabled={publishing}
            className="h-9 px-4 text-sm rounded-xl text-brand-text-primary transition-all disabled:opacity-50"
            style={{ border: '1px solid rgba(35,42,62,0.8)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(35,42,62,0.5)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            Save as draft
          </button>
          <button type="button" onClick={onPublish} disabled={publishing}
            className="h-9 px-5 text-sm rounded-xl font-semibold inline-flex items-center gap-2 transition-all disabled:opacity-50 active:scale-[.98]"
            style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)', color: '#111827', boxShadow: '0 0 20px rgba(245,158,11,0.25)' }}>
            {publishing
              ? <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
              : <>Publish offer <ArrowRight /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
