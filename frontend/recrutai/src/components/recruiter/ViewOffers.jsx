import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchCandidatesForJobOffer } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { Button, Input, Modal, ConfirmModal } from '../ui/index';
import SearchComponent from '../ui/animated-glowing-search-bar';
import { Search, Plus, Trash2, Pencil, Bell, Briefcase, Users, MessageSquare, Sparkles } from 'lucide-react';
import { useJobOffers, useEditOffer, useDeleteOffer, useGenerateJobDescription } from '../../shared/hooks/useJobOffers';
import { StatusBadge, KpiCard } from '../ui/index';
import Pagination from '../ui/Pagination';
import JobOffersFilters from '../jobOffers/JobOffersFilters';
import AsyncTaskBanner from '../ui/AsyncTaskBanner';

const SearchIcon    = ({ size = 14 }) => <Search size={size} />;
const PlusIcon      = ({ size = 14 }) => <Plus size={size} />;
const TrashIcon     = ({ size = 13 }) => <Trash2 size={size} />;
const EditIcon      = ({ size = 13 }) => <Pencil size={size} />;
const BellIcon      = ({ size = 15 }) => <Bell size={size} />;
const BriefcaseIcon = ({ size = 20 }) => <Briefcase size={size} />;
const UsersIcon     = ({ size = 14 }) => <Users size={size} />;
const QuestionsIcon = ({ size = 13 }) => <MessageSquare size={size} />;

const PAGE_SIZE = 20;

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="flex-1 flex justify-start">
      <SearchComponent value={value} onChange={onChange} placeholder={placeholder} />
    </div>
  );
}

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

