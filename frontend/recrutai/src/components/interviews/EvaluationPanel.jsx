import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Brain, Clock } from 'lucide-react';
import { useInterviewEvaluation } from '../../shared/hooks/useEvaluations';
import AsyncTaskBanner from '../ui/AsyncTaskBanner';

const DECISION_CONFIG = {
  accepted: { color: '#10B981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)',  label: 'Accepted' },
  rejected: { color: '#F87171', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',    label: 'Rejected' },
};

const SOURCE_CONFIG = {
  rule:      { label: 'AI decision',       color: '#818CF8' },
  recruiter: { label: 'Recruiter override', color: '#F59E0B' },
};

function ScoreBadge({ score, size = 'md' }) {
  if (score == null) return null;
  const pct = Math.min(10, Math.max(0, score));
  const color = pct >= 7.5 ? '#10B981' : pct >= 5 ? '#F59E0B' : '#EF4444';
  const textSize = size === 'lg' ? 'text-4xl' : 'text-sm';
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`${textSize} font-bold font-mono`} style={{ color }}>{pct.toFixed(1)}</span>
      <span className="text-[10px] text-brand-text-disabled">/ 10</span>
    </div>
  );
}

function AnswerRow({ answerEval, index }) {
  const [open, setOpen] = useState(false);
  const score = answerEval.final_score;
  const color = score >= 7.5 ? '#10B981' : score >= 5 ? '#F59E0B' : '#EF4444';

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(35,42,62,0.7)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
        style={{ background: open ? 'rgba(35,42,62,0.5)' : 'rgba(16,20,32,0.6)' }}
      >
        <span className="text-[10px] font-mono text-brand-text-disabled w-5 text-right shrink-0">Q{index + 1}</span>
        <p className="flex-1 text-sm text-brand-text-muted line-clamp-1">{answerEval.question_text}</p>
        <span className="font-mono text-sm font-bold shrink-0" style={{ color }}>{score?.toFixed(1)}</span>
        {open ? <ChevronDown size={14} className="text-brand-text-disabled shrink-0" /> : <ChevronRight size={14} className="text-brand-text-disabled shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-2 space-y-3" style={{ background: 'rgba(12,15,25,0.6)', borderTop: '1px solid rgba(35,42,62,0.5)' }}>
          <p className="text-sm font-medium text-brand-text-primary">{answerEval.question_text}</p>
          {answerEval.transcript && (
            <div className="px-3 py-2 rounded-lg text-xs text-brand-text-muted leading-relaxed"
              style={{ background: 'rgba(35,42,62,0.4)', border: '1px solid rgba(35,42,62,0.7)' }}>
              <span className="block text-[10px] font-mono text-brand-text-disabled mb-1 uppercase tracking-wider">Transcript</span>
              {answerEval.transcript}
            </div>
          )}
          {answerEval.explanation && (
            <div className="px-3 py-2 rounded-lg text-xs text-brand-text-muted leading-relaxed"
              style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <span className="block text-[10px] font-mono mb-1 uppercase tracking-wider" style={{ color: '#818CF8' }}>AI Feedback</span>
              {answerEval.explanation}
            </div>
          )}
          <div className="flex flex-wrap gap-3 text-[10px] text-brand-text-disabled font-mono">
            {answerEval.model_used && <span>model: {answerEval.model_used}</span>}
            {answerEval.prompt_version && <span>prompt: {answerEval.prompt_version}</span>}
            {answerEval.evaluated_at && (
              <span className="inline-flex items-center gap-1">
                <Clock size={9} /> {new Date(answerEval.evaluated_at).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EvaluationPanel({ interviewId, readOnly = false, footer }) {
  const { data: evaluation, isLoading } = useInterviewEvaluation(interviewId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => <div key={i} className="h-12 rounded-xl animate-pulse" style={{ background: 'rgba(35,42,62,0.4)' }} />)}
      </div>
    );
  }

  if (evaluation === null) {
    return <AsyncTaskBanner state="pending" label="Evaluation in progress" />;
  }

  if (!evaluation) {
    return <p className="text-sm text-brand-text-muted">No evaluation available yet.</p>;
  }

  const decisionCfg = DECISION_CONFIG[evaluation.decision] ?? DECISION_CONFIG.rejected;
  const sourceCfg   = SOURCE_CONFIG[evaluation.decision_source] ?? SOURCE_CONFIG.rule;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 rounded-xl"
        style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)' }}>
        <ScoreBadge score={evaluation.total_score} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: decisionCfg.bg, border: `1px solid ${decisionCfg.border}`, color: decisionCfg.color }}>
              {decisionCfg.label}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(35,42,62,0.6)', border: '1px solid rgba(35,42,62,0.8)', color: sourceCfg.color }}>
              <Brain size={10} className="inline mr-1" />{sourceCfg.label}
            </span>
          </div>
          {evaluation.reasoning && (
            <p className="text-xs text-brand-text-muted leading-relaxed line-clamp-3">{evaluation.reasoning}</p>
          )}
        </div>
      </div>

      {/* Per-answer accordion */}
      {Array.isArray(evaluation.answers) && evaluation.answers.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-brand-text-disabled px-1">Per-answer breakdown</div>
          {evaluation.answers.map((a, i) => (
            <AnswerRow key={i} answerEval={a} index={i} />
          ))}
        </div>
      )}

      {/* Recruiter footer (override form) */}
      {!readOnly && footer}
    </div>
  );
}
