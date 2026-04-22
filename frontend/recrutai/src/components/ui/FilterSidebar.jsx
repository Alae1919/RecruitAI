import React, { useState } from 'react';
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';

function FilterSection({ label, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b last:border-b-0" style={{ borderColor: 'rgba(35,42,62,0.7)' }}>
      <button
        className="w-full flex items-center justify-between py-3 px-4 text-sm font-medium text-brand-text-primary hover:text-brand-accent transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        {label}
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export default function FilterSidebar({ children, onReset }) {
  return (
    <aside className="w-64 shrink-0 rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #131826 0%, #101420 100%)',
        border: '1px solid rgba(35,42,62,0.9)',
      }}>
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid rgba(35,42,62,0.7)' }}>
        <div className="flex items-center gap-2 text-sm font-semibold text-brand-text-primary">
          <SlidersHorizontal size={14} className="text-brand-accent" />
          Filters
        </div>
        {onReset && (
          <button
            onClick={onReset}
            className="text-xs text-brand-text-muted hover:text-brand-accent transition-colors"
          >
            Reset
          </button>
        )}
      </div>
      {children}
    </aside>
  );
}

FilterSidebar.Section = FilterSection;
