import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Button, Input } from '../../ui/index';
import { messageTemplates, validateMessage } from './messageTemplates';

/** Compose an email to a candidate, optionally from a template. */
export default function MessageModal({ isOpen, onClose, candidate, recruiterName, onSubmit, busy }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState(null);

  const templates = useMemo(
    () => messageTemplates({ candidateName: candidate?.candidate_name, jobTitle: candidate?.job_offer_title, recruiterName }),
    [candidate, recruiterName],
  );

  useEffect(() => {
    if (isOpen) { setSubject(''); setBody(''); setError(null); }
  }, [isOpen, candidate?.id]);

  const apply = (t) => { setSubject(t.subject); setBody(t.body); setError(null); };

  const submit = () => {
    const problem = validateMessage({ subject, body });
    if (problem) { setError(problem); return; }
    onSubmit({ subject: subject.trim(), body: body.trim() });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Message ${candidate?.candidate_name ?? 'candidate'}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={busy} onClick={submit}>Send email</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Templates">
          <span className="text-[11px] font-mono uppercase tracking-wider text-brand-text-disabled self-center mr-1">Templates</span>
          {templates.map(t => (
            <button key={t.key} type="button" onClick={() => apply(t)}
              className="h-7 px-2.5 rounded-lg text-xs text-brand-text-muted hover:text-brand-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
              style={{ border: '1px solid rgba(35,42,62,0.8)', background: 'rgba(16,20,32,0.6)' }}>
              {t.label}
            </button>
          ))}
        </div>
        <Input label="Subject" name="subject" value={subject} required
          onChange={e => { setSubject(e.target.value); setError(null); }} />
        <Input label="Message" name="body" as="textarea" value={body} required className="min-h-[160px]"
          onChange={e => { setBody(e.target.value); setError(null); }}
          hint={`Sent to ${candidate?.candidate_email ?? 'the candidate'} with your name and company as the signature.`} />
        {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
      </div>
    </Modal>
  );
}
