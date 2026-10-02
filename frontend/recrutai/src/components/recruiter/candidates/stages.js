// Recruiter pipeline: the stages the backend derives (Application.stage) and
// the helpers the candidates views share.

export const STAGES = ['applied', 'screening', 'interview', 'offer', 'hired'];

export const STAGE_META = {
  applied:   { label: 'Applied',   dot: '#59628A' },
  screening: { label: 'Screening', dot: '#38BDF8' },
  interview: { label: 'Interview', dot: '#F59E0B' },
  offer:     { label: 'Offer',     dot: '#34D399' },
  hired:     { label: 'Hired',     dot: '#A78BFA' },
  rejected:  { label: 'Rejected',  dot: '#F87171' },
};

/** The primary "move forward" action available for a candidate in `stage`, or null. */
export function nextStageAction(stage) {
  switch (stage) {
    case 'applied':
    case 'screening':
      return { label: 'Invite to interview', done: 'Candidate invited to interview.' };
    case 'interview':
      return { label: 'Make offer', done: 'Offer stage reached.' };
    case 'offer':
      return { label: 'Mark as hired', done: 'Candidate marked as hired.' };
    default:
      return null;
  }
}

export const canReject = (stage) => stage !== 'rejected' && stage !== 'hired';

export function countByStage(candidates) {
  const counts = { all: candidates.length, rejected: 0 };
  STAGES.forEach(s => { counts[s] = 0; });
  candidates.forEach(c => {
    const key = c.stage in counts ? c.stage : 'applied';
    counts[key] += 1;
  });
  return counts;
}

/** Filter by stage ('all' keeps everyone, including rejected) and sort. */
export function visibleCandidates(candidates, { stage = 'all', sort = 'match', query = '' } = {}) {
  const q = query.trim().toLowerCase();
  const list = candidates.filter(c =>
    (stage === 'all' || c.stage === stage) &&
    (!q || (c.candidate_name || '').toLowerCase().includes(q)),
  );
  const byMatch = (a, b) => (b.match_score ?? -1) - (a.match_score ?? -1);
  const byRecent = (a, b) => Date.parse(b.applied_at || 0) - Date.parse(a.applied_at || 0);
  return [...list].sort(sort === 'recent' ? byRecent : byMatch);
}

const TIMELINE_STEPS = [
  { key: 'applied',     label: 'Applied' },
  { key: 'ai_screened', label: 'AI-screened' },
  { key: 'interview',   label: 'Interview invited' },
  { key: 'evaluated',   label: 'AI evaluation' },
  { key: 'offer',       label: 'Offer made' },
  { key: 'hired',       label: 'Hired' },
];

/**
 * Merge the events the backend recorded with the steps still ahead.
 * Each step is 'done', 'current' (latest reached) or 'upcoming'.
 * A rejected candidate keeps only the steps they reached, followed by "Rejected".
 */
export function buildTimeline(events = []) {
  const reached = new Map(events.map(e => [e.key, e]));
  const rejected = reached.get('rejected');

  let steps = TIMELINE_STEPS.map(s => ({ ...s, at: reached.get(s.key)?.at ?? null, reached: reached.has(s.key) }));
  if (rejected) {
    steps = steps.filter(s => s.reached);
    steps.push({ key: 'rejected', label: 'Rejected', at: rejected.at, reached: true });
  }

  let lastReached = -1;
  steps.forEach((s, i) => { if (s.reached) lastReached = i; });
  return steps.map((s, i) => ({
    key: s.key,
    label: s.label,
    at: s.at,
    state: !s.reached ? 'upcoming' : i === lastReached ? 'current' : 'done',
  }));
}
