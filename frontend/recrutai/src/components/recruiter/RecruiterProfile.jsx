import React, { useState } from 'react';
import { getRecruiterProfile, updateRecruiterProfile } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../hooks/useToast';
import Input from '../ui/Input';
import Button from '../ui/Button';

/* ── Icons ─────────────────────────────────────────────────────────── */
function BellIcon({ size = 15 }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
}
function EditIcon({ size = 14 }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
}
function BuildingIcon({ size = 15 }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
}

/* ── Avatar ─────────────────────────────────────────────────────────── */
function Avatar({ name, size = 72 }) {
  const initials = (name || '?').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return (
    <div className="rounded-2xl grid place-items-center font-bold text-white shrink-0"
      style={{
        width: size, height: size,
        background: `oklch(0.52 0.12 ${h})`,
        boxShadow: `0 0 24px oklch(0.52 0.12 ${h} / 0.45)`,
        fontSize: size > 48 ? 22 : 13,
      }}>
      {initials}
    </div>
  );
}

/* ── Section label ──────────────────────────────────────────────────── */
function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-3 pt-1 pb-0.5">
      {Icon && <Icon size={13} />}
      <div className="text-[10px] font-mono tracking-[0.18em] uppercase"
        style={{ color: '#F59E0B', textShadow: '0 0 12px rgba(245,158,11,0.35)' }}>
        {children}
      </div>
      <div className="flex-1 h-px" style={{ background: 'rgba(245,158,11,0.12)' }} />
    </div>
  );
}

/* ── Skeleton ───────────────────────────────────────────────────────── */
function SkeletonField() {
  return (
    <div className="space-y-1.5">
      <div className="h-3 w-20 rounded" style={{ background: 'rgba(35,42,62,0.8)' }} />
      <div className="h-10 w-full rounded-xl animate-pulse" style={{ background: 'rgba(16,20,32,0.8)', border: '1px solid rgba(35,42,62,0.8)' }} />
    </div>
  );
}

const PERSONAL_FIELDS = [
  { name: 'full_name', label: 'Full Name', type: 'text' },
  { name: 'phone',     label: 'Personal Phone', type: 'text' },
  { name: 'adress',   label: 'Address', type: 'text', span: true },
];

const COMPANY_FIELDS = [
  { name: 'company_name',    label: 'Company Name',    type: 'text' },
  { name: 'position',        label: 'Your Position',   type: 'text' },
  { name: 'company_phone',   label: 'Company Phone',   type: 'text' },
  { name: 'industry',        label: 'Industry',        type: 'text' },
  { name: 'company_website', label: 'Company Website', type: 'url', span: true },
];

export default function RecruiterProfile() {
  const { data: profile, loading, error, refetch } = useApi(getRecruiterProfile, []);
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft]         = useState(null);
  const [saving, setSaving]       = useState(false);

  const handleEdit = () => { setDraft({ ...profile }); setIsEditing(true); };
  const handleCancel = () => { setDraft(null); setIsEditing(false); };
  const handleChange = (e) => setDraft(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateRecruiterProfile(draft);
      refetch();
      toast.success('Profile saved successfully.');
      setIsEditing(false);
      setDraft(null);
    } catch {
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const data = isEditing ? draft : profile;
  const displayName = profile?.full_name || profile?.email || 'Recruiter';

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
            style={{ background: 'transparent' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(35,42,62,0.6)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <BellIcon />
          </button>
          {!isEditing && (
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

        {/* Profile card header */}
        <div className="rounded-2xl p-6 mb-8 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(24,30,46,0.9) 0%, rgba(16,20,32,0.9) 100%)',
            border: '1px solid rgba(35,42,62,0.8)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          }}>
          {/* Ambient amber glow */}
          <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 100% 0%, rgba(245,158,11,0.06) 0%, transparent 70%)' }} />

          <div className="flex items-center gap-5">
            {loading ? (
              <div className="rounded-2xl animate-pulse" style={{ width: 72, height: 72, background: 'rgba(35,42,62,0.8)' }} />
            ) : (
              <Avatar name={displayName} size={72} />
            )}
            <div className="flex-1 min-w-0">
              {loading ? (
                <>
                  <div className="h-5 w-40 rounded animate-pulse mb-2" style={{ background: 'rgba(35,42,62,0.8)' }} />
                  <div className="h-3.5 w-56 rounded animate-pulse" style={{ background: 'rgba(35,42,62,0.6)' }} />
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-brand-text-primary truncate">{displayName}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    {profile?.position && (
                      <span className="text-sm text-brand-text-muted">{profile.position}</span>
                    )}
                    {profile?.company_name && (
                      <>
                        {profile?.position && <span className="text-brand-text-disabled">·</span>}
                        <span className="inline-flex items-center gap-1.5 text-sm text-brand-text-muted">
                          <BuildingIcon size={13} /> {profile.company_name}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-brand-text-disabled mt-1 font-mono">{profile?.email}</div>
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

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl text-sm text-red-300"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            Failed to load profile. <button onClick={refetch} className="underline hover:text-red-200">Retry</button>
          </div>
        )}

        {/* Form */}
        <div className="space-y-6">
          {/* Personal info */}
          <div className="rounded-2xl overflow-hidden" style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)' }}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(35,42,62,0.6)' }}>
              <SectionLabel>Personal Info</SectionLabel>
            </div>
            <div className="p-6 space-y-4">
              {/* Email always read-only */}
              <Input label="Email" name="email" type="email" value={profile?.email ?? ''} disabled />

              {loading ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SkeletonField /><SkeletonField />
                  </div>
                  <SkeletonField />
                </>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PERSONAL_FIELDS.map(({ name, label, type, span }) => (
                    <Input
                      key={name}
                      label={label}
                      name={name}
                      type={type}
                      value={data?.[name] ?? ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      containerClassName={span ? 'sm:col-span-2' : ''}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Company details */}
          <div className="rounded-2xl overflow-hidden" style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)' }}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(35,42,62,0.6)' }}>
              <SectionLabel>Company Details</SectionLabel>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1,2,3,4].map(i => <SkeletonField key={i} />)}
                  <div className="sm:col-span-2"><SkeletonField /></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {COMPANY_FIELDS.map(({ name, label, type, span }) => (
                    <Input
                      key={name}
                      label={label}
                      name={name}
                      type={type}
                      value={data?.[name] ?? ''}
                      onChange={handleChange}
                      disabled={!isEditing}
                      containerClassName={span ? 'sm:col-span-2' : ''}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Save/Cancel */}
          {isEditing && (
            <div className="flex items-center gap-3 pt-2">
              <Button loading={saving} onClick={handleSave} size="lg">
                Save Changes
              </Button>
              <Button variant="secondary" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
