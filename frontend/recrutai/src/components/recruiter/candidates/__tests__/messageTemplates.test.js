import { messageTemplates, validateMessage } from '../messageTemplates';

describe('messageTemplates', () => {
  const templates = messageTemplates({ candidateName: 'Amira El-Khalil', jobTitle: 'Frontend Engineer', recruiterName: 'Sara Ben Ali' });

  it('offers distinct ready-to-send templates', () => {
    expect(templates.map(t => t.key)).toEqual(['availability', 'more-info', 'thanks']);
    expect(new Set(templates.map(t => t.subject)).size).toBe(3);
  });

  it('personalises greeting, role and signature', () => {
    const t = templates[0];
    expect(t.body.startsWith('Hi Amira,')).toBe(true);
    expect(t.subject).toContain('Frontend Engineer');
    expect(t.body).toContain('Best regards,\nSara Ben Ali');
  });

  it('degrades gracefully without names or a job title', () => {
    const t = messageTemplates()[0];
    expect(t.body.startsWith('Hi there,')).toBe(true);
    expect(t.subject).not.toContain('undefined');
    expect(t.body.endsWith('Best regards')).toBe(true);
  });

  it('every generated template passes validation', () => {
    templates.forEach(t => expect(validateMessage(t)).toBeNull());
  });
});

describe('validateMessage', () => {
  it('requires a subject and a body', () => {
    expect(validateMessage({ subject: ' ', body: 'x' })).toMatch(/subject/i);
    expect(validateMessage({ subject: 'x', body: '' })).toMatch(/message/i);
    expect(validateMessage({})).toMatch(/subject/i);
  });

  it('enforces the server-side length limits', () => {
    expect(validateMessage({ subject: 'x'.repeat(201), body: 'b' })).toMatch(/subject/i);
    expect(validateMessage({ subject: 's', body: 'b'.repeat(5001) })).toMatch(/message/i);
    expect(validateMessage({ subject: 'x'.repeat(200), body: 'b'.repeat(5000) })).toBeNull();
  });
});
