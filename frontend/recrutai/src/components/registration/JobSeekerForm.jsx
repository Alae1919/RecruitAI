import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { registerJobSeeker } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import Input from '../ui/Input';
import Button from '../ui/Button';

const EMPTY = {
  full_name: '', email: '', password: '', phone: '',
  address: '', experience: '', skills: '', resume: null,
};

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3 pt-1 pb-0.5">
      <div className="text-[10px] font-mono tracking-[0.18em] uppercase"
        style={{ color: '#F59E0B', textShadow: '0 0 12px rgba(245,158,11,0.35)' }}>
        {children}
      </div>
      <div className="flex-1 h-px" style={{ background: 'rgba(245,158,11,0.12)' }} />
    </div>
  );
}

function SuccessState() {
  return (
    <div className="text-center py-10 space-y-4 animate-fadeIn">
      <div className="w-16 h-16 rounded-full mx-auto grid place-items-center"
        style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0.05) 100%)', border: '1px solid rgba(245,158,11,0.3)', boxShadow: '0 0 30px rgba(245,158,11,0.15)' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h3 className="text-lg font-bold text-brand-text-primary">You're in!</h3>
      <p className="text-sm text-brand-text-muted">Your job seeker account is ready. Sign in to explore matched roles.</p>
      <Link to="/login"
        className="inline-flex items-center gap-2 h-11 px-6 rounded-xl text-gray-900 font-bold text-sm mt-2 transition-all active:scale-[.98]"
        style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)', boxShadow: '0 0 24px rgba(245,158,11,0.3)' }}>
        Sign in now
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </Link>
    </div>
  );
}

function FileUploadZone({ file, onChange, inputRef }) {
  const [dragging, setDragging] = useState(false);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) onChange({ target: { files: [f] } });
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-brand-text-muted">
        CV / Resume <span className="text-red-400">*</span>
      </label>
      <div
        className="relative rounded-xl cursor-pointer transition-all duration-200"
        style={{
          border: dragging ? '1.5px dashed rgba(245,158,11,0.6)' : '1.5px dashed rgba(35,42,62,0.9)',
          background: dragging ? 'rgba(245,158,11,0.04)' : 'rgba(16,20,32,0.6)',
          boxShadow: dragging ? '0 0 20px rgba(245,158,11,0.08)' : 'none',
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onMouseEnter={e => { if (!dragging) e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)'; }}
        onMouseLeave={e => { if (!dragging) e.currentTarget.style.borderColor = 'rgba(35,42,62,0.9)'; }}>

        <input
          ref={inputRef}
          type="file"
          name="resume"
          accept=".pdf,.doc,.docx"
          onChange={onChange}
          required
          className="sr-only"
        />

        <div className="p-6 flex flex-col items-center gap-3 text-center">
          {file ? (
            <>
              <div className="w-10 h-10 rounded-xl grid place-items-center"
                style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <polyline points="20 6 9 17 4 12" strokeWidth="2.5"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-brand-accent">{file.name}</p>
                <p className="text-[11px] text-brand-text-disabled mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB · Click to change</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl grid place-items-center"
                style={{ background: 'rgba(35,42,62,0.6)', border: '1px solid rgba(35,42,62,0.8)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#59628A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-brand-text-muted">Drop your CV here, or <span className="text-brand-accent">browse</span></p>
                <p className="text-[11px] text-brand-text-disabled mt-0.5">PDF, DOC, DOCX · Max 10 MB</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function JobSeekerForm() {
  const [formData, setFormData] = useState(EMPTY);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [done, setDone]         = useState(false);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleChange = (e) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleFile   = (e) => setFormData(p => ({ ...p, resume: e.target.files[0] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      Object.keys(formData).forEach(k => fd.append(k, formData[k]));
      fd.append('role', 'job_seeker');
      await registerJobSeeker(fd);
      setDone(true);
      toast.success('Account created! You can now sign in.');
      setFormData(EMPTY);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      const detail = err.response?.data;
      setError(typeof detail === 'string' ? detail : 'Registration failed. Please check your input.');
    } finally {
      setLoading(false);
    }
  };

  if (done) return <SuccessState />;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="px-4 py-3 rounded-xl text-sm text-red-300 animate-slideUp"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      {/* Personal */}
      <SectionLabel>Personal Info</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Full Name" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Jane Doe" required />
        <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="you@example.com" required />
        <Input label="Password" name="password" type="password" value={formData.password} onChange={handleChange} placeholder="Create a password" required />
        <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} placeholder="+212 6..." required />
        <Input label="Address" name="address" value={formData.address} onChange={handleChange} placeholder="City, Country" required containerClassName="sm:col-span-2" />
      </div>

      {/* Professional */}
      <SectionLabel>Professional Background</SectionLabel>
      <Input
        label="Work Experience" name="experience" as="textarea"
        value={formData.experience} onChange={handleChange}
        placeholder="Describe your most relevant work experience — roles, companies, years..."
        required className="min-h-[90px]"
      />
      <Input
        label="Key Skills" name="skills" as="textarea"
        value={formData.skills} onChange={handleChange}
        placeholder="e.g. React, Python, Project Management, UX Research..."
        required className="min-h-[70px]"
      />

      {/* CV Upload */}
      <SectionLabel>Resume</SectionLabel>
      <FileUploadZone file={formData.resume} onChange={handleFile} inputRef={fileInputRef} />

      <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
        Create job seeker account
      </Button>
    </form>
  );
}
