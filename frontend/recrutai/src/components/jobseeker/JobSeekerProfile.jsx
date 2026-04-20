import React, { useRef, useState } from 'react';
import { getJobSeekerProfile, updateJobSeekerProfile } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../hooks/useToast';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Bell, Pencil, File, Upload, ExternalLink } from 'lucide-react';

const BellIcon         = ({ size = 15 }) => <Bell size={size} />;
const EditIcon         = ({ size = 14 }) => <Pencil size={size} />;
const FileIcon         = ({ size = 18 }) => <File size={size} />;
const UploadIcon       = ({ size = 18 }) => <Upload size={size} />;
const ExternalLinkIcon = ({ size = 14 }) => <ExternalLink size={size} />;

/* ── Avatar ─────────────────────────────────────────────────────────── */
function Avatar({ name, size = 72 }) {
  const initials = (name || '?').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return (
    <div className="rounded-2xl grid place-items-center font-bold text-white shrink-0"
      style={{ width: size, height: size, background: `oklch(0.52 0.12 ${h})`, boxShadow: `0 0 24px oklch(0.52 0.12 ${h} / 0.45)`, fontSize: 22 }}>
      {initials}
    </div>
  );
}

/* ── Section label ──────────────────────────────────────────────────── */
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

/* ── File upload zone ───────────────────────────────────────────────── */
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
        CV / Resume
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
        <input ref={inputRef} type="file" name="resume" accept=".pdf,.doc,.docx" onChange={onChange} className="sr-only" />
        <div className="p-5 flex flex-col items-center gap-2 text-center">
          {file ? (
            <>
              <div className="w-9 h-9 rounded-xl grid place-items-center"
                style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}>
                <FileIcon />
              </div>
              <div>
                <p className="text-sm font-medium" style={{ color: '#F59E0B' }}>{file.name}</p>
                <p className="text-[11px] text-brand-text-disabled mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB · Click to change</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-9 h-9 rounded-xl grid place-items-center text-brand-text-disabled"
                style={{ background: 'rgba(35,42,62,0.6)', border: '1px solid rgba(35,42,62,0.8)' }}>
                <UploadIcon />
              </div>
              <div>
                <p className="text-sm font-medium text-brand-text-muted">
                  Drop your CV here, or <span style={{ color: '#F59E0B' }}>browse</span>
                </p>
                <p className="text-[11px] text-brand-text-disabled mt-0.5">PDF, DOC, DOCX · Max 10 MB</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton field ─────────────────────────────────────────────────── */
function SkeletonField() {
  return (
    <div className="space-y-1.5">
      <div className="h-3 w-20 rounded" style={{ background: 'rgba(35,42,62,0.8)' }} />
      <div className="h-10 w-full rounded-xl animate-pulse" style={{ background: 'rgba(16,20,32,0.8)', border: '1px solid rgba(35,42,62,0.8)' }} />
    </div>
  );
}

const TEXT_FIELDS = [
  { name: 'fullName', label: 'Full Name', type: 'text' },
  { name: 'phone',    label: 'Phone',     type: 'text' },
  { name: 'address',  label: 'Address',   type: 'text', span: true },
];

export default function JobSeekerProfile() {
  const { data: raw, loading, error, refetch } = useApi(getJobSeekerProfile, []);
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft]         = useState(null);
  const [saving, setSaving]       = useState(false);
  const fileInputRef = useRef(null);

  const profile = raw
    ? { email: raw.email, fullName: raw.full_name, phone: raw.phone, address: raw.address, experience: raw.experience, skills: raw.skills, cv: raw.resume, resume: null }
    : null;

  const handleEdit = () => { setDraft({ ...profile }); setIsEditing(true); };
  const handleCancel = () => { setDraft(null); setIsEditing(false); };
  const handleChange = (e) => setDraft(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleFile   = (e) => setDraft(p => ({ ...p, resume: e.target.files[0] }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateJobSeekerProfile(draft);
      refetch();
      toast.success('Profile saved successfully.');
      setIsEditing(false);
      setDraft(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const data = isEditing ? draft : profile;
  const displayName = profile?.fullName || profile?.email || 'Job Seeker';

  return (
    <div className="flex-1 animate-fadeIn">
      {/* Topbar */}
      <div className="h-14 px-6 flex items-center gap-3 sticky top-0 z-20"
        style={{ borderBottom: '1px solid rgba(35,42,62,0.7)', background: 'rgba(9,12,20,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-mono text-brand-text-disabled mb-0.5">Account</div>
          <h1 className="text-[15px] font-semibold text-brand-text-primary">My Profile</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-lg text-brand-text-muted grid place-items-center transition-colors"
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(35,42,62,0.6)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <BellIcon />
          </button>
          {!isEditing && !loading && (
            <button onClick={handleEdit}
              className="h-8 px-3 text-xs rounded-lg font-medium inline-flex items-center gap-1.5 transition-all"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.12)'}>
              <EditIcon /> Edit Profile
            </button>
          )}
        </div>
      </div>

      <div className="px-8 py-8 max-w-[860px] mx-auto">

        {/* Profile hero card */}
        <div className="rounded-2xl p-6 mb-8 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(24,30,46,0.9) 0%, rgba(16,20,32,0.9) 100%)', border: '1px solid rgba(35,42,62,0.8)', boxShadow: '0 8px 40px rgba(0,0,0,0.4)' }}>
          <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 100% 0%, rgba(245,158,11,0.06) 0%, transparent 70%)' }} />
          <div className="flex items-center gap-5">
            {loading
              ? <div className="rounded-2xl animate-pulse" style={{ width: 72, height: 72, background: 'rgba(35,42,62,0.8)' }} />
              : <Avatar name={displayName} size={72} />}
            <div className="flex-1 min-w-0">
              {loading ? (
                <>
                  <div className="h-5 w-40 rounded animate-pulse mb-2" style={{ background: 'rgba(35,42,62,0.8)' }} />
                  <div className="h-3.5 w-56 rounded animate-pulse" style={{ background: 'rgba(35,42,62,0.6)' }} />
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-brand-text-primary truncate">{displayName}</h2>
                  <div className="text-xs text-brand-text-disabled mt-1 font-mono">{profile?.email}</div>
                  {profile?.cv && !isEditing && (
                    <a href={profile.cv} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium mt-2 transition-colors"
                      style={{ color: '#F59E0B' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#FCD34D'}
                      onMouseLeave={e => e.currentTarget.style.color = '#F59E0B'}>
                      <ExternalLinkIcon size={12} /> View current CV
                    </a>
                  )}
                </>
              )}
            </div>
            {isEditing && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#F59E0B' }}>
                <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3" fill="#F59E0B"/></svg>
                Editing
              </span>
            )}
          </div>
        </div>

        {/* Error */}
        {(error || (!loading && !profile)) && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm text-red-300 flex items-center justify-between"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            Failed to load profile.
            <button onClick={refetch} className="text-xs underline hover:text-red-200">Retry</button>
          </div>
        )}

        {/* Personal info section */}
        <div className="rounded-2xl overflow-hidden mb-5" style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(35,42,62,0.6)' }}>
            <SectionLabel>Personal Info</SectionLabel>
          </div>
          <div className="p-6">
            <Input label="Email" name="email" type="email" value={profile?.email ?? ''} disabled />
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <SkeletonField /><SkeletonField /><div className="sm:col-span-2"><SkeletonField /></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {TEXT_FIELDS.map(({ name, label, type, span }) => (
                  <Input key={name} label={label} name={name} type={type}
                    value={data?.[name] ?? ''} onChange={handleChange}
                    disabled={!isEditing}
                    containerClassName={span ? 'sm:col-span-2' : ''} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Professional background section */}
        <div className="rounded-2xl overflow-hidden mb-5" style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(35,42,62,0.6)' }}>
            <SectionLabel>Professional Background</SectionLabel>
          </div>
          <div className="p-6 space-y-4">
            {loading ? (
              <><SkeletonField /><SkeletonField /></>
            ) : (
              <>
                <Input label="Experience" name="experience" as="textarea"
                  value={data?.experience ?? ''} onChange={handleChange}
                  disabled={!isEditing} className="min-h-[90px]"
                  placeholder="Describe your most relevant work experience…" />
                <Input label="Skills" name="skills" as="textarea"
                  value={data?.skills ?? ''} onChange={handleChange}
                  disabled={!isEditing} className="min-h-[70px]"
                  placeholder="e.g. React, Python, Project Management…" />
              </>
            )}
          </div>
        </div>

        {/* Resume section */}
        <div className="rounded-2xl overflow-hidden mb-8" style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(35,42,62,0.6)' }}>
            <SectionLabel>Resume</SectionLabel>
          </div>
          <div className="p-6">
            {isEditing ? (
              <FileUploadZone file={draft?.resume} onChange={handleFile} inputRef={fileInputRef} />
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl grid place-items-center text-brand-text-disabled"
                  style={{ background: 'rgba(35,42,62,0.6)', border: '1px solid rgba(35,42,62,0.8)' }}>
                  <FileIcon />
                </div>
                {profile?.cv ? (
                  <a href={profile.cv} target="_blank" rel="noopener noreferrer"
                    className="text-sm font-medium inline-flex items-center gap-1.5 transition-colors"
                    style={{ color: '#F59E0B' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#FCD34D'}
                    onMouseLeave={e => e.currentTarget.style.color = '#F59E0B'}>
                    <ExternalLinkIcon size={13} /> View current CV
                  </a>
                ) : (
                  <span className="text-sm text-brand-text-disabled">No CV uploaded yet</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Save/Cancel */}
        {isEditing && (
          <div className="flex items-center gap-3">
            <Button loading={saving} onClick={handleSave} size="lg">Save Changes</Button>
            <Button variant="secondary" onClick={handleCancel} disabled={saving}>Cancel</Button>
          </div>
        )}
      </div>
    </div>
  );
}
