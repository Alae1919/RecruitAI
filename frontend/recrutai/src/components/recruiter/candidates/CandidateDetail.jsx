import React from 'react';
import { Brain, Check, X, Download, MapPin, Mail, Phone, ArrowRight, CalendarClock } from 'lucide-react';
import Avatar from '../../ui/Avatar';
import StatusBadge from '../../ui/StatusBadge';
import MatchRing from './MatchRing';
import { STAGE_META, nextStageAction, canReject, buildTimeline } from './stages';
import { timeAgo } from '../../../shared/utils/time';
import { formatDue } from '../../../shared/utils/datetime';

function Section({ title, children }) {
  return (
    <section>
      <h3 className="text-[10px] font-mono uppercase tracking-widest text-brand-text-disabled mb-3">{title}</h3>
      {children}
    </section>
  );
}

function Tag({ children }) {
  return (
    <span className="px-2 h-6 inline-flex items-center rounded-md text-xs text-brand-text-muted"
      style={{ background: 'rgba(24,30,46,0.9)', border: '1px solid rgba(35,42,62,0.8)' }}>
      {children}
    </span>
  );
}

const FLAG_STYLES = {
  strength: { mark: '✓', cls: 'text-emerald-300', bg: 'rgba(16,185,129,0.05)', border: 'rgba(16,185,129,0.2)' },
  gap:      { mark: '~', cls: 'text-amber-300',   bg: 'rgba(245,158,11,0.05)', border: 'rgba(245,158,11,0.2)' },
};

function Flag({ kind, text }) {
  const f = FLAG_STYLES[kind];
  return (
    <li className={`px-3 py-2 rounded-lg text-xs flex items-start gap-2 ${f.cls}`}
      style={{ background: f.bg, border: `1px solid ${f.border}` }}>
      <span className="font-mono mt-0.5" aria-hidden="true">{f.mark}</span>
      <span className="leading-snug">
        <span className="sr-only">{kind === 'strength' ? 'Strength: ' : 'Gap: '}</span>
        {text}
      </span>
    </li>
  );
}

function AiAssessment({ candidate }) {
  const { analysis } = candidate;
  return (
    <div className="mt-8 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.05)' }}>
      <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(245,158,11,0.2)' }}>
        <div className="w-7 h-7 rounded-md grid place-items-center" style={{ background: 'rgba(245,158,11,0.2)', color: '#F59E0B' }}>
          <Brain size={13} />
        </div>
        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#F59E0B' }}>AI assessment</h3>
        {analysis?.analyzed_at && (
          <span className="ml-auto text-[10px] font-mono text-brand-text-disabled">updated {timeAgo(analysis.analyzed_at)}</span>
        )}
      </div>
      <div className="p-5 space-y-4">
        {analysis ? (
          <>
            {analysis.recommendation && (
              <p className="text-sm text-brand-text-primary leading-relaxed">{analysis.recommendation}</p>
            )}
            {(analysis.strengths.length > 0 || analysis.gaps.length > 0) && (
              <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                {analysis.strengths.map((t, i) => <Flag key={`s${i}`} kind="strength" text={t} />)}
                {analysis.gaps.map((t, i) => <Flag key={`g${i}`} kind="gap" text={t} />)}
              </ul>
            )}
          </>
        ) : (
          <p className="text-sm text-brand-text-muted">
            No analysis yet. The score appears once the resume has been parsed and compared with this offer.
          </p>
        )}
      </div>
    </div>
  );
}

const DECISION_LABELS = { accepted: 'AI: accept', rejected: 'AI: reject', undecided: 'Pending review' };

