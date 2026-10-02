import { useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { apiClient, fetchJobOffers, fetchCandidatesForJobOffer, advanceCandidate, rejectCandidate } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { Modal } from '../ui/index';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js';
import SearchComponent from '../ui/animated-glowing-search-bar';
import { Sparkles, List, Columns2, Briefcase, Bell, ArrowLeft } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import MatchRing from './candidates/MatchRing';
import CandidateDetail from './candidates/CandidateDetail';
import ScheduleInterviewModal from './candidates/ScheduleInterviewModal';
import { scheduleInterview } from '../../shared/api/interviews';
import Kanban from './candidates/Kanban';
import { STAGES, STAGE_META, nextStageAction, countByStage, visibleCandidates } from './candidates/stages';
import { timeAgo } from '../../shared/utils/time';
import { PIPELINE_KEY } from '../../shared/hooks/usePipelineSummary';

const SparklesIcon  = ({ size = 13 }) => <Sparkles size={size} />;
const ListIcon      = ({ size = 12 }) => <List size={size} />;
const ColumnsIcon   = ({ size = 12 }) => <Columns2 size={size} />;
const BriefcaseIcon = ({ size = 14 }) => <Briefcase size={size} />;
const BellIcon      = ({ size = 15 }) => <Bell size={size} />;
const ArrowLeftIcon = ({ size = 13 }) => <ArrowLeft size={size} />;

/* ── PDF Viewer ─────────────────────────────────────────────────────── */
function ResumeViewer({ resumeUrl }) {
  const [pdfBlob, setPdfBlob] = useState(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiClient.get(resumeUrl, { responseType: 'blob' });
        if (alive) setPdfBlob(URL.createObjectURL(new Blob([res.data], { type: res.headers['content-type'] })));
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
function Topbar({ selectedOffer, mode, setMode, candidatesCount, onBack, onRank }) {
  return (
    <div className="h-14 px-6 flex items-center gap-3 sticky top-0 z-20"
      style={{ borderBottom: '1px solid rgba(35,42,62,0.7)', background: 'rgba(9,12,20,0.85)', backdropFilter: 'blur(12px)' }}>
      <div className="flex-1 min-w-0">
        {selectedOffer && (
          <div className="text-[11px] font-mono text-brand-text-disabled mb-0.5">
            <button onClick={onBack} className="hover:text-brand-text-primary transition-colors">Job offers</button>
            {' / '}candidates
          </div>
        )}
        <div className="flex items-baseline gap-3">
          <h1 className="text-[15px] font-semibold text-brand-text-primary truncate">
            {selectedOffer ? selectedOffer.title : 'Candidates'}
          </h1>
          {selectedOffer && (
            <span className="text-xs text-brand-text-muted truncate">
              {candidatesCount} applicant{candidatesCount === 1 ? '' : 's'}{selectedOffer.location ? ` · ${selectedOffer.location}` : ''}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {selectedOffer && (
          <div className="flex rounded-lg p-0.5" role="group" aria-label="View mode"
            style={{ border: '1px solid rgba(35,42,62,0.8)', background: 'rgba(16,20,32,0.8)' }}>
            {[
              { v: 'list', label: 'List', Icon: ListIcon },
              { v: 'kanban', label: 'Kanban', Icon: ColumnsIcon },
            ].map(({ v, label, Icon }) => (
              <button key={v} onClick={() => setMode(v)} aria-pressed={mode === v}
                className="h-7 px-2 rounded-md flex items-center gap-1 text-xs transition-all font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
                style={mode === v ? { background: '#F59E0B', color: '#111827' } : { color: '#9BA6C4' }}>
                <Icon />{label}
              </button>
            ))}
          </div>
        )}
        {selectedOffer && (
          <button onClick={onRank}
            title="Sort candidates by AI match score"
            className="h-8 px-2.5 text-xs rounded-lg inline-flex items-center gap-1.5 font-medium transition-all hover:bg-amber-500/20"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}>
            <SparklesIcon size={12} /> Rank with AI
          </button>
        )}
        <button aria-label="Notifications" className="w-9 h-9 rounded-lg text-brand-text-muted grid place-items-center transition-colors hover:bg-brand-elevated">
          <BellIcon />
        </button>
      </div>
    </div>
  );
}

/* ── Stage tabs ─────────────────────────────────────────────────────── */
function StageTabs({ counts, value, onChange }) {
  const tabs = [
    { key: 'all', label: 'All' },
    ...STAGES.map(s => ({ key: s, label: STAGE_META[s].label })),
    ...(counts.rejected > 0 ? [{ key: 'rejected', label: STAGE_META.rejected.label }] : []),
  ];
  return (
    <div role="group" aria-label="Filter by stage"
      className="flex flex-wrap items-center gap-0.5 rounded-lg p-0.5"
      style={{ background: 'rgba(24,30,46,0.8)', border: '1px solid rgba(35,42,62,0.8)' }}>
      {tabs.map(t => {
        const active = value === t.key;
        return (
          <button key={t.key} type="button" aria-pressed={active} onClick={() => onChange(t.key)}
            className={`h-7 px-2.5 text-xs rounded-md whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 ${
              active ? 'bg-brand-surface text-brand-text-primary shadow font-medium' : 'text-brand-text-muted hover:text-brand-text-primary'
            }`}>
            {t.label}
            <span className="ml-1 font-mono text-[10px] text-brand-text-disabled">{counts[t.key]}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────── */
export default function JobOffersWithCandidates() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const offerId = searchParams.get('offer');

  const [jobOffers, setJobOffers] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [mode, setMode] = useState('list');
  const [stage, setStage] = useState('all');
  const [sort, setSort] = useState('match');
  const [q, setQ] = useState('');
  const [resumeUrl, setResumeUrl] = useState(null);
  const [scheduling, setScheduling] = useState(null);
  const [scheduleBusy, setScheduleBusy] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const selectedOffer = useMemo(
    () => jobOffers.find(o => String(o.id) === offerId) ?? null,
    [jobOffers, offerId],
  );

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchJobOffers();
        setJobOffers(Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : []);
      } catch {
        toast.error('Failed to load job offers.');
      } finally {
        setLoadingOffers(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCandidates = useCallback(async (id, { silent = false } = {}) => {
    if (!silent) setLoadingCandidates(true);
    try {
      const data = await fetchCandidatesForJobOffer(id);
      setCandidates(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load candidates.');
    } finally {
      setLoadingCandidates(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setCandidates([]);
    setSelectedId(null);
    setStage('all');
    setQ('');
    if (offerId) loadCandidates(offerId);
  }, [offerId, loadCandidates]);

  const counts = useMemo(() => countByStage(candidates), [candidates]);
  const visible = useMemo(
    () => visibleCandidates(candidates, { stage, sort, query: q }),
    [candidates, stage, sort, q],
  );
  // the detail follows the visible list: a filtered-out selection falls back to the top match
  const selected = visible.find(c => c.id === selectedId) ?? visible[0] ?? null;

  const handleAdvance = async (c) => {
    const action = nextStageAction(c.stage);
    if (!action) return;
    setBusyId(c.id);
    try {
      await advanceCandidate(c.id);
      toast.success(action.done);
      queryClient.invalidateQueries({ queryKey: PIPELINE_KEY });
      await loadCandidates(offerId, { silent: true });
    } catch (err) {
      toast.error(err.message || 'Could not move the candidate forward.');
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (c) => {
    setBusyId(c.id);
    try {
      await rejectCandidate(c.id);
      toast.success('Candidate rejected.');
      queryClient.invalidateQueries({ queryKey: PIPELINE_KEY });
      await loadCandidates(offerId, { silent: true });
    } catch (err) {
      toast.error(err.message || 'Failed to reject candidate.');
    } finally {
      setBusyId(null);
    }
  };

  const handleSchedule = async (data) => {
    setScheduleBusy(true);
    try {
      await scheduleInterview(scheduling.interview.id, data);
      toast.success('Interview scheduled — the candidate has been notified.');
      setScheduling(null);
      await loadCandidates(offerId, { silent: true });
    } catch (err) {
      toast.error(err.message || 'Could not schedule the interview.');
    } finally {
      setScheduleBusy(false);
    }
  };

  const openFromKanban = (c) => { setSelectedId(c.id); setMode('list'); };

  return (
    <div className="flex-1 animate-fadeIn flex flex-col min-h-screen">
      <Topbar
        selectedOffer={selectedOffer}
        mode={mode}
        setMode={setMode}
        candidatesCount={candidates.length}
        onBack={() => navigate('/recruiter-dashboard/view-offers')}
        onRank={() => { setSort('match'); setMode('list'); }}
      />

      {!selectedOffer ? (
        <div className="px-8 py-6 max-w-[1100px] mx-auto w-full">
          <p className="text-sm text-brand-text-muted mb-5">Select a job offer to view and manage its candidates</p>

          {loadingOffers || (offerId && jobOffers.length === 0) ? (
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
              {offerId && (
                <p className="text-xs text-amber-400">That offer was not found — pick one below.</p>
              )}
              {jobOffers.map(offer => (
                <button key={offer.id} onClick={() => setSearchParams({ offer: String(offer.id) })}
                  className="w-full text-left rounded-2xl p-5 transition-all group hover:border-amber-400/40"
                  style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)' }}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
                      style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}>
                      <BriefcaseIcon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-brand-text-primary">{offer.title}</div>
                      <div className="text-xs text-brand-text-muted mt-0.5 truncate">
                        {offer.location || 'No location'} · {offer.applicants_count ?? 0} applicants
                      </div>
                    </div>
                    <StatusBadge status={offer.status} />
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
        loadingCandidates ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'rgba(245,158,11,0.4)', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <Kanban candidates={candidates} onSelect={openFromKanban} />
        )
      ) : (
        <div className="flex-1 grid grid-cols-[minmax(420px,480px)_1fr] min-h-0">
          <div className="flex flex-col min-h-0" style={{ borderRight: '1px solid rgba(35,42,62,0.7)' }}>
            <div className="p-3 space-y-2" style={{ borderBottom: '1px solid rgba(35,42,62,0.6)' }}>
              <StageTabs counts={counts} value={stage} onChange={setStage} />
              <div className="flex items-center gap-2">
                <div className="flex-1 flex justify-center">
                  <SearchComponent value={q} onChange={e => setQ(e.target.value)} placeholder="Search candidates…" />
                </div>
                <select aria-label="Sort candidates" value={sort} onChange={e => setSort(e.target.value)}
                  className="h-9 px-2 rounded-lg text-xs text-brand-text-muted outline-none cursor-pointer"
                  style={{ background: 'rgba(24,30,46,0.8)', border: '1px solid rgba(35,42,62,0.8)' }}>
                  <option value="match">Best match</option>
                  <option value="recent">Most recent</option>
                </select>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingCandidates ? (
                <div className="flex justify-center py-12">
                  <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                    style={{ borderColor: 'rgba(245,158,11,0.4)', borderTopColor: 'transparent' }} />
                </div>
              ) : visible.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <p className="text-sm text-brand-text-muted">
                    {candidates.length === 0 ? 'No candidates have applied yet.' : 'No candidates match this stage or search.'}
                  </p>
                </div>
              ) : (
                visible.map(c => {
                  const active = selected?.id === c.id;
                  return (
                    <button key={c.id} onClick={() => setSelectedId(c.id)} aria-current={active}
                      className="w-full text-left px-5 py-4 flex items-start gap-3 transition-colors relative hover:bg-brand-elevated/40 focus-visible:outline-none focus-visible:bg-brand-elevated/60"
                      style={{
                        borderBottom: '1px solid rgba(35,42,62,0.5)',
                        background: active ? 'rgba(245,158,11,0.05)' : undefined,
                        borderLeft: active ? '2px solid #F59E0B' : '2px solid transparent',
                      }}>
                      <MatchRing score={c.match_score} size={46} stroke={4} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-brand-text-primary truncate">{c.candidate_name}</span>
                          <StatusBadge status={c.stage} label={STAGE_META[c.stage]?.label} />
                        </div>
                        <div className="text-xs text-brand-text-muted truncate mt-0.5">{c.headline || c.candidate_email || '—'}</div>
                        {(c.resume_profile?.skills?.length > 0) && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {c.resume_profile.skills.slice(0, 3).map(s => (
                              <span key={s} className="px-1.5 h-5 rounded text-[10px] leading-5 text-brand-text-muted"
                                style={{ background: 'rgba(24,30,46,0.9)', border: '1px solid rgba(35,42,62,0.8)' }}>{s}</span>
                            ))}
                            {c.resume_profile.skills.length > 3 && (
                              <span className="text-[10px] font-mono text-brand-text-disabled self-center">+{c.resume_profile.skills.length - 3}</span>
                            )}
                          </div>
                        )}
                        <div className="text-[11px] font-mono text-brand-text-disabled mt-2">applied {timeAgo(c.applied_at)}</div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            <div className="p-3" style={{ borderTop: '1px solid rgba(35,42,62,0.6)' }}>
              <button
                onClick={() => setSearchParams({})}
                className="w-full h-8 rounded-lg text-xs text-brand-text-muted flex items-center justify-center gap-1.5 transition-all font-medium hover:bg-brand-elevated hover:text-brand-text-primary">
                <ArrowLeftIcon /> Switch offer
              </button>
            </div>
          </div>

          <div className="overflow-y-auto">
            {selected ? (
              <CandidateDetail
                candidate={selected}
                busy={busyId === selected.id}
                onAdvance={handleAdvance}
                onReject={handleReject}
                onViewResume={setResumeUrl}
                onSchedule={setScheduling}
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

      <ScheduleInterviewModal
        isOpen={!!scheduling}
        onClose={() => setScheduling(null)}
        candidateName={scheduling?.candidate_name}
        interview={scheduling?.interview}
        onSubmit={handleSchedule}
        busy={scheduleBusy}
      />

      <Modal isOpen={!!resumeUrl} onClose={() => setResumeUrl(null)} title="Candidate Resume" size="xl">
        {resumeUrl && <ResumeViewer resumeUrl={resumeUrl} />}
      </Modal>
    </div>
  );
}
