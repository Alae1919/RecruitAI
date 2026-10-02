import React, { useState } from 'react';
import { useOverrideDecision } from '../../shared/hooks/useEvaluations';
import { useToast } from '../../hooks/useToast';
import Button from '../ui/Button';

const DECISIONS = [
  { value: 'accepted', label: 'Accept' },
  { value: 'rejected', label: 'Reject' },
];

export default function OverrideDecisionForm({ interviewId, currentDecision }) {
  const [open, setOpen]         = useState(false);
  const [decision, setDecision] = useState(currentDecision ?? 'accepted');
  const [reasoning, setReasoning] = useState('');
  const overrideMut             = useOverrideDecision(interviewId);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reasoning.trim()) { toast.error('Please provide a reasoning.'); return; }
    try {
      await overrideMut.mutateAsync({ decision, reasoning });
      toast.success('Decision overridden.');
      setOpen(false);
      setReasoning('');
    } catch {
      toast.error('Failed to override decision.');
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2.5 rounded-xl text-xs font-medium text-brand-text-muted transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50"
        style={{ border: '1px solid rgba(35,42,62,0.8)', background: 'rgba(16,20,32,0.6)' }}
        onMouseEnter={e => { e.currentTarget.style.color = '#F59E0B'; e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = 'rgba(35,42,62,0.8)'; }}>
        Override decision
      </button>
    );
  }

  return (
    <div className="rounded-xl p-4 space-y-3"
      style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.2)' }}>
      <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Override Decision</div>

      <div className="flex gap-2">
        {DECISIONS.map(d => (
          <button key={d.value}
            onClick={() => setDecision(d.value)}
            className="flex-1 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: decision === d.value
                ? (d.value === 'accepted' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)')
                : 'rgba(35,42,62,0.4)',
              border: `1px solid ${decision === d.value
                ? (d.value === 'accepted' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.3)')
                : 'rgba(35,42,62,0.7)'}`,
              color: decision === d.value
                ? (d.value === 'accepted' ? '#10B981' : '#F87171')
                : '#9BA6C4',
            }}>
            {d.label}
          </button>
        ))}
      </div>

      <textarea
        rows={2}
        value={reasoning}
        onChange={e => setReasoning(e.target.value)}
        placeholder="Explain why you're overriding the AI decision…"
        className="w-full px-3 py-2 rounded-lg text-xs text-brand-text-primary placeholder-brand-text-disabled outline-none resize-none"
        style={{ background: 'rgba(35,42,62,0.4)', border: '1px solid rgba(35,42,62,0.8)' }}
      />

      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => setOpen(false)} disabled={overrideMut.isPending}>
          Cancel
        </Button>
        <Button size="sm" loading={overrideMut.isPending} onClick={handleSubmit}>
          Confirm Override
        </Button>
      </div>
    </div>
  );
}
