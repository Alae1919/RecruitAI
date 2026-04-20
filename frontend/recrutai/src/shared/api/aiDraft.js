// Placeholder — swaps to real /ai/draft-offer endpoint in a single edit.
export async function draftOffer(prompt) {
  await new Promise(r => setTimeout(r, 1400));
  const words = prompt.trim().split(/\s+/);
  return {
    title:      words.slice(0, 4).join(' '),
    location:   'Remote',
    description: `We're looking for a ${words.slice(0, 4).join(' ')} to join our growing team.\n\nYou'll work closely with Product, Design, and Engineering. You'll ship fast, mentor peers, and help us build something people actually want to use.`,
    mustSkills: ['Communication', 'Problem solving', 'Collaboration'],
    niceSkills: ['Startup experience'],
  };
}
