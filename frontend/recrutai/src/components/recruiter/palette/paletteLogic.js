// Pure helpers for the ⌘K command palette (kept separate so they can be unit tested).
import { STAGE_META } from '../candidates/stages';

export const NAV_ACTIONS = [
  { id: 'nav-offers',     group: 'Go to', label: 'Job offers',  hint: 'Manage your offers',          to: '/recruiter-dashboard/view-offers' },
  { id: 'nav-candidates', group: 'Go to', label: 'Candidates',  hint: 'Pipeline for an offer',        to: '/recruiter-dashboard/recruiter_candidate' },
  { id: 'nav-post',       group: 'Go to', label: 'Post a job',  hint: 'Create a new offer',           to: '/recruiter-dashboard/add-offers' },
  { id: 'nav-interviews', group: 'Go to', label: 'Interviews',  hint: 'AI-evaluated interviews',      to: '/recruiter-dashboard/recruiter_candidate_entretien' },
  { id: 'nav-profile',    group: 'Go to', label: 'Profile',     hint: 'Your company profile',         to: '/recruiter-dashboard/profile' },
];

/** Ctrl+K on Windows/Linux, ⌘K on macOS. */
export function isPaletteShortcut(e) {
  return Boolean((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && String(e.key).toLowerCase() === 'k');
}

/**
 * Flat, ordered list of palette results. With no query only the navigation shortcuts show;
 * otherwise matching candidates first, then offers, then matching shortcuts.
 */
export function buildPaletteItems({ query = '', offers = [], candidates = [] } = {}) {
  const q = query.trim().toLowerCase();
  const nav = NAV_ACTIONS.filter(a => !q || a.label.toLowerCase().includes(q));
  if (!q) return nav;

  const candidateItems = candidates.slice(0, 8).map(c => ({
    id: `candidate-${c.id}`,
    group: 'Candidates',
    label: c.candidate_name,
    hint: `${c.offer_title} · ${STAGE_META[c.stage]?.label ?? c.stage}`,
    to: `/recruiter-dashboard/recruiter_candidate?offer=${c.offer_id}&candidate=${c.id}`,
  }));
  const offerItems = offers.slice(0, 5).map(o => ({
    id: `offer-${o.id}`,
    group: 'Offers',
    label: o.title,
    hint: [o.status, o.location].filter(Boolean).join(' · '),
    to: `/recruiter-dashboard/recruiter_candidate?offer=${o.id}`,
  }));
  return [...candidateItems, ...offerItems, ...nav];
}

/** Items split into labelled groups (order preserved), each carrying its index in the flat list. */
export function groupItems(items) {
  const groups = [];
  items.forEach((item, index) => {
    let g = groups[groups.length - 1];
    if (!g || g.group !== item.group) { g = { group: item.group, items: [] }; groups.push(g); }
    g.items.push({ ...item, index });
  });
  return groups;
}

/** Move the highlighted index by `delta`, wrapping around; -1 when the list is empty. */
export function moveSelection(index, delta, length) {
  if (!length) return -1;
  return (((index + delta) % length) + length) % length;
}
