import React, { useState } from 'react';
import { getRecruiterProfile, updateRecruiterProfile } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../hooks/useToast';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Bell, Pencil, Building2 } from 'lucide-react';
import Avatar from '../ui/Avatar';

const BellIcon     = ({ size = 15 }) => <Bell size={size} />;
const EditIcon     = ({ size = 14 }) => <Pencil size={size} />;
const BuildingIcon = ({ size = 15 }) => <Building2 size={size} />;

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
  { name: 'personal_phone',     label: 'Personal Phone', type: 'text' },
  { name: 'address',   label: 'Address', type: 'text', span: true },
];

const COMPANY_FIELDS = [
  { name: 'company_name',    label: 'Company Name',    type: 'text' },
  { name: 'position',        label: 'Your Position',   type: 'text' },
  { name: 'company_phone',   label: 'Company Phone',   type: 'text' },
  { name: 'industry',        label: 'Industry',        type: 'text' },
  { name: 'company_website', label: 'Company Website', type: 'url', span: true },
];

export default function RecruiterProfile() {
  const { data: apiResponse, loading, error, refetch } = useApi(getRecruiterProfile, []);
  const profile = apiResponse?.profile || null;
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
