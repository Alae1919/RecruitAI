import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import Button from './Button';
import { X } from 'lucide-react';

const modalSurface = {
  background: 'linear-gradient(160deg, #131826 0%, #101420 100%)',
  border: '1px solid rgba(35,42,62,0.9)',
  boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(245,158,11,0.04)',
};

export default function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(9,12,20,0.75)' }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative w-full ${widths[size]} animate-fadeIn rounded-2xl`}
        style={modalSurface}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(35,42,62,0.8)' }}>
          <h2 className="text-base font-semibold text-brand-text-primary">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-brand-text-muted hover:text-brand-text-primary transition-all"
            style={{ background: 'rgba(35,42,62,0.4)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(35,42,62,0.8)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(35,42,62,0.4)'}
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4"
            style={{ borderTop: '1px solid rgba(35,42,62,0.8)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirm', danger = false, loading = false }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-brand-text-muted">{message}</p>
    </Modal>
  );
}
