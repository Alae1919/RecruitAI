import React, { useEffect, useState } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { fetchJobOffers, fetchCandidatesForJobOffer, acceptCandidate, rejectCandidate } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { Modal } from '../ui/index';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js';
import SearchComponent from '../ui/animated-glowing-search-bar';
import { Search, Sparkles, List, Columns2, Check, X, Download, Briefcase, Bell, ArrowLeft, Plus } from 'lucide-react';

const SearchIcon   = ({ size = 14 }) => <Search size={size} />;
const SparklesIcon = ({ size = 13 }) => <Sparkles size={size} />;
const ListIcon     = ({ size = 12 }) => <List size={size} />;
const ColumnsIcon  = ({ size = 12 }) => <Columns2 size={size} />;
const CheckIcon    = ({ size = 13 }) => <Check size={size} strokeWidth={2.5} />;
const XIcon        = ({ size = 13 }) => <X size={size} strokeWidth={2.5} />;
const DownloadIcon = ({ size = 13 }) => <Download size={size} />;
const BriefcaseIcon = ({ size = 14 }) => <Briefcase size={size} />;
const BellIcon     = ({ size = 15 }) => <Bell size={size} />;
const ArrowLeftIcon = ({ size = 13 }) => <ArrowLeft size={size} />;
const PlusIcon     = ({ size = 12 }) => <Plus size={size} strokeWidth={2.5} />;

/* ── Avatar ─────────────────────────────────────────────────────────── */
function Avatar({ name, size = 36 }) {
  const initials = (name || '?').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 360;
  return (
    <div className="rounded-full grid place-items-center font-semibold text-xs text-white shrink-0"
      style={{ width: size, height: size, background: `oklch(0.52 0.12 ${hash})`, boxShadow: `0 0 10px oklch(0.52 0.12 ${hash} / 0.35)`, fontSize: size > 40 ? 16 : 11 }}>
      {initials}
    </div>
  );
}

/* ── Status badge ───────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    pending:  { bg: 'rgba(245,158,11,0.1)', color: '#FCD34D', border: 'rgba(245,158,11,0.25)', dot: '#F59E0B' },
    accepted: { bg: 'rgba(16,185,129,0.1)', color: '#6EE7B7', border: 'rgba(16,185,129,0.25)', dot: '#34D399' },
    rejected: { bg: 'rgba(239,68,68,0.1)',  color: '#FCA5A5', border: 'rgba(239,68,68,0.25)',  dot: '#F87171' },
  };
  const s = map[status] || { bg: 'rgba(35,42,62,0.6)', color: '#9BA6C4', border: 'rgba(35,42,62,0.8)', dot: '#59628A' };
  return (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {status || 'pending'}
    </span>
  );
}

/* ── PDF Viewer ─────────────────────────────────────────────────────── */
function ResumeViewer({ resumeUrl }) {
  const [pdfBlob, setPdfBlob] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(resumeUrl, { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } });
        const blob = await res.blob();
        if (alive) setPdfBlob(URL.createObjectURL(blob));
      } catch {}
    })();
    return () => { alive = false; };
  }, [resumeUrl]);
  return (
    <div style={{ height: '500px' }}>
      <Worker workerUrl={pdfjsWorker}>
        {pdfBlob
          ? <Viewer fileUrl={pdfBlob} />
          : <div className="flex items-center justify-center h-full text-sm text-brand-text-muted">Loading resume…</div>}
      </Worker>
    </div>
  );
}

