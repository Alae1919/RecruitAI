import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, CornerDownLeft } from 'lucide-react';
import { listOffers } from '../../../shared/api/jobOffers';
import { searchCandidates } from '../../../shared/api/applications';
import { buildPaletteItems, groupItems, moveSelection } from './paletteLogic';

const DEBOUNCE_MS = 200;

/** ⌘K / Ctrl+K quick finder: jump to a candidate, an offer, or any recruiter page. */
export default function CommandPalette({ isOpen, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [offers, setOffers] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);

  const items = useMemo(() => buildPaletteItems({ query, offers, candidates }), [query, offers, candidates]);
  const groups = useMemo(() => groupItems(items), [items]);

  // reset on open
  useEffect(() => {
    if (isOpen) { setQuery(''); setOffers([]); setCandidates([]); setActive(0); setTimeout(() => inputRef.current?.focus(), 0); }
  }, [isOpen]);

  // debounced search; a counter drops answers that arrive after a newer keystroke
  useEffect(() => {
    const q = query.trim();
    if (!isOpen || q.length < 2) { setOffers([]); setCandidates([]); setLoading(false); return undefined; }
    let stale = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const [o, c] = await Promise.all([
          listOffers({ search: q }).then(d => d?.results ?? d ?? []).catch(() => []),
          searchCandidates(q).catch(() => []),
        ]);
        if (!stale) { setOffers(Array.isArray(o) ? o : []); setCandidates(Array.isArray(c) ? c : []); }
      } finally {
        if (!stale) setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => { stale = true; clearTimeout(timer); };
  }, [query, isOpen]);

  useEffect(() => { setActive(items.length ? 0 : -1); }, [items]);

  if (!isOpen) return null;

  const go = (item) => { if (!item) return; onClose(); navigate(item.to); };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => moveSelection(a, 1, items.length)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => moveSelection(a, -1, items.length)); }
    else if (e.key === 'Enter') { e.preventDefault(); go(items[active]); }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[14vh] p-4" role="presentation">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label="Command palette" onKeyDown={onKeyDown}
        className="relative w-full max-w-xl rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #131826 0%, #101420 100%)', border: '1px solid rgba(35,42,62,0.9)', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>
        <div className="flex items-center gap-3 px-4 h-12" style={{ borderBottom: '1px solid rgba(35,42,62,0.8)' }}>
          <Search size={15} className="text-brand-text-disabled shrink-0" />
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
            role="combobox" aria-expanded="true" aria-controls="palette-list"
            aria-activedescendant={active >= 0 && items[active] ? `palette-${items[active].id}` : undefined}
            placeholder="Search candidates, offers, pages…"
            className="flex-1 bg-transparent text-sm text-brand-text-primary placeholder:text-brand-text-disabled outline-none"
            style={{ outline: 'none', boxShadow: 'none', border: 'none' }} />
          {loading && <span className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(245,158,11,0.5)', borderTopColor: 'transparent' }} />}
          <kbd className="text-[10px] font-mono text-brand-text-disabled px-1.5 py-0.5 rounded" style={{ border: '1px solid rgba(35,42,62,0.9)' }}>esc</kbd>
        </div>

        <div id="palette-list" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-brand-text-muted">
              {loading ? 'Searching…' : `No results for “${query.trim()}”.`}
            </p>
          ) : groups.map(g => (
            <div key={g.group} className="mb-1">
              <div className="px-3 pt-2 pb-1 text-[10px] font-mono uppercase tracking-widest text-brand-text-disabled">{g.group}</div>
              {g.items.map(item => {
                const selected = item.index === active;
                return (
                  <div key={item.id} id={`palette-${item.id}`} role="option" aria-selected={selected}
                    onMouseMove={() => setActive(item.index)} onClick={() => go(item)}
                    className="flex items-center gap-3 px-3 h-10 rounded-lg cursor-pointer"
                    style={{ background: selected ? 'rgba(245,158,11,0.1)' : 'transparent' }}>
                    <span className="text-sm text-brand-text-primary truncate">{item.label}</span>
                    {item.hint && <span className="text-xs text-brand-text-disabled truncate flex-1">{item.hint}</span>}
                    {selected && <CornerDownLeft size={12} className="text-brand-accent shrink-0 ml-auto" />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="px-4 h-9 flex items-center gap-4 text-[10px] font-mono text-brand-text-disabled" style={{ borderTop: '1px solid rgba(35,42,62,0.8)' }}>
          <span>↑↓ navigate</span><span>↵ open</span><span>esc close</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
