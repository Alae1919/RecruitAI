import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../../hooks/useToast';
import { Button, Input, Select, Modal, ConfirmModal } from '../ui/index';
import SearchComponent from '../ui/animated-glowing-search-bar';
import { Plus, Trash2, Pencil, Bell, Briefcase, MessageSquare, Sparkles } from 'lucide-react';
import { useJobOffers, useEditOffer, useDeleteOffer, useGenerateJobDescription } from '../../shared/hooks/useJobOffers';
import { StatusBadge, KpiCard } from '../ui/index';
import Pagination from '../ui/Pagination';
import JobOffersFilters from '../jobOffers/JobOffersFilters';
import AsyncTaskBanner from '../ui/AsyncTaskBanner';
import { timeAgo } from '../../shared/utils/time';

const PlusIcon      = ({ size = 14 }) => <Plus size={size} />;
const TrashIcon     = ({ size = 13 }) => <Trash2 size={size} />;
const EditIcon      = ({ size = 13 }) => <Pencil size={size} />;
const BellIcon      = ({ size = 15 }) => <Bell size={size} />;
const BriefcaseIcon = ({ size = 20 }) => <Briefcase size={size} />;
const QuestionsIcon = ({ size = 13 }) => <MessageSquare size={size} />;

const PAGE_SIZE = 20;

const STATUS_TABS = [
  { value: '',       label: 'All' },
  { value: 'open',   label: 'Open' },
  { value: 'draft',  label: 'Draft' },
  { value: 'paused', label: 'Paused' },
];

const SORT_OPTIONS = [
  { value: '-created_at',       label: 'Recent' },
  { value: '-applicants_count', label: 'Most applicants' },
  { value: '-avg_match',        label: 'Best match' },
  { value: 'title',             label: 'Title A–Z' },
];
const DEFAULT_ORDERING = '-created_at';

const OFFER_STATUS_OPTIONS = [
  { value: 'open',   label: 'Open' },
  { value: 'draft',  label: 'Draft' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
];

const HEADERS = [
  { label: 'Role' },
  { label: 'Location', cls: 'hidden md:table-cell' },
  { label: 'Applicants', cls: 'text-right hidden lg:table-cell' },
  { label: 'Shortlist', cls: 'text-right hidden lg:table-cell' },
  { label: 'Avg. match', cls: 'hidden xl:table-cell' },
  { label: 'Status' },
  { label: 'Posted', cls: 'hidden md:table-cell' },
  { label: '' },
];

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
      {[40, 20, 8, 8, 14, 10, 10, 8].map((w, i) => (
        <td key={i} className="p-4 pl-6">
          <div className="h-4 rounded animate-pulse" style={{ width: `${w}%`, background: 'rgba(35,42,62,0.8)' }} />
        </td>
      ))}
    </tr>
  );
}

