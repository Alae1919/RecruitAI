import React, { useState, useEffect, useRef } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';

const ORDERING_OPTIONS = [
  { value: '-created_at', label: 'Newest first' },
  { value: 'created_at',  label: 'Oldest first' },
  { value: 'title',       label: 'Title A–Z' },
  { value: '-title',      label: 'Title Z–A' },
  { value: 'experience_min',  label: 'Experience ↑' },
  { value: '-experience_min', label: 'Experience ↓' },
];

function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function JobOffersFilters({ filters = {}, onChange }) {
  const [open, setOpen] = useState(false);
  const [localTitle, setLocalTitle]    = useState(filters.title    ?? '');
  const [localLocation, setLocalLocation] = useState(filters.location ?? '');
  const [localExpMin, setLocalExpMin]  = useState(filters.experience_min ?? '');

  const debouncedTitle    = useDebounce(localTitle);
  const debouncedLocation = useDebounce(localLocation);
  const debouncedExpMin   = useDebounce(localExpMin);

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    onChange({
      ...filters,
      title: debouncedTitle,
      location: debouncedLocation,
      experience_min: debouncedExpMin,
      page: 1,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTitle, debouncedLocation, debouncedExpMin]);

  const hasActive = localTitle || localLocation || localExpMin || (filters.ordering && filters.ordering !== '-created_at');

  const reset = () => {
    setLocalTitle('');
    setLocalLocation('');
    setLocalExpMin('');
    onChange({ ordering: '-created_at', page: 1 });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="h-9 px-3 rounded-lg text-xs inline-flex items-center gap-1.5 transition-all"
        style={{
          border: `1px solid ${open || hasActive ? 'rgba(245,158,11,0.4)' : 'rgba(35,42,62,0.8)'}`,
          background: open || hasActive ? 'rgba(245,158,11,0.06)' : 'rgba(16,20,32,0.8)',
          color: open || hasActive ? '#F59E0B' : '#9BA6C4',
        }}
      >
        <SlidersHorizontal size={13} />
        Filters
        {hasActive && (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-0.5" />
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-11 z-30 rounded-xl p-4 space-y-4 w-72"
          style={{ background: '#0D1118', border: '1px solid rgba(35,42,62,0.9)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-brand-text-primary uppercase tracking-wider">Filters</span>
            <div className="flex gap-2">
              {hasActive && (
                <button onClick={reset} className="text-[11px] text-amber-400 hover:text-amber-300 transition-colors">
                  Reset
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-brand-text-disabled hover:text-brand-text-muted transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-medium text-brand-text-muted mb-1.5 uppercase tracking-wider">Title</label>
            <input
              type="text"
              value={localTitle}
              onChange={e => setLocalTitle(e.target.value)}
              placeholder="e.g. Software Engineer"
              className="w-full h-8 px-3 rounded-lg text-xs text-brand-text-primary placeholder-brand-text-disabled outline-none transition-all"
              style={{ background: 'rgba(35,42,62,0.4)', border: '1px solid rgba(35,42,62,0.8)' }}
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-[11px] font-medium text-brand-text-muted mb-1.5 uppercase tracking-wider">Location</label>
            <input
              type="text"
              value={localLocation}
              onChange={e => setLocalLocation(e.target.value)}
              placeholder="e.g. Paris"
              className="w-full h-8 px-3 rounded-lg text-xs text-brand-text-primary placeholder-brand-text-disabled outline-none transition-all"
              style={{ background: 'rgba(35,42,62,0.4)', border: '1px solid rgba(35,42,62,0.8)' }}
            />
          </div>

          {/* Experience */}
          <div>
            <label className="block text-[11px] font-medium text-brand-text-muted mb-1.5 uppercase tracking-wider">
              Max experience — <span className="text-amber-400">{localExpMin ? `${localExpMin} yr` : 'any'}</span>
            </label>
            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={localExpMin || 0}
              onChange={e => setLocalExpMin(e.target.value === '0' ? '' : e.target.value)}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-brand-text-disabled mt-0.5">
              <span>0</span><span>15 yr</span>
            </div>
          </div>

          {/* Ordering */}
          <div>
            <label className="block text-[11px] font-medium text-brand-text-muted mb-1.5 uppercase tracking-wider">Sort by</label>
            <select
              value={filters.ordering ?? '-created_at'}
              onChange={e => onChange({ ...filters, ordering: e.target.value, page: 1 })}
              className="w-full h-8 px-3 rounded-lg text-xs text-brand-text-primary outline-none appearance-none"
              style={{ background: 'rgba(35,42,62,0.4)', border: '1px solid rgba(35,42,62,0.8)' }}
            >
              {ORDERING_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
