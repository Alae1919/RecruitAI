import React, { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';

export default function QuestionEditor({ question, onSave, onDelete, readOnly, isSaving, isDeleting }) {
  const [editing, setEditing] = useState(false);
  const [text, setText]       = useState(question.text);

  const handleSave = () => {
    if (text.trim() && text !== question.text) onSave(question.id, { text: text.trim() });
    setEditing(false);
  };

  const handleCancel = () => { setText(question.text); setEditing(false); };

  return (
    <div className="flex gap-3 p-3 rounded-xl group transition-all"
      style={{ background: 'rgba(16,20,32,0.6)', border: '1px solid rgba(35,42,62,0.7)' }}>
      <span className="text-xs font-mono text-brand-text-disabled mt-1 w-5 shrink-0 text-right">
        {question.order ?? '—'}
      </span>
      <div className="flex-1 min-w-0">
        {editing ? (
          <textarea
            autoFocus
            value={text}
            onChange={e => setText(e.target.value)}
            rows={2}
            className="w-full bg-transparent text-sm text-brand-text-primary outline-none resize-none"
            onKeyDown={e => { if (e.key === 'Escape') handleCancel(); if (e.key === 'Enter' && e.ctrlKey) handleSave(); }}
          />
        ) : (
          <p className="text-sm text-brand-text-primary leading-relaxed">{question.text}</p>
        )}
        {question.question_type && (
          <span className="mt-1.5 inline-block text-[10px] px-1.5 py-0.5 rounded font-mono text-brand-text-disabled"
            style={{ background: 'rgba(35,42,62,0.6)' }}>
            {question.question_type}
          </span>
        )}
      </div>
      {!readOnly && (
        <div className="flex items-start gap-1 shrink-0">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={isSaving}
                aria-label="Save changes"
                className="w-6 h-6 rounded grid place-items-center text-green-400 hover:text-green-300 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-green-400/60">
                <Check size={13} />
              </button>
              <button onClick={handleCancel}
                aria-label="Cancel editing"
                className="w-6 h-6 rounded grid place-items-center text-brand-text-disabled hover:text-brand-text-muted transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400/40">
                <X size={13} />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)}
                aria-label="Edit question"
                className="w-6 h-6 rounded grid place-items-center text-brand-text-disabled hover:text-amber-400 transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-400/60">
                <Pencil size={12} />
              </button>
              <button onClick={() => onDelete(question.id)} disabled={isDeleting}
                aria-label="Delete question"
                className="w-6 h-6 rounded grid place-items-center text-brand-text-disabled hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400/60">
                <Trash2 size={12} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
