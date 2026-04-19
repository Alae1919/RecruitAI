import React from 'react';
import { useToastContext } from '../../context/ToastContext';

const icons = {
  success: '✓',
  error:   '✕',
  warning: '!',
  info:    'ℹ',
};

const styles = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  error:   'border-red-500/30 bg-red-500/10 text-red-300',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  info:    'border-blue-500/30 bg-blue-500/10 text-blue-300',
};

const iconStyles = {
  success: 'bg-emerald-500 text-white',
  error:   'bg-red-500 text-white',
  warning: 'bg-amber-500 text-gray-900',
  info:    'bg-blue-500 text-white',
};

function Toast({ id, type, message, dismiss }) {
  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border
        bg-white dark:bg-brand-surface shadow-elevated
        border-surface-border dark:border-brand-border
        animate-toast-in min-w-[280px] max-w-sm
      `}
    >
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${iconStyles[type]}`}>
        {icons[type]}
      </span>
      <p className="text-sm text-gray-800 dark:text-brand-text-primary flex-1">{message}</p>
      <button
        onClick={() => dismiss(id)}
        className="text-gray-400 dark:text-brand-text-disabled hover:text-gray-600 dark:hover:text-brand-text-muted text-sm shrink-0 w-5 h-5 flex items-center justify-center"
      >
        ✕
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts, dismiss } = useToastContext();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <Toast {...t} dismiss={dismiss} />
        </div>
      ))}
    </div>
  );
}
