import React, { useState } from 'react';
import { getJobOffers, applyForJob } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';
import SearchComponent from '../ui/animated-glowing-search-bar';
import { Search, MapPin, DollarSign, Tag, Briefcase, Bell, Sparkles } from 'lucide-react';

const SearchIcon   = ({ size = 15 }) => <Search size={size} />;
const MapPinIcon   = ({ size = 13 }) => <MapPin size={size} />;
const DollarIcon   = ({ size = 13 }) => <DollarSign size={size} />;
const TagIcon      = ({ size = 13 }) => <Tag size={size} />;
const BriefcaseIcon = ({ size = 22 }) => <Briefcase size={size} strokeWidth={1.5} />;
const BellIcon     = ({ size = 15 }) => <Bell size={size} />;
const SparklesIcon = ({ size = 12 }) => <Sparkles size={size} />;

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
        <div className="flex justify-center mb-10">
          <SearchComponent 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search by title, location, description…" 
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
