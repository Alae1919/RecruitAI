import React from 'react';
import { fetchRecruiterInterviews } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import Button from '../ui/Button';
import { Bell, Video, Mic, Sparkles, ExternalLink } from 'lucide-react';
import Avatar from '../ui/Avatar';
import StatusBadge from '../ui/StatusBadge';

const BellIcon        = ({ size = 15 }) => <Bell size={size} />;
const VideoIcon       = ({ size = 14 }) => <Video size={size} />;
const MicIcon         = ({ size = 40 }) => <Mic size={size} strokeWidth={1.5} />;
const SparklesIcon    = ({ size = 12 }) => <Sparkles size={size} />;
const ExternalLinkIcon = ({ size = 12 }) => <ExternalLink size={size} />;

/* ── Status badge label map (entretien uses different display labels) ── */
function InterviewStatusBadge({ status }) {
  const labelMap = { evaluated: 'Evaluated', processing: 'Processing', available: 'Pending' };
  return <StatusBadge status={status === 'available' ? 'pending' : status} label={labelMap[status] ?? status} />;
}

/* ── Score ring ─────────────────────────────────────────────────────── */
function ScoreRing({ score }) {
  if (score == null) return <span className="text-brand-text-disabled font-mono text-sm">—</span>;
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 75 ? '#10B981' : pct >= 50 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-8 h-8">
        <svg viewBox="0 0 32 32" width="32" height="32">
          <circle cx="16" cy="16" r="12" fill="none" stroke="rgba(35,42,62,0.8)" strokeWidth="3" />
          <circle cx="16" cy="16" r="12" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${(pct / 100) * 75.4} 75.4`}
            strokeLinecap="round"
            transform="rotate(-90 16 16)"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
      </div>
      <span className="font-mono text-sm font-bold" style={{ color }}>{pct}</span>
    </div>
  );
}

/* ── Skeleton row ───────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr style={{ borderTop: '1px solid rgba(35,42,62,0.6)' }}>
      {[60, 45, 20, 25, 30].map((w, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 rounded animate-pulse" style={{ width: `${w}%`, background: 'rgba(35,42,62,0.8)' }} />
        </td>
      ))}
    </tr>
  );
}

/* ── Empty state ────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <div className="flex flex-col items-center py-20 gap-4">
      <div className="w-16 h-16 rounded-2xl grid place-items-center text-brand-text-disabled"
        style={{ background: 'rgba(35,42,62,0.5)', border: '1px solid rgba(35,42,62,0.8)' }}>
        <MicIcon size={28} />
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold text-brand-text-primary">No interviews yet</div>
        <div className="text-xs text-brand-text-muted mt-1">Interviews will appear here once candidates complete them.</div>
      </div>
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────── */
export default function RecruiterInterviews() {
  const { data, loading, error, refetch } = useApi(fetchRecruiterInterviews, []);

  const interviews = Array.isArray(data)
    ? data.map(i => ({
        id: i.id,
        candidateName: i.candidate_name,
        offerName: i.offer_title,
        status: i.status,
        score: i.result ?? null,
        video: i.interview_link,
      }))
    : [];

  const scoredInterviews = interviews.filter(i => i.score?.score != null);
  const avgScore = scoredInterviews.length
    ? Math.round(scoredInterviews.reduce((a, i) => a + i.score.score, 0) / scoredInterviews.length)
    : '—';

  const kpis = [
    { label: 'Total',      value: interviews.length },
    { label: 'Evaluated',  value: interviews.filter(i => i.status === 'evaluated').length },
    { label: 'Processing', value: interviews.filter(i => i.status === 'processing').length },
    { label: 'Avg Score',  value: avgScore, suffix: scoredInterviews.length ? '/100' : '' },
  ];

  return (
    <div className="flex-1 animate-fadeIn">
      {/* Topbar */}
      <div className="h-14 px-6 flex items-center gap-3 sticky top-0 z-20"
        style={{ borderBottom: '1px solid rgba(35,42,62,0.7)', background: 'rgba(9,12,20,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-semibold text-brand-text-primary">Interviews</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-medium"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}>
            <SparklesIcon /> AI-evaluated
          </span>
          <button className="w-9 h-9 rounded-lg text-brand-text-muted grid place-items-center transition-colors"
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(35,42,62,0.6)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <BellIcon />
          </button>
        </div>
      </div>

      <div className="px-8 py-6 max-w-[1360px] mx-auto">

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpis.map((k, i) => (
            <div key={i} className="rounded-xl p-5"
              style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
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

        {/* Table card */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>

          {/* Table header bar */}
          <div className="px-6 py-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid rgba(35,42,62,0.7)' }}>
            <span className="text-[10px] font-mono uppercase tracking-widest text-brand-text-disabled">
              {loading ? 'Loading…' : `${interviews.length} interview${interviews.length !== 1 ? 's' : ''}`}
            </span>
            <div className="flex items-center gap-1.5">
              <VideoIcon size={12} />
              <span className="text-[11px] text-brand-text-muted">Async video interviews</span>
            </div>
          </div>

          {error ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <p className="text-sm text-red-400">Failed to load interviews.</p>
              <Button variant="secondary" size="sm" onClick={refetch}>Retry</Button>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      {['Candidate', 'Offer', 'Score', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left px-6 py-3 text-[10px] font-mono uppercase tracking-widest font-medium text-brand-text-disabled"
                          style={{ borderBottom: '1px solid rgba(35,42,62,0.6)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      [1, 2, 3, 4].map(i => <SkeletonRow key={i} />)
                    ) : interviews.length === 0 ? (
                      <tr>
                        <td colSpan={5}>
                          <EmptyState />
                        </td>
                      </tr>
                    ) : (
                      interviews.map(i => (
                        <tr key={i.id}
                          className="transition-colors"
                          style={{ borderTop: '1px solid rgba(35,42,62,0.5)' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(24,30,46,0.6)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={i.candidateName} size={36} />
                              <div className="font-semibold text-brand-text-primary">{i.candidateName}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-brand-text-muted max-w-[200px]">
                            <div className="truncate">{i.offerName || '—'}</div>
                          </td>
                          <td className="px-6 py-4">
                            <ScoreRing score={i.score?.score ?? null} />
                          </td>
                          <td className="px-6 py-4">
                            <InterviewStatusBadge status={i.status} />
                          </td>
                          <td className="px-6 py-4">
                            {i.status !== 'available' && i.video ? (
                              <button
                                onClick={() => window.open(i.video, '_blank')}
                                className="h-7 px-2.5 text-xs rounded-lg inline-flex items-center gap-1.5 transition-colors font-medium"
                                style={{ background: 'rgba(35,42,62,0.6)', border: '1px solid rgba(35,42,62,0.8)', color: '#9BA6C4' }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; e.currentTarget.style.color = '#F59E0B'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(35,42,62,0.8)'; e.currentTarget.style.color = '#9BA6C4'; }}>
                                <ExternalLinkIcon /> View
                              </button>
                            ) : (
                              <span className="text-xs text-brand-text-disabled font-mono">No video</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y" style={{ borderColor: 'rgba(35,42,62,0.6)' }}>
                {loading ? (
                  <div className="p-6 space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'rgba(35,42,62,0.5)' }} />
                    ))}
                  </div>
                ) : interviews.length === 0 ? (
                  <EmptyState />
                ) : (
                  interviews.map(i => (
                    <div key={i.id} className="p-5" style={{ borderColor: 'rgba(35,42,62,0.6)' }}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={i.candidateName} size={40} />
                          <div>
                            <div className="font-semibold text-sm text-brand-text-primary">{i.candidateName}</div>
                            <div className="text-xs text-brand-text-muted mt-0.5 truncate max-w-[180px]">{i.offerName}</div>
                          </div>
                        </div>
                        <StatusBadge status={i.status} />
                      </div>
                      <div className="flex items-center justify-between">
                        <ScoreRing score={i.score?.score ?? null} />
                        {i.status !== 'available' && i.video && (
                          <button
                            onClick={() => window.open(i.video, '_blank')}
                            className="h-8 px-3 text-xs rounded-lg inline-flex items-center gap-1.5 font-medium transition-colors"
                            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}>
                            <ExternalLinkIcon /> View Interview
                          </button>
                        )}
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
