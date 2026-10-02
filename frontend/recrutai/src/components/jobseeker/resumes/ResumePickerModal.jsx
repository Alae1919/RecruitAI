import React, { useState, useRef } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import { Star, File, Upload, Check, Clock, AlertCircle } from 'lucide-react';
import { useMyResumes, useUploadResume } from '../../../shared/hooks/useResumes';
import { useToast } from '../../../hooks/useToast';

const STATUS_ICON = {
  READY:      <Check size={11} className="text-green-400" />,
  PENDING:    <Clock size={11} className="text-amber-400" />,
  PROCESSING: <Clock size={11} className="text-indigo-400" />,
  FAILED:     <AlertCircle size={11} className="text-red-400" />,
};

export default function ResumePickerModal({ isOpen, onClose, offerTitle, onConfirm, loading }) {
  const { data, isLoading } = useMyResumes();
  const uploadMutation = useUploadResume();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const resumes = Array.isArray(data) ? data : [];
  const defaultResume = resumes.find(r => r.is_default) ?? resumes[0];
  const [selectedId, setSelectedId] = useState(null);

  const effectiveId = selectedId ?? defaultResume?.id ?? null;

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const result = await uploadMutation.mutateAsync({
        file,
        label: file.name.replace(/\.[^.]+$/, ''),
        makeDefault: resumes.length === 0,
      });
      setSelectedId(result.id);
      toast.success('Resume uploaded.');
    } catch {
      toast.error('Upload failed.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Apply — ${offerTitle ?? 'Job'}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            loading={loading}
            disabled={!effectiveId || loading}
            onClick={() => onConfirm(effectiveId)}
          >
            Send Application
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-xs text-brand-text-muted mb-3">Select the resume to attach to your application.</p>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'rgba(35,42,62,0.4)' }} />)}
          </div>
        ) : resumes.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-brand-text-muted mb-4">You have no resumes. Upload one to apply.</p>
          </div>
        ) : (
          resumes.map(r => {
            const selected = effectiveId === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedId(r.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left"
                style={{
                  background: selected ? 'rgb(var(--accent-rgb) / 0.06)' : 'rgba(16,20,32,0.6)',
                  border: `1px solid ${selected ? 'rgb(var(--accent-rgb) / 0.4)' : 'rgba(35,42,62,0.7)'}`,
                }}
              >
                <div className="w-7 h-7 rounded-lg grid place-items-center shrink-0"
                  style={{ background: selected ? 'rgb(var(--accent-rgb) / 0.12)' : 'rgba(35,42,62,0.6)', color: selected ? 'var(--accent)' : '#9BA6C4' }}>
                  <File size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-brand-text-primary truncate">
                      {r.label || `Resume #${r.id}`}
                    </span>
                    {r.is_default && <Star size={11} className="text-amber-400 shrink-0" fill="currentColor" />}
                    {STATUS_ICON[r.parsing_status]}
                  </div>
                  <span className="text-[11px] text-brand-text-disabled">
                    {new Date(r.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center"
                  style={{ borderColor: selected ? 'var(--accent)' : 'rgba(35,42,62,0.8)', background: selected ? 'var(--accent)' : 'transparent' }}>
                  {selected && <div className="w-1.5 h-1.5 rounded-full bg-gray-900" />}
                </div>
              </button>
            );
          })
        )}

        {/* Upload new */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-brand-text-muted transition-all disabled:opacity-50"
          style={{ border: '1.5px dashed rgba(35,42,62,0.8)' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgb(var(--accent-rgb) / 0.3)'; e.currentTarget.style.color = '#EEF0F8'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(35,42,62,0.8)'; e.currentTarget.style.color = ''; }}
        >
          <Upload size={14} />
          {uploadMutation.isPending ? 'Uploading…' : 'Upload a new resume'}
        </button>
        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={handleUpload} />
      </div>
    </Modal>
  );
}