function InterviewQuestions({ interview }) {
  if (!interview) {
    return <p className="text-sm text-brand-text-muted">Questions are generated when the candidate is invited to interview.</p>;
  }
  const { questions, evaluation } = interview;
  return (
    <div className="space-y-3">
      {interview.status === 'available' && interview.interview_date && (
        <div className="text-xs text-brand-text-muted flex items-center gap-1.5">
          <CalendarClock size={12} /> Due by <span className="font-mono text-brand-text-primary">{formatDue(interview.interview_date)}</span>
        </div>
      )}
      {evaluation && (
        <div className="flex items-center gap-2 text-xs text-brand-text-muted">
          <StatusBadge status={evaluation.decision} label={DECISION_LABELS[evaluation.decision]} />
          <span className="font-mono">AI score {evaluation.total_score.toFixed(1)} / 10</span>
        </div>
      )}
      {questions.length === 0 ? (
        <p className="text-sm text-brand-text-muted">No questions yet — personalised ones are still being generated.</p>
      ) : (
        <ol className="space-y-3">
          {questions.map((q, i) => (
            <li key={q.id} className="flex gap-3 p-3 rounded-lg"
              style={{ background: 'rgba(24,30,46,0.4)', border: '1px solid rgba(35,42,62,0.8)' }}>
              <span className="w-7 h-7 rounded-md grid place-items-center font-mono text-[11px] shrink-0"
                style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>Q{i + 1}</span>
              <p className="text-sm text-brand-text-primary leading-relaxed flex-1">{q.text}</p>
              {q.source === 'probe' && (
                <span className="self-start text-[10px] font-mono px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(124,58,237,0.15)', color: '#C4B5FD' }}
                  title="Generated from this candidate's CV">
                  CV-based
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function Timeline({ events }) {
  const steps = buildTimeline(events);
  return (
    <ol className="relative pl-5 space-y-3 before:absolute before:left-[7px] before:top-1.5 before:bottom-1.5 before:w-px before:bg-brand-border">
      {steps.map(s => (
        <li key={s.key} className="relative" aria-current={s.state === 'current' ? 'step' : undefined}>
          <span className="absolute -left-5 top-1 w-3 h-3 rounded-full border-2"
            style={s.state === 'current'
              ? { background: '#F59E0B', borderColor: '#090C14' }
              : s.state === 'done'
                ? { background: '#59628A', borderColor: '#59628A' }
                : { background: '#090C14', borderColor: '#59628A' }} />
          <div className={`text-sm font-medium ${s.state === 'upcoming' ? 'text-brand-text-disabled' : ''}`}>{s.label}</div>
          <div className="text-[11px] font-mono text-brand-text-disabled">{s.at ? timeAgo(s.at) : '—'}</div>
        </li>
      ))}
    </ol>
  );
}

export default function CandidateDetail({ candidate, busy, onAdvance, onReject, onViewResume, onSchedule }) {
  const next = nextStageAction(candidate.stage);
  const canSchedule = candidate.interview?.status === 'available';
  const profile = candidate.resume_profile;
  const experience = (profile?.experience ?? []).filter(e => e && typeof e === 'object');

  return (
    <div className="p-8 max-w-[920px] animate-fadeIn">
      <div className="flex items-start gap-5">
        <Avatar name={candidate.candidate_name} size={72} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="text-2xl font-bold tracking-tight text-brand-text-primary">{candidate.candidate_name}</h2>
            <StatusBadge status={candidate.stage} label={STAGE_META[candidate.stage]?.label} />
          </div>
          {candidate.headline && <div className="text-sm text-brand-text-muted">{candidate.headline}</div>}
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3 text-xs text-brand-text-muted">
            {candidate.candidate_address && <span className="flex items-center gap-1.5"><MapPin size={12} />{candidate.candidate_address}</span>}
            {candidate.candidate_email && <span className="flex items-center gap-1.5"><Mail size={12} />{candidate.candidate_email}</span>}
            {candidate.candidate_phone && <span className="flex items-center gap-1.5"><Phone size={12} />{candidate.candidate_phone}</span>}
          </div>
        </div>
        <MatchRing score={candidate.match_score} size={72} stroke={6} />
      </div>

      <div className="flex gap-2 mt-6 flex-wrap">
        {next && (
          <button onClick={() => onAdvance(candidate)} disabled={busy}
            className="h-9 px-4 text-sm rounded-xl font-semibold inline-flex items-center gap-1.5 transition-all active:scale-[.97] disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)', color: '#111827', boxShadow: '0 0 16px rgba(245,158,11,0.25)' }}>
            <Check size={13} strokeWidth={2.5} /> {next.label} <ArrowRight size={13} />
          </button>
        )}
        {canSchedule && (
          <button onClick={() => onSchedule(candidate)}
            className="h-9 px-3 text-sm rounded-xl inline-flex items-center gap-1.5 transition-colors text-brand-text-muted hover:text-brand-accent"
            style={{ border: '1px solid rgba(35,42,62,0.8)', background: 'rgba(16,20,32,0.6)' }}>
            <CalendarClock size={13} /> Schedule interview
          </button>
        )}
        {candidate.resume_url && (
          <button onClick={() => onViewResume(candidate.resume_url)}
            className="h-9 px-3 text-sm rounded-xl inline-flex items-center gap-1.5 transition-colors text-brand-text-muted hover:text-brand-accent"
            style={{ border: '1px solid rgba(35,42,62,0.8)', background: 'rgba(16,20,32,0.6)' }}>
            <Download size={13} /> Resume
          </button>
        )}
        {canReject(candidate.stage) && (
          <button onClick={() => onReject(candidate)} disabled={busy}
            className="h-9 px-4 text-sm rounded-xl inline-flex items-center gap-1.5 transition-colors font-medium text-red-300 ml-auto hover:bg-red-500/20 disabled:opacity-50"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <X size={13} strokeWidth={2.5} /> Reject
          </button>
        )}
      </div>

      <AiAssessment candidate={candidate} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 mt-8">
        <div className="space-y-6">
          {profile?.summary && (
            <Section title="Summary">
              <p className="text-sm text-brand-text-muted leading-relaxed">{profile.summary}</p>
            </Section>
          )}
          {experience.length > 0 && (
            <Section title="Experience (from CV)">
              <ul className="space-y-2">
                {experience.map((e, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 bg-brand-accent" />
                    <span className="flex-1 text-brand-text-primary">
                      {[e.role, e.company].filter(Boolean).join(' · ') || 'Role not detected'}
                    </span>
                    {e.years != null && <span className="text-[11px] font-mono text-brand-text-disabled">{e.years} yr</span>}
                  </li>
                ))}
              </ul>
            </Section>
          )}
          <Section title="Interview questions">
            <InterviewQuestions interview={candidate.interview} />
          </Section>
        </div>

        <div className="space-y-6">
          {(profile?.skills?.length > 0) && (
            <Section title="Skills">
              <div className="flex flex-wrap gap-1.5">{profile.skills.map(s => <Tag key={s}>{s}</Tag>)}</div>
            </Section>
          )}
          {(profile?.languages?.length > 0) && (
            <Section title="Languages">
              <div className="flex flex-wrap gap-1.5">{profile.languages.map(l => <Tag key={l}>{l}</Tag>)}</div>
            </Section>
          )}
          <Section title="Timeline">
            <Timeline events={candidate.timeline} />
          </Section>
        </div>
      </div>
    </div>
  );
}
