// Quick-start messages a recruiter can send to a candidate. Plain functions so they are easy to test.

export function messageTemplates({ candidateName = '', jobTitle = '', recruiterName = '' } = {}) {
  const first = candidateName.trim().split(/\s+/)[0] || 'there';
  const role = jobTitle ? ` for the ${jobTitle} role` : '';
  const sign = recruiterName ? `\n\nBest regards,\n${recruiterName}` : '\n\nBest regards';

  return [
    {
      key: 'availability',
      label: 'Ask for availability',
      subject: `Your application${role}: availability`,
      body: `Hi ${first},\n\nThank you for applying${role}. Could you let us know when you would be available for a short call this week or next?${sign}`,
    },
    {
      key: 'more-info',
      label: 'Ask for more information',
      subject: `Your application${role}: a quick question`,
      body: `Hi ${first},\n\nWe enjoyed reading your application${role}. Could you tell us a little more about your most recent project and your notice period?${sign}`,
    },
    {
      key: 'thanks',
      label: 'Thank & keep in touch',
      subject: `Thank you for your application${role}`,
      body: `Hi ${first},\n\nThank you for your interest${role}. We have reviewed your profile and will keep it on file for future openings.${sign}`,
    },
  ];
}

/** Why a message cannot be sent yet, or null. */
export function validateMessage({ subject = '', body = '' }) {
  if (!subject.trim()) return 'Add a subject.';
  if (!body.trim()) return 'Write a message.';
  if (subject.length > 200) return 'The subject is too long (200 characters max).';
  if (body.length > 5000) return 'The message is too long (5,000 characters max).';
  return null;
}
