import React, { useState } from 'react';
import { fetchJobOffers, editJobOffer, deleteJobOffer, fetchCandidatesForJobOffer } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../hooks/useToast';
import { Button, Input, Modal, ConfirmModal } from '../ui/index';
import { useNavigate } from 'react-router-dom';
import SearchComponent from '../ui/animated-glowing-search-bar';
import { Search, Filter, Plus, Trash2, Pencil, ChevronLeft, ChevronRight, Bell, Briefcase, Users } from 'lucide-react';

const SearchIcon    = ({ size = 14 }) => <Search size={size} />;
const FilterIcon    = ({ size = 13 }) => <Filter size={size} />;
const PlusIcon      = ({ size = 14 }) => <Plus size={size} />;
const TrashIcon     = ({ size = 13 }) => <Trash2 size={size} />;
const EditIcon      = ({ size = 13 }) => <Pencil size={size} />;
const ChevronLeftIcon  = ({ size = 12 }) => <ChevronLeft size={size} />;
const ChevronRightIcon = ({ size = 12 }) => <ChevronRight size={size} />;
const BellIcon      = ({ size = 15 }) => <Bell size={size} />;
const BriefcaseIcon = ({ size = 20 }) => <Briefcase size={size} />;
const UsersIcon     = ({ size = 14 }) => <Users size={size} />;

/* ── Status badge ──────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    open:    { bg: 'rgba(16,185,129,0.1)', color: '#6EE7B7', border: 'rgba(16,185,129,0.2)', dot: '#34D399' },
    active:  { bg: 'rgba(16,185,129,0.1)', color: '#6EE7B7', border: 'rgba(16,185,129,0.2)', dot: '#34D399' },
    draft:   { bg: 'rgba(35,42,62,0.6)',   color: '#9BA6C4', border: 'rgba(35,42,62,0.8)',   dot: '#59628A' },
    paused:  { bg: 'rgba(245,158,11,0.1)', color: '#FCD34D', border: 'rgba(245,158,11,0.2)', dot: '#F59E0B' },
    pending: { bg: 'rgba(245,158,11,0.1)', color: '#FCD34D', border: 'rgba(245,158,11,0.2)', dot: '#F59E0B' },
    closed:  { bg: 'rgba(239,68,68,0.1)',  color: '#FCA5A5', border: 'rgba(239,68,68,0.2)',  dot: '#F87171' },
  };
  const s = map[status] || map.draft;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      {status || 'draft'}
    </span>
  );
}

/* ── KPI card ───────────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, loading, accentColor = '#F59E0B' }) {
  return (
    <div className="rounded-xl p-5 relative overflow-hidden"
      style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
      <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl"
        style={{ background: `linear-gradient(90deg, ${accentColor}60 0%, ${accentColor}20 100%)` }} />
      <div className="text-[10px] font-mono uppercase tracking-widest text-brand-text-disabled">{label}</div>
      <div className="mt-2 text-3xl font-bold font-mono tracking-tight text-brand-text-primary">
        {loading
          ? <span className="inline-block w-12 h-8 rounded animate-pulse" style={{ background: 'rgba(35,42,62,0.8)' }} />
          : value}
      </div>
      {sub && <div className="text-[11px] text-brand-text-disabled mt-1">{sub}</div>}
    </div>
  );
}

/* ── Inline search input ────────────────────────────────────────────── */
function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="flex-1 flex justify-start">
      <SearchComponent 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder} 
      />
    </div>
  );
}

