import { buildOfferPayload, validateOffer } from '../payload';

const FORM = {
  title: '  Senior Frontend Engineer ',
  department: 'Engineering',
  location: 'Remote',
  type: 'Contract',
  salary_range: '75k–95k',
  description: 'Own the design system.',
  requirements: '',
  mustSkills: ['React', 'TypeScript'],
  niceSkills: ['Storybook'],
  yearsMin: 5,
  yearsMax: 10,
  screening: { cv: true, cover: false, video: true, questions: 5, auto_shortlist: true },
};

describe('buildOfferPayload', () => {
  it('sends every field the wizard collects', () => {
    expect(buildOfferPayload(FORM)).toEqual({
      title: 'Senior Frontend Engineer',
      description: 'Own the design system.',
      location: 'Remote',
      salary_range: '75k–95k',
      department: 'Engineering',
      employment_type: 'contract',
      skills: ['React', 'TypeScript'],
      nice_skills: ['Storybook'],
      requirements: 'React, TypeScript, Storybook',
      experience_min: 5,
      experience_max: 10,
      screening_config: { cv: true, cover: false, video: true, questions: 5, auto_shortlist: true },
      status: 'open',
    });
  });

  it('passes the requested status through', () => {
    expect(buildOfferPayload(FORM, 'draft').status).toBe('draft');
  });

  it('never sends a max below the min', () => {
    const p = buildOfferPayload({ ...FORM, yearsMin: 6, yearsMax: 2 });
    expect([p.experience_min, p.experience_max]).toEqual([6, 6]);
  });

  it('tolerates cleared number inputs', () => {
    const p = buildOfferPayload({ ...FORM, yearsMin: '', yearsMax: NaN });
    expect([p.experience_min, p.experience_max]).toEqual([0, 0]);
  });

  it('falls back to typed requirements when no skills were added', () => {
    const p = buildOfferPayload({ ...FORM, mustSkills: [], niceSkills: [], requirements: 'Go, SQL' });
    expect(p.requirements).toBe('Go, SQL');
  });

  it('defaults unknown employment types to full time', () => {
    expect(buildOfferPayload({ ...FORM, type: 'Freelance' }).employment_type).toBe('full_time');
  });
});

describe('validateOffer', () => {
  it('requires a title always and a description unless drafting', () => {
    expect(validateOffer({ title: ' ', description: 'x' }, 'open')).toMatch(/title/i);
    expect(validateOffer({ title: 'T', description: '' }, 'open')).toMatch(/description/i);
    expect(validateOffer({ title: 'T', description: '' }, 'draft')).toBeNull();
    expect(validateOffer({ title: 'T', description: 'D' }, 'open')).toBeNull();
  });
});
