import React, { useEffect, useState } from 'react';
import { Modal, Button, Input } from '../../ui/index';
import { defaultDueDate, fromLocalInputValue, toLocalInputValue, validateDue } from '../../../shared/utils/datetime';

/** Set when a candidate's asynchronous video interview is due. */
export default function ScheduleInterviewModal({ isOpen, onClose, candidateName, interview, onSubmit, busy }) {
  const [when, setWhen] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const existing = interview?.interview_date ? new Date(interview.interview_date) : null;
    const suggestion = existing && existing.getTime() > Date.now() ? existing : defaultDueDate();
    setWhen(toLocalInputValue(suggestion));
    setLink(interview?.interview_link || '');
    setError(null);
  }, [isOpen, interview]);

  const submit = () => {
    const problem = validateDue(when);
    if (problem) { setError(problem); return; }
    onSubmit({ interview_date: fromLocalInputValue(when), interview_link: link.trim() });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule interview"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={busy} onClick={submit}>Schedule &amp; notify</Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-brand-text-muted">
          {candidateName ? `${candidateName} will be emailed` : 'The candidate will be emailed'} the date they must complete the
          video interview by.
        </p>
        <Input
          label="Due by" type="datetime-local" name="interview_date" value={when} required
          min={toLocalInputValue(new Date())}
          onChange={e => { setWhen(e.target.value); setError(null); }}
          error={error}
        />
        <Input
          label="Link (optional)" type="url" name="interview_link" value={link}
          placeholder="https://…" hint="Shown to the candidate in the email, e.g. a briefing page."
          onChange={e => setLink(e.target.value)}
        />
      </div>
    </Modal>
  );
}
