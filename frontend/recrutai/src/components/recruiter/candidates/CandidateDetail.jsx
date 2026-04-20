import React from 'react';
import { Sparkles, Check, X, Download } from 'lucide-react';
import Avatar from '../../ui/Avatar';
import StatusBadge from '../../ui/StatusBadge';
import MatchBar from './MatchBar';

const SparklesIcon = ({ size = 13 }) => <Sparkles size={size} />;
const CheckIcon    = ({ size = 13 }) => <Check size={size} strokeWidth={2.5} />;
const XIcon        = ({ size = 13 }) => <X size={size} strokeWidth={2.5} />;
const DownloadIcon = ({ size = 13 }) => <Download size={size} />;

export default function CandidateDetail({ candidate, onAccept, onReject, onViewResume }) {
  return (
    <div className="p-8 max-w-[720px] animate-fadeIn">
      <div className="flex items-start gap-5">
        <Avatar name={candidate.candidate_name} size={64} />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-2xl font-bold tracking-tight text-brand-text-primary">{candidate.candidate_name}</h2>
            <StatusBadge status={candidate.status} />
          </div>
          {candidate.candidate_email && (
            <div className="text-sm text-brand-text-muted font-mono">{candidate.candidate_email}</div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-6 flex-wrap">
        {candidate.status === 'pending' && (
          <>
            <button onClick={() => onAccept(candidate.id)}
              className="h-9 px-4 text-sm rounded-xl font-semibold inline-flex items-center gap-1.5 transition-all active:scale-[.97]"
              style={{ background: 'linear-gradient(135deg, #10B981 0%, #34D399 100%)', color: '#fff', boxShadow: '0 0 16px rgba(16,185,129,0.25)' }}>
              <CheckIcon /> Accept
            </button>
            <button onClick={() => onReject(candidate.id)}
              className="h-9 px-4 text-sm rounded-xl inline-flex items-center gap-1.5 transition-colors font-medium text-red-300"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}>
              <XIcon /> Reject
            </button>
          </>
        )}
        {candidate.resume_url && (
          <button onClick={() => onViewResume(candidate.resume_url)}
            className="h-9 px-3 text-sm rounded-xl inline-flex items-center gap-1.5 transition-colors text-brand-text-muted"
            style={{ border: '1px solid rgba(35,42,62,0.8)', background: 'rgba(16,20,32,0.6)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; e.currentTarget.style.color = '#F59E0B'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(35,42,62,0.8)'; e.currentTarget.style.color = ''; }}>
            <DownloadIcon /> View Resume
          </button>
        )}
      </div>

      <div className="mt-8 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.04)' }}>
        <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(245,158,11,0.15)' }}>
          <div className="w-7 h-7 rounded-lg grid place-items-center shrink-0"
            style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
            <SparklesIcon />
          </div>
          <div className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#F59E0B' }}>AI Assessment</div>
          <span className="ml-auto text-[10px] font-mono text-brand-text-disabled">auto-generated</span>
        </div>
        <div className="p-5">
          <p className="text-sm text-brand-text-muted leading-relaxed">
            Candidate profile has been automatically parsed and scored against the job requirements.
            Review the resume and application details below.
          </p>
          {candidate.cv_analysis_score != null && (
            <div className="mt-3 flex items-center gap-3">
              <div className="text-xs text-brand-text-muted">Match score</div>
              <MatchBar score={candidate.cv_analysis_score} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <div className="text-[10px] font-mono uppercase tracking-widest text-brand-text-disabled mb-4">Application details</div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            { l: 'Applied', v: candidate.applied_at ? new Date(candidate.applied_at).toLocaleDateString() : '—' },
            { l: 'Status',  v: candidate.status || 'pending' },
            { l: 'CV Score', v: candidate.cv_analysis_score != null ? `${candidate.cv_analysis_score}/100` : 'Not scored' },
          ].map(({ l, v }) => (
            <div key={l} className="rounded-xl p-4" style={{ background: 'rgba(16,20,32,0.6)', border: '1px solid rgba(35,42,62,0.7)' }}>
              <div className="text-brand-text-disabled text-[10px] font-mono uppercase tracking-widest mb-1">{l}</div>
              <div className="text-brand-text-primary font-semibold">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
