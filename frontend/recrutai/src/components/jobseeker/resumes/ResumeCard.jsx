import React, { useState } from 'react';
import { File, Star, Trash2, ExternalLink, Check, Clock, AlertCircle, Loader } from 'lucide-react';
import ConfirmDialog from '../../ui/ConfirmDialog';

const STATUS_CONFIG = {
  PENDING:    { icon: Clock,   color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)',  label: 'Parsing…' },
  PROCESSING: { icon: Loader,  color: '#818CF8', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)',   label: 'Processing…' },
  READY:      { icon: Check,   color: '#10B981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)',   label: 'Ready' },
  FAILED:     { icon: AlertCircle, color: '#F87171', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)', label: 'Failed' },
};

export default function ResumeCard({ resume, onSetDefault, onDelete, isSettingDefault, isDeleting }) {
  const [showConfirm, setShowConfirm] = useState(false);

  const cfg = STATUS_CONFIG[resume.parsing_status] || STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  const isPending = resume.parsing_status === 'PENDING' || resume.parsing_status === 'PROCESSING';

  return (
    <>
      <div className="flex items-center gap-3 p-4 rounded-xl transition-all"
        style={{ background: 'rgba(16,20,32,0.8)', border: `1px solid ${resume.is_default ? 'rgb(var(--accent-rgb) / 0.35)' : 'rgba(35,42,62,0.8)'}` }}>

        {/* File icon */}
        <div className="w-9 h-9 rounded-lg grid place-items-center shrink-0"
          style={{ background: 'rgba(35,42,62,0.6)', border: '1px solid rgba(35,42,62,0.8)', color: '#9BA6C4' }}>
          <File size={16} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-brand-text-primary truncate">
              {resume.label || `Resume #${resume.id}`}
            </span>
            {resume.is_default && (
              <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ background: 'rgb(var(--accent-rgb) / 0.12)', border: '1px solid rgb(var(--accent-rgb) / 0.3)', color: 'var(--accent)' }}>
                <Star size={9} fill="currentColor" /> Default
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium"
              style={{ color: cfg.color }}>
              <Icon size={11} className={isPending ? 'animate-spin' : ''} />
              {cfg.label}
            </span>
            <span className="text-[11px] text-brand-text-disabled">
              {new Date(resume.uploaded_at).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {resume.file_url && (
            <a href={resume.file_url} target="_blank" rel="noopener noreferrer"
              aria-label={`View ${resume.label || `Resume #${resume.id}`}`}
              className="w-7 h-7 rounded-md grid place-items-center transition-colors text-brand-text-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50"
              style={{ border: '1px solid rgba(35,42,62,0.7)', background: 'rgba(35,42,62,0.4)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'rgb(var(--accent-rgb) / 0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = 'rgba(35,42,62,0.7)'; }}>
              <ExternalLink size={12} />
            </a>
          )}
          {!resume.is_default && (
            <button
              onClick={() => onSetDefault(resume.id)}
              disabled={isSettingDefault}
              aria-label="Set as default resume"
              className="h-7 px-2 rounded-md text-[11px] inline-flex items-center gap-1 transition-colors text-brand-text-disabled disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50"
              style={{ border: '1px solid rgba(35,42,62,0.7)', background: 'rgba(35,42,62,0.4)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'rgb(var(--accent-rgb) / 0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = 'rgba(35,42,62,0.7)'; }}>
              <Star size={11} /> Set default
            </button>
          )}
          <button
            onClick={() => setShowConfirm(true)}
            disabled={isDeleting}
            aria-label="Delete resume"
            className="w-7 h-7 rounded-md grid place-items-center transition-colors text-brand-text-disabled disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
            style={{ border: '1px solid rgba(35,42,62,0.7)', background: 'rgba(35,42,62,0.4)' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = 'rgba(35,42,62,0.7)'; e.currentTarget.style.background = 'rgba(35,42,62,0.4)'; }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => { setShowConfirm(false); onDelete(resume.id); }}
        title="Delete Resume"
        message={`Delete "${resume.label || `Resume #${resume.id}`}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
      />
    </>
  );
}
