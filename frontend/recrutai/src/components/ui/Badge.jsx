import React from 'react';

const variants = {
  success: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  error:   'bg-red-500/10 text-red-300 border-red-500/20',
  warning: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  info:    'bg-blue-500/10 text-blue-300 border-blue-500/20',
  neutral: 'bg-brand-elevated text-brand-text-muted border-brand-border',
  accent:  'bg-brand-accent/10 text-brand-accent border-brand-accent/20',
};

const sizes = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-[11px] px-2 py-0.5',
  lg: 'text-xs px-2.5 py-1',
};

export default function Badge({ variant = 'neutral', size = 'md', children, className = '' }) {
  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}
