import React, { useState } from 'react';
import { getJobOffers, applyForJob } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';

/* ── Icons ─────────────────────────────────────────────────────────── */
function SearchIcon({ size = 15 }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
function MapPinIcon({ size = 13 }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
}
function DollarIcon({ size = 13 }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
}
function TagIcon({ size = 13 }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
}
function BriefcaseIcon({ size = 22 }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
}
function BellIcon({ size = 15 }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
}
function SparklesIcon({ size = 12 }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.8 2.8M15.7 15.7l2.8 2.8M5.5 18.5l2.8-2.8M15.7 8.3l2.8-2.8"/></svg>;
}

/* ── Skeleton card ──────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="rounded-2xl p-5 animate-pulse" style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)' }}>
      <div className="flex justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="h-5 w-3/4 rounded-lg" style={{ background: 'rgba(35,42,62,0.8)' }} />
          <div className="h-3.5 w-full rounded" style={{ background: 'rgba(35,42,62,0.6)' }} />
          <div className="h-3.5 w-5/6 rounded" style={{ background: 'rgba(35,42,62,0.5)' }} />
          <div className="flex gap-3 pt-1">
            <div className="h-5 w-20 rounded-full" style={{ background: 'rgba(35,42,62,0.6)' }} />
            <div className="h-5 w-24 rounded-full" style={{ background: 'rgba(35,42,62,0.6)' }} />
          </div>
        </div>
        <div className="h-8 w-16 rounded-xl shrink-0" style={{ background: 'rgba(35,42,62,0.8)' }} />
      </div>
    </div>
  );
}

export default function JobSeekerApplications() {
  const { data, loading, error, refetch } = useApi(getJobOffers, []);
  const { toast } = useToast();
  const [applying, setApplying] = useState(null);
  const [applied, setApplied] = useState(new Set());
  const [search, setSearch] = useState('');

  const offers = Array.isArray(data) ? data : [];
  const filtered = offers.filter(o =>
    [o.title, o.description, o.location].some(f => f?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleApply = async (offerId) => {
    setApplying(offerId);
    try {
      await applyForJob(offerId);
      setApplied(prev => new Set([...prev, offerId]));
      toast.success('Application submitted successfully!');
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to submit application.';
      toast.error(msg);
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="flex-1 animate-fadeIn">
      {/* Topbar */}
      <div className="h-14 px-6 flex items-center gap-3 sticky top-0 z-20"
        style={{ borderBottom: '1px solid rgba(35,42,62,0.7)', background: 'rgba(9,12,20,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-semibold text-brand-text-primary">Browse Jobs</h1>
        </div>
        <div className="flex items-center gap-2">
          {!loading && (
            <span className="text-xs text-brand-text-disabled font-mono">
              {filtered.length} offer{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-medium"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}>
            <SparklesIcon /> AI-matched
          </span>
          <button className="w-9 h-9 rounded-lg text-brand-text-muted grid place-items-center transition-colors"
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(35,42,62,0.6)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <BellIcon />
          </button>
        </div>
      </div>

      <div className="px-8 py-6 max-w-[960px] mx-auto">

        {/* Search bar */}
        <div className="relative mb-6">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text-disabled pointer-events-none"><SearchIcon /></div>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, location, description…"
            className="w-full h-11 pl-11 pr-4 text-sm text-brand-text-primary placeholder:text-brand-text-disabled outline-none rounded-xl transition-all"
            style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)' }}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(245,158,11,0.45)'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(35,42,62,0.8)'}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl text-sm text-red-300 flex items-center justify-between"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            Failed to load offers.
            <button onClick={refetch} className="text-xs underline hover:text-red-200">Retry</button>
          </div>
        )}

        {/* Skeletons */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center py-20 gap-4">
            <div className="w-14 h-14 rounded-2xl grid place-items-center text-brand-text-disabled"
              style={{ background: 'rgba(35,42,62,0.5)', border: '1px solid rgba(35,42,62,0.8)' }}>
              <BriefcaseIcon />
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-brand-text-primary">
                {search ? 'No matching offers' : 'No offers available'}
              </div>
              <div className="text-xs text-brand-text-muted mt-1">
                {search ? 'Try a different search term.' : 'Check back later for new opportunities.'}
              </div>
            </div>
          </div>
        )}

        {/* Offer cards */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map(offer => {
              const isApplied = applied.has(offer.id);
              return (
                <div key={offer.id} className="rounded-2xl p-5 transition-all group"
                  style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.25)'; e.currentTarget.style.background = 'rgba(24,30,46,0.9)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(35,42,62,0.8)'; e.currentTarget.style.background = '#101420'; }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4 flex-1 min-w-0">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-xl grid place-items-center shrink-0 mt-0.5"
                        style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#F59E0B' }}>
                        <BriefcaseIcon size={17} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-brand-text-primary mb-1">{offer.title}</h3>
                        <p className="text-sm text-brand-text-muted line-clamp-2 mb-3 leading-relaxed">{offer.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {offer.location && (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium text-brand-text-muted"
                              style={{ background: 'rgba(35,42,62,0.6)', border: '1px solid rgba(35,42,62,0.8)' }}>
                              <MapPinIcon /> {offer.location}
                            </span>
                          )}
                          {offer.salary_range && (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium text-brand-text-muted"
                              style={{ background: 'rgba(35,42,62,0.6)', border: '1px solid rgba(35,42,62,0.8)' }}>
                              <DollarIcon /> {offer.salary_range}
                            </span>
                          )}
                          {offer.requirements && (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium text-brand-text-muted"
                              style={{ background: 'rgba(35,42,62,0.6)', border: '1px solid rgba(35,42,62,0.8)' }}>
                              <TagIcon /> {String(offer.requirements).slice(0, 50)}{String(offer.requirements).length > 50 ? '…' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Apply button */}
                    <div className="shrink-0">
                      {isApplied ? (
                        <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold"
                          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#6EE7B7' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                          Applied
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          loading={applying === offer.id}
                          onClick={() => handleApply(offer.id)}
                        >
                          Apply
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
