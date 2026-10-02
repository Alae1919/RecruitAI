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
