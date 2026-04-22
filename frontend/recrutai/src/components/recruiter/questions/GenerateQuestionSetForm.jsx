import React, { useState } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';

const QUESTION_TYPES = [
  { value: 'technical',    label: 'Technical' },
  { value: 'behavioral',  label: 'Behavioral' },
  { value: 'situational', label: 'Situational' },
  { value: 'mixed',       label: 'Mixed' },
];

export default function GenerateQuestionSetForm({ isOpen, onClose, onSubmit, loading, defaultInstructions = '' }) {
  const [questionType, setQuestionType]       = useState('mixed');
  const [targetCount, setTargetCount]         = useState(5);
  const [recruiterInstructions, setInstr]     = useState(defaultInstructions);

  const handleSubmit = () => {
    onSubmit({ question_type: questionType, target_count: targetCount, recruiter_instructions: recruiterInstructions });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Question Set"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button loading={loading} onClick={handleSubmit}>Generate</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-[11px] font-medium text-brand-text-muted uppercase tracking-wider mb-1.5">Question type</label>
          <select
            value={questionType}
            onChange={e => setQuestionType(e.target.value)}
            className="w-full h-9 px-3 rounded-lg text-sm text-brand-text-primary outline-none appearance-none"
            style={{ background: 'rgba(35,42,62,0.4)', border: '1px solid rgba(35,42,62,0.8)' }}
          >
            {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-brand-text-muted uppercase tracking-wider mb-1.5">
            Number of questions — <span className="text-amber-400">{targetCount}</span>
          </label>
          <input
            type="range" min="3" max="15" step="1"
            value={targetCount}
            onChange={e => setTargetCount(Number(e.target.value))}
            className="w-full accent-amber-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-brand-text-disabled mt-0.5">
            <span>3</span><span>15</span>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-brand-text-muted uppercase tracking-wider mb-1.5">
            Instructions for AI <span className="font-normal normal-case text-brand-text-disabled">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={recruiterInstructions}
            onChange={e => setInstr(e.target.value)}
            placeholder="e.g. Focus on system design, avoid algorithms…"
            className="w-full px-3 py-2 rounded-lg text-sm text-brand-text-primary placeholder-brand-text-disabled outline-none resize-none"
            style={{ background: 'rgba(35,42,62,0.4)', border: '1px solid rgba(35,42,62,0.8)' }}
          />
        </div>
      </div>
    </Modal>
  );
}
