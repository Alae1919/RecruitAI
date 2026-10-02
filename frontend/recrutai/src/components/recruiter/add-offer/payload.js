// Maps the wizard's form state onto the JobOffer API payload.

const EMPLOYMENT_TYPES = {
  'Full-time': 'full_time',
  'Part-time': 'part_time',
  'Contract': 'contract',
  'Internship': 'internship',
};

const toYears = (v) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

export function buildOfferPayload(data, status = 'open') {
  const must = data.mustSkills ?? [];
  const nice = data.niceSkills ?? [];
  const min = toYears(data.yearsMin);
  const max = toYears(data.yearsMax);

  return {
    title: (data.title || '').trim(),
    description: data.description || '',
    location: data.location || '',
    salary_range: data.salary_range || '',
    department: data.department || '',
    employment_type: EMPLOYMENT_TYPES[data.type] ?? 'full_time',
    skills: must,
    nice_skills: nice,
    // kept as free text too: the edit modal and AI description generator read it
    requirements: [...must, ...nice].join(', ') || data.requirements || '',
    experience_min: min,
    experience_max: Math.max(min, max),
    screening_config: { ...data.screening },
    status,
  };
}

/** What blocks publishing/saving, or null when the form is ready. */
export function validateOffer(data, status) {
  if (!(data.title || '').trim()) return 'Add a job title first.';
  if (status !== 'draft' && !(data.description || '').trim()) return 'Add a description before publishing.';
  return null;
}
