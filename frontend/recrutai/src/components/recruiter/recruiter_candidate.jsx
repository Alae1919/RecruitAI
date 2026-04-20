import React, { useEffect, useState } from 'react';
import { Viewer, Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import { apiClient, fetchJobOffers, fetchCandidatesForJobOffer, acceptCandidate, rejectCandidate } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { Modal } from '../ui/index';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js';
import SearchComponent from '../ui/animated-glowing-search-bar';
import { Search, Sparkles, List, Columns2, Briefcase, Bell, ArrowLeft } from 'lucide-react';
import Avatar from '../ui/Avatar';
import StatusBadge from '../ui/StatusBadge';
import MatchBar from './candidates/MatchBar';
import CandidateDetail from './candidates/CandidateDetail';
import Kanban from './candidates/Kanban';

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
                style={mode === v ? { background: '#F59E0B', color: '#111827' } : { color: '#9BA6C4' }}
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
                    <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
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
        loadingCandidates ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: 'rgba(245,158,11,0.4)', borderTopColor: 'transparent' }} />
          </div>
        ) : (
          <Kanban candidates={candidates} onSelect={setSelectedCandidate} />
        )
      ) : (
        <div className="flex-1 grid grid-cols-[minmax(360px,420px)_1fr] min-h-0">
          <div className="flex flex-col" style={{ borderRight: '1px solid rgba(35,42,62,0.7)' }}>
            <div className="p-3 flex justify-center" style={{ borderBottom: '1px solid rgba(35,42,62,0.6)' }}>
              <SearchComponent value={q} onChange={e => setQ(e.target.value)} placeholder="Search candidates…" />
            </div>
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
                      {c.cv_analysis_score != null && <MatchBar score={c.cv_analysis_score} />}
                    </div>
                  </button>
                ))
              )}
            </div>
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

      <Modal isOpen={!!resumeUrl} onClose={() => setResumeUrl(null)} title="Candidate Resume" size="xl">
        {resumeUrl && <ResumeViewer resumeUrl={resumeUrl} />}
      </Modal>
    </div>
  );
}