/* ── Skeleton row ───────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr style={{ borderTop: '1px solid rgba(35,42,62,0.5)' }}>
      {[55, 30, 15, 20, 10].map((w, i) => (
        <td key={i} className="p-4 pl-6">
          <div className="h-4 rounded animate-pulse" style={{ width: `${w}%`, background: 'rgba(35,42,62,0.8)' }} />
        </td>
      ))}
    </tr>
  );
}

/* ── Candidate status badge ─────────────────────────────────────────── */
const candidateBadge = (status) => {
  const map = {
    pending:  { bg: 'rgba(245,158,11,0.1)', color: '#FCD34D', border: 'rgba(245,158,11,0.2)' },
    accepted: { bg: 'rgba(16,185,129,0.1)', color: '#6EE7B7', border: 'rgba(16,185,129,0.2)' },
    rejected: { bg: 'rgba(239,68,68,0.1)',  color: '#FCA5A5', border: 'rgba(239,68,68,0.2)' },
  };
  const s = map[status] || { bg: 'rgba(35,42,62,0.6)', color: '#9BA6C4', border: 'rgba(35,42,62,0.8)' };
  return (
    <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {status}
    </span>
  );
};

/* ── Topbar ─────────────────────────────────────────────────────────── */
function Topbar({ title, subtitle, actions }) {
  return (
    <div className="h-14 px-6 flex items-center gap-3 sticky top-0 z-20"
      style={{ borderBottom: '1px solid rgba(35,42,62,0.7)', background: 'rgba(9,12,20,0.85)', backdropFilter: 'blur(12px)' }}>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3">
          <h1 className="text-[15px] font-semibold text-brand-text-primary truncate">{title}</h1>
          {subtitle && <span className="text-xs text-brand-text-disabled hidden sm:block">{subtitle}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button className="w-9 h-9 rounded-lg text-brand-text-muted grid place-items-center transition-colors"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(35,42,62,0.6)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <BellIcon />
        </button>
        {actions}
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────────── */
export default function ViewOffers() {
  const { data: offers, loading, error, refetch } = useApi(fetchJobOffers, []);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [q, setQ] = useState('');
  const [editingOffer, setEditingOffer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [candidatesOffer, setCandidatesOffer] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  const handleEditChange = (e) => setEditingOffer(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSavingId(editingOffer.id);
    try {
      await editJobOffer(editingOffer.id, editingOffer);
      toast.success('Offer updated successfully.');
      refetch();
      setEditingOffer(null);
    } catch {
      toast.error('Failed to save changes. Please try again.');
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async () => {
    setDeletingId(deleteTarget.id);
    try {
      await deleteJobOffer(deleteTarget.id);
      toast.success('Offer deleted.');
      refetch();
    } catch {
      toast.error('Failed to delete offer.');
    } finally {
      setDeletingId(null);
      setDeleteTarget(null);
    }
  };

  const handleViewCandidates = async (offer) => {
    setCandidatesOffer(offer);
    setLoadingCandidates(true);
    try {
      const data = await fetchCandidatesForJobOffer(offer.id);
      setCandidates(data);
    } catch {
      toast.error('Failed to load candidates.');
    } finally {
      setLoadingCandidates(false);
    }
  };

  const offersList = Array.isArray(offers) ? offers : [];
  const filtered = offersList.filter(o => !q || (o.title || '').toLowerCase().includes(q.toLowerCase()));

  const kpis = [
    { label: 'Active roles',  value: offersList.length,                                              sub: 'total offers' },
    { label: 'Applicants',   value: offersList.reduce((a, o) => a + (o.applicants_count || 0), 0),  sub: 'across all roles' },
    { label: 'Shortlisted',  value: offersList.reduce((a, o) => a + (o.shortlisted_count || 0), 0), sub: 'AI-ranked' },
    { label: 'Avg. match',   value: '76', sub: '/ 100 score' },
  ];

  return (
    <div className="flex-1 animate-fadeIn">
      <Topbar
        title="Job Offers"
        subtitle={`${offersList.length} total`}
        actions={
          <button
            onClick={() => navigate('/recruiter-dashboard/add-offers')}
            className="h-8 px-3 text-xs rounded-lg font-semibold inline-flex items-center gap-1.5 transition-all active:scale-[.97]"
            style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)', color: '#111827', boxShadow: '0 0 16px rgba(245,158,11,0.3)' }}>
            <PlusIcon /> New offer
          </button>
        }
      />

      <div className="px-8 py-6 max-w-[1360px] mx-auto">

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpis.map((k, i) => (
            <KpiCard key={k.label} loading={loading} label={k.label} value={k.value} sub={k.sub}
              accentColor={i === 0 ? '#F59E0B' : i === 1 ? '#7C3AED' : i === 2 ? '#10B981' : '#3B82F6'} />
          ))}
        </div>

        {/* Table card */}
        <div className="rounded-xl overflow-hidden"
          style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>

          {/* Toolbar */}
          <div className="p-4 flex items-center gap-2 flex-wrap"
            style={{ borderBottom: '1px solid rgba(35,42,62,0.6)' }}>
            <SearchInput value={q} onChange={e => setQ(e.target.value)} placeholder="Search offers…" />
            <button className="h-9 px-3 rounded-lg text-xs text-brand-text-muted inline-flex items-center gap-1.5 transition-all"
              style={{ border: '1px solid rgba(35,42,62,0.8)', background: 'rgba(16,20,32,0.8)' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(35,42,62,1)'; e.currentTarget.style.color = '#EEF0F8'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(35,42,62,0.8)'; e.currentTarget.style.color = ''; }}>
              <FilterIcon /> Filters
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Role', 'Location', 'Applicants', 'Status', ''].map((h, i) => (
                    <th key={i}
                      className={`text-left font-mono text-[10px] uppercase tracking-widest text-brand-text-disabled font-medium p-4 ${i === 0 ? 'pl-6' : ''} ${i === 4 ? 'pr-6' : ''} ${i === 2 ? 'hidden lg:table-cell text-right' : ''} ${i === 1 ? 'hidden md:table-cell' : ''}`}
                      style={{ borderBottom: '1px solid rgba(35,42,62,0.6)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1, 2, 3].map(i => <SkeletonRow key={i} />)
                ) : error ? (
                  <tr><td colSpan={5} className="p-8 text-center text-sm text-red-400">{error}</td></tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl grid place-items-center text-brand-text-disabled"
                          style={{ background: 'rgba(35,42,62,0.5)', border: '1px solid rgba(35,42,62,0.8)' }}>
                          <BriefcaseIcon />
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-brand-text-primary">No offers found</div>
                          <button onClick={() => navigate('/recruiter-dashboard/add-offers')}
                            className="mt-2 text-xs font-medium transition-colors"
                            style={{ color: '#F59E0B' }}
                            onMouseEnter={e => e.currentTarget.style.color = '#FCD34D'}
                            onMouseLeave={e => e.currentTarget.style.color = '#F59E0B'}>
                            Create your first offer →
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(offer => (
                    <tr key={offer.id}
                      className="cursor-pointer transition-colors group"
                      style={{ borderTop: '1px solid rgba(35,42,62,0.5)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(24,30,46,0.6)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => handleViewCandidates(offer)}>
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg grid place-items-center shrink-0 transition-colors"
                            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                            <BriefcaseIcon size={14} />
                          </div>
                          <div>
                            <div className="font-semibold text-brand-text-primary">{offer.title}</div>
                            <div className="text-xs text-brand-text-disabled mt-0.5 line-clamp-1 max-w-[280px]">{offer.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-brand-text-muted hidden md:table-cell">{offer.location || '—'}</td>
                      <td className="p-4 text-right font-mono text-brand-text-muted hidden lg:table-cell">
                        <span className="inline-flex items-center gap-1.5">
                          {offer.applicants_count != null && <UsersIcon size={12} />}
                          {offer.applicants_count ?? '—'}
                        </span>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={offer.status || 'open'} />
                      </td>
                      <td className="p-4 pr-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            className="h-7 px-2 rounded-md text-[11px] inline-flex items-center gap-1 transition-colors text-brand-text-muted"
                            style={{ background: 'rgba(35,42,62,0.4)', border: '1px solid rgba(35,42,62,0.7)' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#F59E0B'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = 'rgba(35,42,62,0.7)'; }}
                            onClick={() => setEditingOffer({ ...offer })}>
                            <EditIcon /> Edit
                          </button>
                          <button
                            className="w-7 h-7 rounded-md grid place-items-center transition-colors text-brand-text-disabled"
                            style={{ background: 'rgba(35,42,62,0.4)', border: '1px solid rgba(35,42,62,0.7)' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = 'rgba(35,42,62,0.7)'; e.currentTarget.style.background = 'rgba(35,42,62,0.4)'; }}
                            onClick={() => setDeleteTarget(offer)}>
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          {!loading && filtered.length > 0 && (
            <div className="p-4 flex items-center justify-between text-xs text-brand-text-disabled"
              style={{ borderTop: '1px solid rgba(35,42,62,0.6)' }}>
              <span>Showing {filtered.length} of {offersList.length} offers</span>
              <div className="flex gap-1">
                <button className="h-7 w-7 rounded-md grid place-items-center transition-colors"
                  style={{ border: '1px solid rgba(35,42,62,0.8)', background: 'rgba(16,20,32,0.6)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(35,42,62,0.6)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,20,32,0.6)'}>
                  <ChevronLeftIcon />
                </button>
                <button className="h-7 w-7 rounded-md grid place-items-center transition-colors"
                  style={{ border: '1px solid rgba(35,42,62,0.8)', background: 'rgba(16,20,32,0.6)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(35,42,62,0.6)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(16,20,32,0.6)'}>
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      <Modal
        isOpen={!!editingOffer}
        onClose={() => setEditingOffer(null)}
        title="Edit Offer"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingOffer(null)}>Cancel</Button>
            <Button loading={!!savingId} onClick={handleSave}>Save Changes</Button>
          </>
        }
      >
        {editingOffer && (
          <div className="space-y-4">
            <Input label="Job Title" name="title" value={editingOffer.title || ''} onChange={handleEditChange} required />
            <Input label="Description" name="description" as="textarea" value={editingOffer.description || ''} onChange={handleEditChange} className="min-h-[80px]" />
            <Input label="Requirements" name="requirements" value={editingOffer.requirements || ''} onChange={handleEditChange} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Salary Range" name="salary_range" value={editingOffer.salary_range || ''} onChange={handleEditChange} />
              <Input label="Location" name="location" value={editingOffer.location || ''} onChange={handleEditChange} />
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Offer"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        loading={!!deletingId}
      />

      {/* Candidates modal */}
      <Modal
        isOpen={!!candidatesOffer}
        onClose={() => { setCandidatesOffer(null); setCandidates([]); }}
        title={`Candidates — ${candidatesOffer?.title}`}
        size="lg"
      >
        {loadingCandidates ? (
          <div className="flex justify-center py-10">
            <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(245,158,11,0.5)', borderTopColor: 'transparent' }} />
          </div>
        ) : candidates.length === 0 ? (
          <p className="text-sm text-brand-text-muted text-center py-8">No candidates have applied yet.</p>
        ) : (
          <div className="space-y-0 divide-y" style={{ borderColor: 'rgba(35,42,62,0.6)' }}>
            {candidates.map(c => (
              <div key={c.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm font-medium text-brand-text-primary">{c.candidate_name}</p>
                  <div className="mt-0.5">{candidateBadge(c.status)}</div>
                </div>
                {c.resume_url && (
                  <button
                    onClick={() => window.open(c.resume_url, '_blank')}
                    className="h-7 px-2.5 text-xs rounded-lg transition-colors font-medium text-brand-text-muted"
                    style={{ border: '1px solid rgba(35,42,62,0.8)', background: 'rgba(16,20,32,0.6)' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#F59E0B'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = 'rgba(35,42,62,0.8)'; }}>
                    View Resume
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
