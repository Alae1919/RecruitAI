import React, { useState } from 'react';
import { fetchJobSeekerInterviews } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import Button from '../ui/Button';
import JobSeekerInterviewProcess from './JobSeekerInterviewProcess';
import JobSeekerInterviewAnswers from './JobSeekerInterviewAnswers';
import { Bell, Mic, Play, Eye } from 'lucide-react';

const BellIcon = ({ size = 15 }) => <Bell size={size} />;
const MicIcon  = ({ size = 22 }) => <Mic size={size} strokeWidth={1.5} />;
const PlayIcon = ({ size = 12 }) => <Play size={size} fill="currentColor" stroke="none" />;
const EyeIcon  = ({ size = 12 }) => <Eye size={size} />;

/* ── Status badge ───────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    available:  { bg: 'rgba(59,130,246,0.1)',  color: '#93C5FD', border: 'rgba(59,130,246,0.25)',  dot: '#60A5FA', label: 'Available' },
    completed:  { bg: 'rgba(16,185,129,0.1)',  color: '#6EE7B7', border: 'rgba(16,185,129,0.25)', dot: '#34D399', label: 'Completed' },
    evaluated:  { bg: 'rgba(16,185,129,0.1)',  color: '#6EE7B7', border: 'rgba(16,185,129,0.25)', dot: '#34D399', label: 'Evaluated' },
    processing: { bg: 'rgba(245,158,11,0.1)',  color: '#FCD34D', border: 'rgba(245,158,11,0.25)', dot: '#F59E0B', label: 'Processing' },
  };
  const s = map[status] || { bg: 'rgba(35,42,62,0.6)', color: '#9BA6C4', border: 'rgba(35,42,62,0.8)', dot: '#59628A', label: status };
  return (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

/* ── Score ring ─────────────────────────────────────────────────────── */
function Score({ value }) {
  if (value == null) return <span className="text-brand-text-disabled font-mono text-sm">—</span>;
  return <span className="font-mono text-sm font-bold" style={{ color: '#F59E0B' }}>{value}<span className="text-brand-text-disabled text-xs">/10</span></span>;
}