export default function ViewOffers() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const page     = parseInt(searchParams.get('page') || '1', 10);
  const search   = searchParams.get('search') || '';
  const filters  = {
    title:          searchParams.get('title')          || '',
    location:       searchParams.get('location')       || '',
    experience_min: searchParams.get('experience_min') || '',
    ordering:       searchParams.get('ordering')       || '-created_at',
  };

  const queryParams = { ...filters, page, page_size: PAGE_SIZE, ...(search ? { search } : {}) };
  const { data, isLoading: loading, isError: error } = useJobOffers(queryParams);

  const editMutation     = useEditOffer();
  const deleteMutation   = useDeleteOffer();
  const generateMutation = useGenerateJobDescription();
  const { toast } = useToast();

  const [editingOffer, setEditingOffer]   = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [candidatesOffer, setCandidatesOffer] = useState(null);
  const [candidates, setCandidates]       = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [regenState, setRegenState]       = useState('idle');

  const offersList = data?.results ?? (Array.isArray(data) ? data : []);
  const totalCount = data?.count ?? offersList.length;

  const setParam = (key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value); else next.delete(key);
      return next;
    });
  };

  const handleFiltersChange = (newFilters) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(newFilters).forEach(([k, v]) => {
        if (v && v !== '' && !(k === 'ordering' && v === '-created_at') && k !== 'page') {
          next.set(k, v);
        } else {
          next.delete(k);
        }
      });
      if (newFilters.page && newFilters.page !== 1) next.set('page', newFilters.page);
      else next.delete('page');
      return next;
    });
  };

  const handleEditChange = (e) => setEditingOffer(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    try {
      await editMutation.mutateAsync({ id: editingOffer.id, data: editingOffer });
      toast.success('Offer updated successfully.');
      setEditingOffer(null);
      setRegenState('idle');
    } catch {
      toast.error('Failed to save changes. Please try again.');
    }
  };

  const handleRegenerate = async () => {
    if (!editingOffer?.title) return;
    const skills = (editingOffer.requirements || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!skills.length) { toast.error('Add requirements (comma-separated skills) first.'); return; }
    setRegenState('pending');
    try {
      const result = await generateMutation.mutateAsync({
        title: editingOffer.title,
        skills,
        experience_level: 'mid',
      });
      setEditingOffer(prev => ({ ...prev, description: result.description }));
      setRegenState('success');
    } catch {
      setRegenState('failed');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success('Offer deleted.');
    } catch {
      toast.error('Failed to delete offer.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleViewCandidates = async (offer) => {
    setCandidatesOffer(offer);
    setLoadingCandidates(true);
    try {
      const d = await fetchCandidatesForJobOffer(offer.id);
      setCandidates(d);
    } catch {
      toast.error('Failed to load candidates.');
    } finally {
      setLoadingCandidates(false);
    }
  };

  const kpis = [
    { label: 'Active roles',  value: totalCount,                                                       sub: 'total offers' },
    { label: 'Applicants',   value: offersList.reduce((a, o) => a + (o.applicants_count || 0), 0),    sub: 'across all roles' },
    { label: 'Shortlisted',  value: offersList.reduce((a, o) => a + (o.shortlisted_count || 0), 0),   sub: 'AI-ranked' },
    { label: 'Avg. match',   value: '76', sub: '/ 100 score' },
  ];

  return (
    <div className="flex-1 animate-fadeIn">
      <Topbar
        title="Job Offers"
        subtitle={`${totalCount} total`}
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
            <SearchInput
              value={search}
              onChange={e => { setParam('search', e.target.value); setParam('page', ''); }}
              placeholder="Search offers…"
            />
            <JobOffersFilters filters={filters} onChange={handleFiltersChange} />
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
                  <tr><td colSpan={5} className="p-8 text-center text-sm text-red-400">Failed to load offers.</td></tr>
                ) : offersList.length === 0 ? (
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
                  offersList.map(offer => (
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
                            onMouseEnter={e => { e.currentTarget.style.color = '#818CF8'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = 'rgba(35,42,62,0.7)'; }}
                            onClick={() => navigate(`/recruiter-dashboard/offers/${offer.id}/questions`)}>
                            <QuestionsIcon /> Questions
                          </button>
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

          {/* Pagination */}
          {!loading && totalCount > PAGE_SIZE && (
            <div className="px-6 pb-4" style={{ borderTop: '1px solid rgba(35,42,62,0.6)' }}>
              <Pagination
                count={totalCount}
                page={page}
                pageSize={PAGE_SIZE}
                onChange={p => setParam('page', p === 1 ? '' : String(p))}
              />
            </div>
          )}

          {!loading && offersList.length > 0 && totalCount <= PAGE_SIZE && (
            <div className="p-4 flex items-center justify-between text-xs text-brand-text-disabled"
              style={{ borderTop: '1px solid rgba(35,42,62,0.6)' }}>
              <span>Showing {offersList.length} of {totalCount} offers</span>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      <Modal
        isOpen={!!editingOffer}
        onClose={() => { setEditingOffer(null); setRegenState('idle'); }}
        title="Edit Offer"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => { setEditingOffer(null); setRegenState('idle'); }}>Cancel</Button>
            <Button loading={editMutation.isPending} onClick={handleSave}>Save Changes</Button>
          </>
        }
      >
        {editingOffer && (
          <div className="space-y-4">
            <Input label="Job Title" name="title" value={editingOffer.title || ''} onChange={handleEditChange} required />
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-medium text-brand-text-muted uppercase tracking-wider">Description</label>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={regenState === 'pending'}
                  className="inline-flex items-center gap-1 h-6 px-2 rounded-md text-[11px] font-medium transition-all disabled:opacity-50"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}>
                  <Sparkles size={11} />
                  {regenState === 'pending' ? 'Generating…' : 'Regenerate with AI'}
                </button>
              </div>
              {regenState !== 'idle' && (
                <div className="mb-2">
                  <AsyncTaskBanner
                    state={regenState}
                    label="Regenerating description"
                    onRetry={() => setRegenState('idle')}
                  />
                </div>
              )}
              <Input name="description" as="textarea" value={editingOffer.description || ''} onChange={handleEditChange} className="min-h-[80px]" />
            </div>
            <Input label="Requirements" name="requirements" value={editingOffer.requirements || ''} onChange={handleEditChange} placeholder="comma-separated skills, e.g. Go, Docker, PostgreSQL" />
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
        loading={deleteMutation.isPending}
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