function MatchCell({ value }) {
  if (value == null) return <span className="text-brand-text-disabled">—</span>;
  return (
    <div className="flex items-center gap-2" title={`Average CV match ${value}/100`}>
      <div className="h-1.5 w-16 rounded-full overflow-hidden" style={{ background: 'rgba(35,42,62,0.8)' }}>
        <div className="h-full rounded-full bg-brand-accent" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="font-mono text-xs text-brand-text-muted">{Math.round(value)}</span>
    </div>
  );
}

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
        <button aria-label="Notifications" className="w-9 h-9 rounded-lg text-brand-text-muted grid place-items-center transition-colors hover:bg-brand-elevated">
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
    status:         searchParams.get('status')         || '',
    ordering:       searchParams.get('ordering')       || DEFAULT_ORDERING,
  };

  const queryParams = { ...filters, page, page_size: PAGE_SIZE, ...(search ? { search } : {}) };
  const { data, isLoading: loading, isError: error } = useJobOffers(queryParams);

  const editMutation     = useEditOffer();
  const deleteMutation   = useDeleteOffer();
  const generateMutation = useGenerateJobDescription();
  const { toast } = useToast();

  const [editingOffer, setEditingOffer]   = useState(null);
  const [deleteTarget, setDeleteTarget]   = useState(null);
  const [regenState, setRegenState]       = useState('idle');

  const offersList = data?.results ?? (Array.isArray(data) ? data : []);
  const totalCount = data?.count ?? offersList.length;
  const openCount  = offersList.filter(o => o.status === 'open').length;
  const hasFilters = !!(search || filters.title || filters.location || filters.experience_min || filters.status);

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
        if (v && v !== '' && !(k === 'ordering' && v === DEFAULT_ORDERING) && k !== 'page') {
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

  const openCandidates = (offer) =>
    navigate(`/recruiter-dashboard/recruiter_candidate?offer=${offer.id}`);

  const avgMatches = offersList.map(o => o.avg_match).filter(v => v != null);
  const avgMatch = avgMatches.length
    ? Math.round(avgMatches.reduce((a, v) => a + v, 0) / avgMatches.length)
    : '—';

  const kpis = [
    { label: 'Active roles', value: openCount,                                                      sub: `${totalCount} total offers` },
    { label: 'Applicants',   value: offersList.reduce((a, o) => a + (o.applicants_count || 0), 0),  sub: 'across listed roles' },
    { label: 'Shortlisted',  value: offersList.reduce((a, o) => a + (o.shortlisted_count || 0), 0), sub: 'AI-ranked' },
    { label: 'Avg. match',   value: avgMatch,                                                       sub: '/ 100 CV score' },
  ];

  return (
    <div className="flex-1 animate-fadeIn">
      <Topbar
        title="Job Offers"
        subtitle={`${totalCount} total · ${openCount} open`}
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
            <div role="group" aria-label="Filter by status"
              className="flex items-center gap-1 rounded-lg p-0.5"
              style={{ background: 'rgba(24,30,46,0.8)', border: '1px solid rgba(35,42,62,0.8)' }}>
              {STATUS_TABS.map(t => {
                const active = filters.status === t.value;
                return (
                  <button key={t.label} type="button" aria-pressed={active}
                    onClick={() => handleFiltersChange({ ...filters, status: t.value, page: 1 })}
                    className={`h-7 px-2.5 text-xs rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 ${
                      active ? 'bg-brand-accent text-gray-900' : 'text-brand-text-muted hover:text-brand-text-primary'
                    }`}>
                    {t.label}
                  </button>
                );
              })}
            </div>
            <select
              aria-label="Sort offers"
              value={filters.ordering}
              onChange={e => handleFiltersChange({ ...filters, ordering: e.target.value, page: 1 })}
              className="h-9 px-3 rounded-lg text-xs text-brand-text-muted outline-none cursor-pointer"
              style={{ background: 'rgba(24,30,46,0.8)', border: '1px solid rgba(35,42,62,0.8)' }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <JobOffersFilters filters={filters} onChange={handleFiltersChange} hideOrdering />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {HEADERS.map((h, i) => (
                    <th key={i}
                      className={`text-left font-mono text-[10px] uppercase tracking-widest text-brand-text-disabled font-medium p-4 ${i === 0 ? 'pl-6' : ''} ${i === HEADERS.length - 1 ? 'pr-6' : ''} ${h.cls || ''}`}
                      style={{ borderBottom: '1px solid rgba(35,42,62,0.6)' }}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [1, 2, 3].map(i => <SkeletonRow key={i} />)
                ) : error ? (
                  <tr><td colSpan={HEADERS.length} className="p-8 text-center text-sm text-red-400">Failed to load offers.</td></tr>
                ) : offersList.length === 0 ? (
                  <tr>
                    <td colSpan={HEADERS.length} className="py-20">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl grid place-items-center text-brand-text-disabled"
                          style={{ background: 'rgba(35,42,62,0.5)', border: '1px solid rgba(35,42,62,0.8)' }}>
                          <BriefcaseIcon />
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-brand-text-primary">
                            {hasFilters ? 'No offers match these filters' : 'No offers found'}
                          </div>
                          {hasFilters ? (
                            <button onClick={() => setSearchParams({})}
                              className="mt-2 text-xs font-medium text-brand-accent hover:text-brand-accent-bright transition-colors">
                              Clear filters
                            </button>
                          ) : (
                            <button onClick={() => navigate('/recruiter-dashboard/add-offers')}
                              className="mt-2 text-xs font-medium text-brand-accent hover:text-brand-accent-bright transition-colors">
                              Create your first offer →
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  offersList.map(offer => (
                    <tr key={offer.id}
                      className="cursor-pointer transition-colors group hover:bg-brand-elevated/60"
                      style={{ borderTop: '1px solid rgba(35,42,62,0.5)' }}
                      onClick={() => openCandidates(offer)}>
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg grid place-items-center shrink-0 transition-colors"
                            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                            <BriefcaseIcon size={14} />
                          </div>
                          <div className="min-w-0">
                            <button type="button"
                              onClick={(e) => { e.stopPropagation(); openCandidates(offer); }}
                              className="font-semibold text-brand-text-primary text-left hover:text-brand-accent transition-colors focus-visible:outline-none focus-visible:underline">
                              {offer.title}
                            </button>
                            <div className="text-xs text-brand-text-disabled mt-0.5 line-clamp-1 max-w-[280px]">
                              {[offer.department, offer.employment_type?.replace('_', '-'), offer.salary_range].filter(Boolean).join(' · ') || offer.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-brand-text-muted hidden md:table-cell">{offer.location || '—'}</td>
                      <td className="p-4 text-right font-mono text-brand-text-muted hidden lg:table-cell">
                        {offer.applicants_count ?? '—'}
                      </td>
                      <td className="p-4 text-right font-mono text-brand-accent hidden lg:table-cell">
                        {offer.shortlisted_count ?? '—'}
                      </td>
                      <td className="p-4 hidden xl:table-cell"><MatchCell value={offer.avg_match} /></td>
                      <td className="p-4">
                        <StatusBadge status={offer.status || 'open'} />
                      </td>
                      <td className="p-4 text-xs text-brand-text-muted hidden md:table-cell">
                        {offer.status === 'draft' ? '—' : timeAgo(offer.created_at)}
                      </td>
                      <td className="p-4 pr-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button
                            aria-label={`Interview questions for ${offer.title}`}
                            className="h-7 px-2 rounded-md text-[11px] inline-flex items-center gap-1 transition-colors text-brand-text-muted hover:text-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
                            style={{ background: 'rgba(35,42,62,0.4)', border: '1px solid rgba(35,42,62,0.7)' }}
                            onClick={() => navigate(`/recruiter-dashboard/offers/${offer.id}/questions`)}>
                            <QuestionsIcon /> Questions
                          </button>
                          <button
                            aria-label={`Edit ${offer.title}`}
                            className="h-7 px-2 rounded-md text-[11px] inline-flex items-center gap-1 transition-colors text-brand-text-muted hover:text-brand-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
                            style={{ background: 'rgba(35,42,62,0.4)', border: '1px solid rgba(35,42,62,0.7)' }}
                            onClick={() => setEditingOffer({ ...offer })}>
                            <EditIcon /> Edit
                          </button>
                          <button
                            aria-label={`Delete ${offer.title}`}
                            className="w-7 h-7 rounded-md grid place-items-center transition-colors text-brand-text-disabled hover:text-red-400 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
                            style={{ background: 'rgba(35,42,62,0.4)', border: '1px solid rgba(35,42,62,0.7)' }}
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
            <div className="grid grid-cols-[1fr_160px] gap-4">
              <Input label="Job Title" name="title" value={editingOffer.title || ''} onChange={handleEditChange} required />
              <Select label="Status" name="status" value={editingOffer.status || 'open'} onChange={handleEditChange}>
                {OFFER_STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
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
    </div>
  );
}