/* ── Topbar ─────────────────────────────────────────────────────────── */
function Topbar({ selectedOffer, mode, setMode, candidatesCount }) {
  return (
    <div className="h-14 px-6 flex items-center gap-3 sticky top-0 z-20"
      style={{ borderBottom: '1px solid rgba(35,42,62,0.7)', background: 'rgba(9,12,20,0.85)', backdropFilter: 'blur(12px)' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[15px] font-semibold text-brand-text-primary truncate">
            {selectedOffer ? selectedOffer.title : 'Candidates'}
          </h1>
          {candidatesCount > 0 && (
            <span className="text-xs text-brand-text-disabled">{candidatesCount} applicants</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {selectedOffer && (
          <div className="flex rounded-lg p-0.5"
            style={{ border: '1px solid rgba(35,42,62,0.8)', background: 'rgba(16,20,32,0.8)' }}>
            {[
              { v: 'list', label: 'List', Icon: ListIcon },
              { v: 'kanban', label: 'Kanban', Icon: ColumnsIcon },
            ].map(({ v, label, Icon }) => (
              <button key={v} onClick={() => setMode(v)}
                className="h-7 px-2 rounded-md flex items-center gap-1 text-xs transition-all font-medium"
                style={mode === v
                  ? { background: '#F59E0B', color: '#111827' }
                  : { color: '#9BA6C4' }}
                onMouseEnter={e => mode !== v && (e.currentTarget.style.color = '#EEF0F8')}
                onMouseLeave={e => mode !== v && (e.currentTarget.style.color = '#9BA6C4')}>
                <Icon />{label}
              </button>
            ))}
          </div>
        )}
        <button className="h-8 px-2.5 text-xs rounded-lg inline-flex items-center gap-1.5 font-medium transition-all"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.1)'}>
          <SparklesIcon size={12} /> Rank with AI
        </button>
        <button className="w-9 h-9 rounded-lg text-brand-text-muted grid place-items-center transition-colors"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(35,42,62,0.6)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <BellIcon />
        </button>
      </div>
    </div>
  );
}

/* ── Match bar ──────────────────────────────────────────────────────── */
function MatchBar({ score }) {
  const color = score >= 75 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="h-1 flex-1 rounded-full overflow-hidden" style={{ background: 'rgba(35,42,62,0.8)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono font-bold" style={{ color }}>{score}%</span>
    </div>
  );
}

/* ── Candidate detail panel ─────────────────────────────────────────── */
function CandidateDetail({ candidate, onAccept, onReject, onViewResume }) {
  return (
    <div className="p-8 max-w-[720px] animate-fadeIn">
      {/* Header */}
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

      {/* Actions */}
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

      {/* AI assessment */}
      <div className="mt-8 rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.04)' }}>
        <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(245,158,11,0.15)' }}>
          <div className="w-7 h-7 rounded-lg grid place-items-center shrink-0"
            style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
            <SparklesIcon size={13} />
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

      {/* Application details */}
      <div className="mt-8">
        <div className="text-[10px] font-mono uppercase tracking-widest text-brand-text-disabled mb-4">Application details</div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            { l: 'Applied', v: candidate.applied_at ? new Date(candidate.applied_at).toLocaleDateString() : '—' },
            { l: 'Status', v: candidate.status || 'pending' },
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

/* ── Kanban board ───────────────────────────────────────────────────── */
const STAGES = ['pending', 'accepted', 'rejected'];
const STAGE_CONFIG = {
  pending:  { label: 'Applied',  dot: '#F59E0B', header: 'rgba(245,158,11,0.08)' },
  accepted: { label: 'Accepted', dot: '#34D399', header: 'rgba(16,185,129,0.08)' },
  rejected: { label: 'Rejected', dot: '#F87171', header: 'rgba(239,68,68,0.08)' },
};

function Kanban({ candidates, onSelect }) {
  return (
    <div className="flex-1 overflow-x-auto">
      <div className="p-6 flex gap-4 min-w-max">
        {STAGES.map(stage => {
          const col = candidates.filter(c => (c.status || 'pending') === stage);
          const cfg = STAGE_CONFIG[stage];
          return (
            <div key={stage} className="w-[300px] shrink-0 flex flex-col rounded-2xl overflow-hidden"
              style={{ border: '1px solid rgba(35,42,62,0.8)', background: 'rgba(16,20,32,0.7)' }}>
              <div className="px-4 py-3 flex items-center justify-between"
                style={{ background: cfg.header, borderBottom: '1px solid rgba(35,42,62,0.7)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: cfg.dot }} />
                  <span className="text-sm font-semibold text-brand-text-primary">{cfg.label}</span>
                  <span className="text-[10px] font-mono text-brand-text-disabled bg-black/20 px-1.5 py-0.5 rounded-full">{col.length}</span>
                </div>
                <button className="w-6 h-6 rounded-md grid place-items-center text-brand-text-disabled transition-colors"
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(35,42,62,0.8)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <PlusIcon />
                </button>
              </div>
              <div className="flex-1 p-3 space-y-2 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                {col.map(c => (
                  <button key={c.id} onClick={() => onSelect(c)}
                    className="w-full text-left p-3 rounded-xl transition-all cursor-pointer"
                    style={{ background: 'rgba(24,30,46,0.7)', border: '1px solid rgba(35,42,62,0.7)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; e.currentTarget.style.background = 'rgba(24,30,46,1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(35,42,62,0.7)'; e.currentTarget.style.background = 'rgba(24,30,46,0.7)'; }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar name={c.candidate_name} size={28} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold truncate text-brand-text-primary">{c.candidate_name}</div>
                        <div className="text-[10px] text-brand-text-muted truncate">{c.candidate_email || '—'}</div>
                      </div>
                    </div>
                    {c.cv_analysis_score != null && (
                      <div className="pt-2" style={{ borderTop: '1px solid rgba(35,42,62,0.6)' }}>
                        <MatchBar score={c.cv_analysis_score} />
                      </div>
                    )}
                  </button>
                ))}
                {col.length === 0 && (
                  <div className="h-16 rounded-xl grid place-items-center text-[11px] text-brand-text-disabled"
                    style={{ border: '1.5px dashed rgba(35,42,62,0.6)' }}>
                    No candidates
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────── */
export default function JobOffersWithCandidates() {
  const [jobOffers, setJobOffers] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [mode, setMode] = useState('list');
  const [q, setQ] = useState('');
  const [resumeUrl, setResumeUrl] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchJobOffers();
        setJobOffers(Array.isArray(data) ? data : []);
      } catch {
        toast.error('Failed to load job offers.');
      } finally {
        setLoadingOffers(false);
      }
    })();
  }, []);

  const handleSelectOffer = async (offer) => {
    setSelectedOffer(offer);
    setSelectedCandidate(null);
    setLoadingCandidates(true);
    try {
      const data = await fetchCandidatesForJobOffer(offer.id);
      setCandidates(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load candidates.');
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleAccept = async (id) => {
    try {
      await acceptCandidate(id);
      toast.success('Candidate accepted.');
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: 'accepted' } : c));
      setSelectedCandidate(prev => prev?.id === id ? { ...prev, status: 'accepted' } : prev);
    } catch {
      toast.error('Failed to accept candidate.');
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectCandidate(id);
      toast.success('Candidate rejected.');
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: 'rejected' } : c));
      setSelectedCandidate(prev => prev?.id === id ? { ...prev, status: 'rejected' } : prev);
    } catch {
      toast.error('Failed to reject candidate.');
    }
  };

  const filtered = candidates.filter(c => !q || (c.candidate_name || '').toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="flex-1 animate-fadeIn flex flex-col min-h-screen">
      <Topbar selectedOffer={selectedOffer} mode={mode} setMode={setMode} candidatesCount={candidates.length} />

      {!selectedOffer ? (
        /* ── Offer selection ─────────────────────────────────────────── */
        <div className="px-8 py-6 max-w-[1100px] mx-auto w-full">
          <p className="text-sm text-brand-text-muted mb-5">Select a job offer to view and manage its candidates</p>

          {loadingOffers ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'rgba(16,20,32,0.8)', border: '1px solid rgba(35,42,62,0.7)' }} />
              ))}
            </div>
          ) : jobOffers.length === 0 ? (
            <div className="flex flex-col items-center py-20 gap-4">
              <div className="w-14 h-14 rounded-2xl grid place-items-center text-brand-text-disabled"
                style={{ background: 'rgba(35,42,62,0.5)', border: '1px solid rgba(35,42,62,0.8)' }}>
                <BriefcaseIcon size={22} />
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-brand-text-primary">No job offers yet</div>
                <div className="text-xs text-brand-text-muted mt-1">Create one to start receiving candidates.</div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {jobOffers.map(offer => (
                <button key={offer.id} onClick={() => handleSelectOffer(offer)}
                  className="w-full text-left rounded-2xl p-5 transition-all group"
                  style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.35)'; e.currentTarget.style.background = 'rgba(24,30,46,0.9)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(35,42,62,0.8)'; e.currentTarget.style.background = '#101420'; }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0 transition-colors"
                      style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}>
                      <BriefcaseIcon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-brand-text-primary">{offer.title}</div>
                      <div className="text-xs text-brand-text-muted mt-0.5 truncate">
                        {offer.location || 'No location'} · {offer.description?.slice(0, 70) || '—'}
                      </div>
                    </div>
                    <div className="text-brand-text-disabled text-xs font-mono shrink-0 group-hover:text-brand-accent transition-colors">
                      View →
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : mode === 'kanban' ? (
        /* ── Kanban view ─────────────────────────────────────────────── */
        loadingCandidates ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'rgba(245,158,11,0.4)', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <Kanban candidates={candidates} onSelect={setSelectedCandidate} />
        )
      ) : (
        /* ── Split list + detail ─────────────────────────────────────── */
        <div className="flex-1 grid grid-cols-[minmax(360px,420px)_1fr] min-h-0">

          {/* Candidate list panel */}
          <div className="flex flex-col" style={{ borderRight: '1px solid rgba(35,42,62,0.7)' }}>
            {/* Search */}
            <div className="p-3 flex justify-center" style={{ borderBottom: '1px solid rgba(35,42,62,0.6)' }}>
              <SearchComponent 
                value={q} 
                onChange={e => setQ(e.target.value)} 
                placeholder="Search candidates…" 
              />
            </div>

            {/* Candidate list */}
            <div className="flex-1 overflow-y-auto">
              {loadingCandidates ? (
                <div className="flex justify-center py-12">
                  <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: 'rgba(245,158,11,0.4)', borderTopColor: 'transparent' }} />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <p className="text-sm text-brand-text-muted">
                    {candidates.length === 0 ? 'No candidates have applied yet.' : 'No results match your search.'}
                  </p>
                </div>
              ) : (
                filtered.map(c => (
                  <button key={c.id} onClick={() => setSelectedCandidate(c)}
                    className="w-full text-left px-5 py-4 flex items-start gap-3 transition-colors relative"
                    style={{
                      borderBottom: '1px solid rgba(35,42,62,0.5)',
                      background: selectedCandidate?.id === c.id ? 'rgba(245,158,11,0.05)' : 'transparent',
                      borderLeft: selectedCandidate?.id === c.id ? '2px solid #F59E0B' : '2px solid transparent',
                    }}
                    onMouseEnter={e => selectedCandidate?.id !== c.id && (e.currentTarget.style.background = 'rgba(24,30,46,0.5)')}
                    onMouseLeave={e => selectedCandidate?.id !== c.id && (e.currentTarget.style.background = 'transparent')}>
                    <Avatar name={c.candidate_name} size={40} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-brand-text-primary truncate">{c.candidate_name}</span>
                        <StatusBadge status={c.status} />
                      </div>
                      {c.candidate_email && (
                        <div className="text-xs text-brand-text-muted truncate mt-0.5 font-mono">{c.candidate_email}</div>
                      )}
                      {c.cv_analysis_score != null && (
                        <MatchBar score={c.cv_analysis_score} />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Back button */}
            <div className="p-3" style={{ borderTop: '1px solid rgba(35,42,62,0.6)' }}>
              <button
                onClick={() => { setSelectedOffer(null); setCandidates([]); setSelectedCandidate(null); }}
                className="w-full h-8 rounded-lg text-xs text-brand-text-muted flex items-center justify-center gap-1.5 transition-all font-medium"
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(35,42,62,0.5)'; e.currentTarget.style.color = '#EEF0F8'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = ''; }}>
                <ArrowLeftIcon /> Back to offers
              </button>
            </div>
          </div>

          {/* Detail panel */}
          <div className="overflow-y-auto">
            {selectedCandidate ? (
              <CandidateDetail
                candidate={selectedCandidate}
                onAccept={handleAccept}
                onReject={handleReject}
                onViewResume={setResumeUrl}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-brand-text-disabled">
                <div className="w-12 h-12 rounded-2xl grid place-items-center"
                  style={{ background: 'rgba(35,42,62,0.4)', border: '1px solid rgba(35,42,62,0.7)' }}>
                  <SparklesIcon size={20} />
                </div>
                <p className="text-sm">Select a candidate to view details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resume PDF Modal */}
      <Modal isOpen={!!resumeUrl} onClose={() => setResumeUrl(null)} title="Candidate Resume" size="xl">
        {resumeUrl && <ResumeViewer resumeUrl={resumeUrl} />}
      </Modal>
    </div>
  );
}
