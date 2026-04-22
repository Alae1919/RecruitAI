import React, { useEffect, useState } from 'react';
import Spinner from './Spinner';
import Button from './Button';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AsyncTaskBanner({ state, label = 'Processing', onRetry }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (state !== 'pending') return;
    setElapsed(0);
    const id = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [state]);

  if (state === 'idle') return null;

  if (state === 'success') {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-green-400"
        style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
        <CheckCircle2 size={16} />
        <span>Done</span>
      </div>
    );
  }

  if (state === 'failed' || state === 'timeout') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400"
        style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
        <AlertCircle size={16} className="shrink-0" />
        <span className="flex-1">{state === 'timeout' ? 'Generation timed out.' : 'Something went wrong.'}</span>
        {onRetry && <Button variant="ghost" size="sm" onClick={onRetry}>Retry</Button>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-brand-text-muted"
      style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
      <Spinner size="sm" />
      <span className="flex-1 text-brand-text-primary">{label}…</span>
      {elapsed > 0 && <span className="tabular-nums text-xs">{elapsed}s</span>}
    </div>
  );
}
