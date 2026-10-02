import React, { useRef, useState } from 'react';
import { Upload, FileX } from 'lucide-react';
import ResumeCard from './ResumeCard';
import { useMyResumes, useUploadResume, useSetDefaultResume, useDeleteResume } from '../../../shared/hooks/useResumes';
import { useToast } from '../../../hooks/useToast';

function UploadZone({ onFile }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  return (
    <div
      className="rounded-xl cursor-pointer transition-all"
      style={{
        border: dragging ? '1.5px dashed rgb(var(--accent-rgb) / 0.6)' : '1.5px dashed rgba(35,42,62,0.9)',
        background: dragging ? 'rgb(var(--accent-rgb) / 0.04)' : 'rgba(16,20,32,0.4)',
      }}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onMouseEnter={e => { if (!dragging) e.currentTarget.style.borderColor = 'rgb(var(--accent-rgb) / 0.3)'; }}
      onMouseLeave={e => { if (!dragging) e.currentTarget.style.borderColor = 'rgba(35,42,62,0.9)'; }}
    >
      <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="sr-only"
        onChange={e => { if (e.target.files[0]) onFile(e.target.files[0]); e.target.value = ''; }} />
      <div className="py-5 flex flex-col items-center gap-2 text-center">
        <div className="w-9 h-9 rounded-xl grid place-items-center text-brand-text-disabled"
          style={{ background: 'rgba(35,42,62,0.6)', border: '1px solid rgba(35,42,62,0.8)' }}>
          <Upload size={17} />
        </div>
        <div>
          <p className="text-sm font-medium text-brand-text-muted">
            Drop a resume, or <span style={{ color: 'var(--accent)' }}>browse</span>
          </p>
          <p className="text-[11px] text-brand-text-disabled mt-0.5">PDF, DOC, DOCX · Max 10 MB</p>
        </div>
      </div>
    </div>
  );
}

export default function ResumeManager() {
  const { data, isLoading } = useMyResumes();
  const uploadMutation      = useUploadResume();
  const defaultMutation     = useSetDefaultResume();
  const deleteMutation      = useDeleteResume();
  const { toast } = useToast();

  const resumes = Array.isArray(data) ? data : [];

  const handleUpload = async (file) => {
    const makeDefault = resumes.length === 0;
    try {
      await uploadMutation.mutateAsync({ file, label: file.name.replace(/\.[^.]+$/, ''), makeDefault });
      toast.success('Resume uploaded — parsing in progress.');
    } catch {
      toast.error('Upload failed. Check file size and format.');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await defaultMutation.mutateAsync(id);
      toast.success('Default resume updated.');
    } catch {
      toast.error('Failed to update default resume.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Resume deleted.');
    } catch {
      toast.error('Failed to delete resume.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'rgba(35,42,62,0.4)' }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {resumes.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-6">
          <FileX size={28} className="text-brand-text-disabled" />
          <p className="text-sm text-brand-text-muted">No resumes uploaded yet.</p>
        </div>
      )}
      {resumes.map(r => (
        <ResumeCard
          key={r.id}
          resume={r}
          onSetDefault={handleSetDefault}
          onDelete={handleDelete}
          isSettingDefault={defaultMutation.isPending && defaultMutation.variables === r.id}
          isDeleting={deleteMutation.isPending && deleteMutation.variables === r.id}
        />
      ))}
      <UploadZone onFile={handleUpload} />
      {uploadMutation.isPending && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs text-brand-text-muted"
          style={{ background: 'rgb(var(--accent-rgb) / 0.06)', border: '1px solid rgb(var(--accent-rgb) / 0.15)' }}>
          <div className="w-3 h-3 border border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgb(var(--accent-rgb) / 0.6)', borderTopColor: 'transparent' }} />
          Uploading…
        </div>
      )}
    </div>
  );
}
