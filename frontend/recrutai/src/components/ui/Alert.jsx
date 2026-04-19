import React from 'react';

const variants = {
  success: { wrap: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400', icon: '✓' },
  error:   { wrap: 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400', icon: '✕' },
  warning: { wrap: 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400', icon: '!' },
  info:    { wrap: 'bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400', icon: 'ℹ' },
};

export default function Alert({ variant = 'info', children, className = '' }) {
  const { wrap, icon } = variants[variant];
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${wrap} ${className}`}>
      <span className="font-bold mt-0.5 shrink-0">{icon}</span>
      <div>{children}</div>
    </div>
  );
}
