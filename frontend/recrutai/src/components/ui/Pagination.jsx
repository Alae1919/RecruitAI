import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ count, page, pageSize = 20, onChange }) {
  const totalPages = Math.ceil(count / pageSize);
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, count);

  const buttonClass = (active) =>
    `w-8 h-8 rounded-lg text-sm font-medium transition-colors flex items-center justify-center
     ${active
       ? 'text-gray-900'
       : 'text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-elevated'
     }`;

  const activeStyle = {
    background: 'linear-gradient(135deg, rgb(var(--accent-rgb) / 0.85), rgb(var(--accent-bright-rgb) / 0.85))',
  };

  const pages = [];
  const delta = 2;
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between mt-4">
      <span className="text-xs text-brand-text-muted">
        {from}–{to} of {count}
      </span>
      <div className="flex items-center gap-1">
        <button
          className={buttonClass(false)}
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        {pages[0] > 1 && (
          <>
            <button className={buttonClass(false)} onClick={() => onChange(1)}>1</button>
            {pages[0] > 2 && <span className="px-1 text-brand-text-muted text-xs">…</span>}
          </>
        )}
        {pages.map(p => (
          <button
            key={p}
            className={buttonClass(p === page)}
            style={p === page ? activeStyle : undefined}
            onClick={() => onChange(p)}
          >
            {p}
          </button>
        ))}
        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span className="px-1 text-brand-text-muted text-xs">…</span>}
            <button className={buttonClass(false)} onClick={() => onChange(totalPages)}>{totalPages}</button>
          </>
        )}
        <button
          className={buttonClass(false)}
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
