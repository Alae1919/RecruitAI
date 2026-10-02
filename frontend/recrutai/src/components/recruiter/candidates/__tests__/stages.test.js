import { STAGES, nextStageAction, canReject, countByStage, visibleCandidates } from '../stages';

const mk = (id, stage, match_score, applied_at, name = `Cand ${id}`) =>
  ({ id, stage, match_score, applied_at, candidate_name: name });

const LIST = [
  mk(1, 'applied', 60, '2026-10-01T10:00:00Z', 'Amira'),
  mk(2, 'screening', 90, '2026-09-30T10:00:00Z', 'Tomás'),
  mk(3, 'interview', null, '2026-10-02T10:00:00Z', 'Priya'),
  mk(4, 'rejected', 80, '2026-09-29T10:00:00Z', 'Miguel'),
];

describe('nextStageAction', () => {
  it('invites from applied/screening, then offer, then hired, then nothing', () => {
    expect(nextStageAction('applied').label).toBe('Invite to interview');
    expect(nextStageAction('screening').label).toBe('Invite to interview');
    expect(nextStageAction('interview').label).toBe('Make offer');
    expect(nextStageAction('offer').label).toBe('Mark as hired');
    expect(nextStageAction('hired')).toBeNull();
    expect(nextStageAction('rejected')).toBeNull();
  });
});

describe('canReject', () => {
  it('is false for already rejected or hired candidates', () => {
    expect(canReject('applied')).toBe(true);
    expect(canReject('offer')).toBe(true);
    expect(canReject('rejected')).toBe(false);
    expect(canReject('hired')).toBe(false);
  });
});

describe('countByStage', () => {
  it('counts every pipeline stage plus all and rejected', () => {
    expect(countByStage(LIST)).toEqual({
      all: 4, applied: 1, screening: 1, interview: 1, offer: 0, hired: 0, rejected: 1,
    });
  });

  it('treats unknown stages as applied', () => {
    expect(countByStage([mk(9, undefined, 1, null)]).applied).toBe(1);
  });

  it('exposes all five pipeline stages in order', () => {
    expect(STAGES).toEqual(['applied', 'screening', 'interview', 'offer', 'hired']);
  });
});

describe('visibleCandidates', () => {
  it('sorts by match descending with unscored candidates last', () => {
    expect(visibleCandidates(LIST).map(c => c.id)).toEqual([2, 4, 1, 3]);
  });

  it('sorts by most recent application', () => {
    expect(visibleCandidates(LIST, { sort: 'recent' }).map(c => c.id)).toEqual([3, 1, 2, 4]);
  });

  it('filters by stage', () => {
    expect(visibleCandidates(LIST, { stage: 'screening' }).map(c => c.id)).toEqual([2]);
  });

  it('filters by name, case-insensitively', () => {
    expect(visibleCandidates(LIST, { query: 'PRI' }).map(c => c.id)).toEqual([3]);
  });

  it('does not mutate the input', () => {
    const copy = [...LIST];
    visibleCandidates(LIST, { sort: 'recent' });
    expect(LIST).toEqual(copy);
  });
});
