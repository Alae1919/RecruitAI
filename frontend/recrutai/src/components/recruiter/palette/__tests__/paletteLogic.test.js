import { NAV_ACTIONS, isPaletteShortcut, buildPaletteItems, groupItems, moveSelection } from '../paletteLogic';

describe('isPaletteShortcut', () => {
  it('accepts Ctrl+K and Cmd+K in either case', () => {
    expect(isPaletteShortcut({ ctrlKey: true, key: 'k' })).toBe(true);
    expect(isPaletteShortcut({ metaKey: true, key: 'K' })).toBe(true);
  });

  it('ignores plain K, other keys and extra modifiers', () => {
    expect(isPaletteShortcut({ key: 'k' })).toBe(false);
    expect(isPaletteShortcut({ ctrlKey: true, key: 'j' })).toBe(false);
    expect(isPaletteShortcut({ ctrlKey: true, shiftKey: true, key: 'k' })).toBe(false);
    expect(isPaletteShortcut({ ctrlKey: true, altKey: true, key: 'k' })).toBe(false);
  });
});

describe('buildPaletteItems', () => {
  const offers = [{ id: 3, title: 'Senior Frontend Engineer', status: 'open', location: 'Remote' }];
  const candidates = [{ id: 9, candidate_name: 'Amira El-Khalil', offer_id: 3, offer_title: 'Senior Frontend Engineer', stage: 'interview' }];

  it('shows only navigation shortcuts without a query', () => {
    expect(buildPaletteItems({ query: '  ', offers, candidates })).toEqual(NAV_ACTIONS);
  });

  it('lists candidates, then offers, then matching shortcuts for a query', () => {
    const items = buildPaletteItems({ query: 'jobs', offers, candidates });
    expect(items.map(i => i.group)).toEqual(['Candidates', 'Offers']);
    expect(buildPaletteItems({ query: 'job', offers, candidates }).map(i => i.id)).toEqual(['candidate-9', 'offer-3', 'nav-offers', 'nav-post']);
  });

  it('links candidates to their offer with the candidate preselected, and offers to their pipeline', () => {
    const [cand, offer] = buildPaletteItems({ query: 'x', offers, candidates });
    expect(cand.to).toBe('/recruiter-dashboard/recruiter_candidate?offer=3&candidate=9');
    expect(cand.hint).toBe('Senior Frontend Engineer · Interview');
    expect(offer.to).toBe('/recruiter-dashboard/recruiter_candidate?offer=3');
    expect(offer.hint).toBe('open · Remote');
  });

  it('caps results (8 candidates, 5 offers)', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ id: i, candidate_name: `C${i}`, offer_id: 1, offer_title: 'T', stage: 'applied', title: `O${i}` }));
    const items = buildPaletteItems({ query: 'c', offers: many, candidates: many });
    expect(items.filter(i => i.group === 'Candidates')).toHaveLength(8);
    expect(items.filter(i => i.group === 'Offers')).toHaveLength(5);
  });

  it('tolerates missing data', () => {
    expect(buildPaletteItems()).toEqual(NAV_ACTIONS);
    expect(buildPaletteItems({ query: 'zzz' })).toEqual([]);
  });
});

describe('groupItems / moveSelection', () => {
  it('groups consecutive items and keeps their flat index', () => {
    const groups = groupItems([
      { id: 'a', group: 'Candidates' }, { id: 'b', group: 'Candidates' }, { id: 'c', group: 'Go to' },
    ]);
    expect(groups.map(g => [g.group, g.items.map(i => i.index)])).toEqual([['Candidates', [0, 1]], ['Go to', [2]]]);
  });

  it('wraps the selection both ways and handles empty lists', () => {
    expect(moveSelection(0, 1, 3)).toBe(1);
    expect(moveSelection(2, 1, 3)).toBe(0);
    expect(moveSelection(0, -1, 3)).toBe(2);
    expect(moveSelection(0, 1, 0)).toBe(-1);
  });
});