/* ── Skeleton row ───────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr style={{ borderTop: '1px solid rgba(35,42,62,0.5)' }}>
      {[50, 20, 15, 15, 15].map((w, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 rounded animate-pulse" style={{ width: `${w}%`, background: 'rgba(35,42,62,0.8)' }} />
        </td>
      ))}
    </tr>
  );
}

export default function JobSeekerEntretien() {
  const { data, loading, error, refetch } = useApi(fetchJobSeekerInterviews, []);
  const [currentInterview, setCurrentInterview]   = useState(null);
  const [selectedInterview, setSelectedInterview] = useState(null);

  const interviews = Array.isArray(data)
    ? data.map(i => ({
        id: i.id,
        candidateName: i.candidate_name,
        offerName: i.offer_name,
        status: i.status,
        score: i.result?.score ?? null,
        video: i.interview_link ?? null,
      }))
    : [];

  if (currentInterview) {
    return <JobSeekerInterviewProcess interview={currentInterview} onClose={() => { setCurrentInterview(null); refetch(); }} />;
  }
  if (selectedInterview) {
    return <JobSeekerInterviewAnswers interviewId={selectedInterview} onBack={() => setSelectedInterview(null)} />;
  }

  const kpis = [
    { label: 'Total',      value: interviews.length },
    { label: 'Available',  value: interviews.filter(i => i.status === 'available').length,  color: '#3B82F6' },
    { label: 'Completed',  value: interviews.filter(i => ['completed','evaluated'].includes(i.status)).length, color: '#10B981' },
    { label: 'Avg Score',  value: (() => {
        const scored = interviews.filter(i => i.score != null);
        return scored.length ? (scored.reduce((a, i) => a + i.score, 0) / scored.length).toFixed(1) : '—';
      })(), suffix: interviews.filter(i => i.score != null).length ? '/10' : '' },
  ];

  return (
    <div className="flex-1 animate-fadeIn">
      {/* Topbar */}
      <div className="h-14 px-6 flex items-center gap-3 sticky top-0 z-20"
        style={{ borderBottom: '1px solid rgba(35,42,62,0.7)', background: 'rgba(9,12,20,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="flex-1">
          <h1 className="text-[15px] font-semibold text-brand-text-primary">My Interviews</h1>
        </div>
        <button className="w-9 h-9 rounded-lg text-brand-text-muted grid place-items-center transition-colors"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(35,42,62,0.6)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <BellIcon />
        </button>
      </div>

      <div className="px-8 py-6 max-w-[1200px] mx-auto">

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpis.map((k, i) => (
            <div key={k.label} className="rounded-xl p-5 relative overflow-hidden"
              style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl"
                style={{ background: `linear-gradient(90deg, ${k.color || '#F59E0B'}60, ${k.color || '#F59E0B'}15)` }} />
              <div className="text-[10px] font-mono uppercase tracking-widest text-brand-text-disabled">{k.label}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <div className="text-3xl font-bold font-mono tracking-tight text-brand-text-primary">
                  {loading ? <span className="inline-block w-10 h-7 rounded animate-pulse" style={{ background: 'rgba(35,42,62,0.8)' }} /> : k.value}
                </div>
                {k.suffix && <span className="text-brand-text-disabled text-sm">{k.suffix}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl text-sm text-red-300 flex items-center justify-between"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            Failed to load interviews.
            <button onClick={refetch} className="text-xs underline hover:text-red-200">Retry</button>
          </div>
        )}

        {/* Table card */}
        <div className="rounded-xl overflow-hidden"
          style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>

          {interviews.length === 0 && !loading ? (
            <div className="flex flex-col items-center py-20 gap-4">
              <div className="w-14 h-14 rounded-2xl grid place-items-center text-brand-text-disabled"
                style={{ background: 'rgba(35,42,62,0.5)', border: '1px solid rgba(35,42,62,0.8)' }}>
                <MicIcon />
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-brand-text-primary">No interviews yet</div>
                <div className="text-xs text-brand-text-muted mt-1">Interviews appear here after your application is accepted.</div>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      {['Position', 'Status', 'Score', 'Take Interview', 'View Answers'].map((h, i) => (
                        <th key={h} className="text-left px-6 py-3 text-[10px] font-mono uppercase tracking-widest font-medium text-brand-text-disabled"
                          style={{ borderBottom: '1px solid rgba(35,42,62,0.6)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      [1, 2, 3].map(i => <SkeletonRow key={i} />)
                    ) : (
                      interviews.map(i => (
                        <tr key={i.id}
                          className="transition-colors"
                          style={{ borderTop: '1px solid rgba(35,42,62,0.5)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(24,30,46,0.6)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td className="px-6 py-4 font-semibold text-brand-text-primary">{i.offerName}</td>
                          <td className="px-6 py-4"><StatusBadge status={i.status} /></td>
                          <td className="px-6 py-4"><Score value={i.score} /></td>
                          <td className="px-6 py-4">
                            <button
                              disabled={i.status !== 'available'}
                              onClick={() => i.status === 'available' && setCurrentInterview(i)}
                              className="h-7 px-3 text-xs rounded-lg font-semibold inline-flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                              style={i.status === 'available'
                                ? { background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)', color: '#111827', boxShadow: '0 0 12px rgba(245,158,11,0.25)' }
                                : { background: 'rgba(35,42,62,0.5)', border: '1px solid rgba(35,42,62,0.7)', color: '#59628A' }}>
                              <PlayIcon /> Start
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              disabled={i.status === 'available'}
                              onClick={() => i.status !== 'available' && setSelectedInterview(i.id)}
                              className="h-7 px-3 text-xs rounded-lg inline-flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-brand-text-muted"
                              style={{ border: '1px solid rgba(35,42,62,0.7)', background: 'rgba(35,42,62,0.4)' }}
                              onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)', e.currentTarget.style.color = '#F59E0B')}
                              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(35,42,62,0.7)', e.currentTarget.style.color = '')}>
                              <EyeIcon /> Answers
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y" style={{ borderColor: 'rgba(35,42,62,0.5)' }}>
                {loading ? (
                  <div className="p-6 space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'rgba(35,42,62,0.5)' }} />)}
                  </div>
                ) : (
                  interviews.map(i => (
                    <div key={i.id} className="p-5" style={{ borderColor: 'rgba(35,42,62,0.5)' }}>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <div className="font-semibold text-sm text-brand-text-primary">{i.offerName}</div>
                          {i.score != null && (
                            <div className="mt-1"><Score value={i.score} /></div>
                          )}
                        </div>
                        <StatusBadge status={i.status} />
                      </div>
                      <div className="flex gap-2">
                        <button
                          disabled={i.status !== 'available'}
                          onClick={() => i.status === 'available' && setCurrentInterview(i)}
                          className="flex-1 h-8 text-xs rounded-lg font-semibold inline-flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
                          style={i.status === 'available'
                            ? { background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)', color: '#111827' }
                            : { background: 'rgba(35,42,62,0.5)', border: '1px solid rgba(35,42,62,0.7)', color: '#59628A' }}>
                          <PlayIcon /> Start
                        </button>
                        <button
                          disabled={i.status === 'available'}
                          onClick={() => i.status !== 'available' && setSelectedInterview(i.id)}
                          className="flex-1 h-8 text-xs rounded-lg inline-flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 text-brand-text-muted"
                          style={{ border: '1px solid rgba(35,42,62,0.7)', background: 'rgba(35,42,62,0.4)' }}>
                          <EyeIcon /> Answers
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
