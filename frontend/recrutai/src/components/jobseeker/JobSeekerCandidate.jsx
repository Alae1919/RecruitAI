import React from 'react';
import { getJobSeekerApplications } from '../../services/api';
import { useApi } from '../../hooks/useApi';
import Button from '../ui/Button';
import { Bell, FileText } from 'lucide-react';

const BellIcon     = ({ size = 15 }) => <Bell size={size} />;
const FileTextIcon = ({ size = 22 }) => <FileText size={size} strokeWidth={1.5} />;

/* ── Status badge ───────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const s = status?.toLowerCase();
  const map = {
    accepted: { bg: 'rgba(16,185,129,0.1)',  color: '#6EE7B7', border: 'rgba(16,185,129,0.25)', dot: '#34D399' },
    rejected: { bg: 'rgba(239,68,68,0.1)',   color: '#FCA5A5', border: 'rgba(239,68,68,0.25)',  dot: '#F87171' },
    pending:  { bg: 'rgba(245,158,11,0.1)',  color: '#FCD34D', border: 'rgba(245,158,11,0.25)', dot: '#F59E0B' },
  };
  const cfg = map[s] || map.pending;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      {status || 'pending'}
    </span>
  );
}

/* ── Skeleton row ───────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr style={{ borderTop: '1px solid rgba(35,42,62,0.5)' }}>
      {[60, 20, 20].map((w, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 rounded animate-pulse" style={{ width: `${w}%`, background: 'rgba(35,42,62,0.8)' }} />
        </td>
      ))}
    </tr>
  );
}

export default function JobSeekerCandidate() {
  const { data, loading, error, refetch } = useApi(getJobSeekerApplications, []);
  const applications = Array.isArray(data) ? data : [];

  const counts = {
    total:    applications.length,
    pending:  applications.filter(a => a.status?.toLowerCase() === 'pending').length,
    accepted: applications.filter(a => a.status?.toLowerCase() === 'accepted').length,
  };

  const kpis = [
    { label: 'Total',    value: counts.total,    color: '#F59E0B' },
    { label: 'Pending',  value: counts.pending,  color: '#F59E0B' },
    { label: 'Accepted', value: counts.accepted, color: '#10B981' },
  ];

  return (
    <div className="flex-1 animate-fadeIn">
      {/* Topbar */}
      <div className="h-14 px-6 flex items-center gap-3 sticky top-0 z-20"
        style={{ borderBottom: '1px solid rgba(35,42,62,0.7)', background: 'rgba(9,12,20,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-semibold text-brand-text-primary">My Applications</h1>
        </div>
        <button className="w-9 h-9 rounded-lg text-brand-text-muted grid place-items-center transition-colors"
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(35,42,62,0.6)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <BellIcon />
        </button>
      </div>

      <div className="px-8 py-6 max-w-[1100px] mx-auto">

        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {kpis.map(k => (
            <div key={k.label} className="rounded-xl p-5 relative overflow-hidden"
              style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
              <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl"
                style={{ background: `linear-gradient(90deg, ${k.color}60, ${k.color}15)` }} />
              <div className="text-[10px] font-mono uppercase tracking-widest text-brand-text-disabled">{k.label}</div>
              <div className="mt-2 text-3xl font-bold font-mono tracking-tight text-brand-text-primary">
                {loading
                  ? <span className="inline-block w-10 h-7 rounded animate-pulse" style={{ background: 'rgba(35,42,62,0.8)' }} />
                  : k.value}
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl text-sm text-red-300 flex items-center justify-between"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            Failed to load applications.
            <button onClick={refetch} className="text-xs underline hover:text-red-200">Retry</button>
          </div>
        )}

        {/* Table card */}
        <div className="rounded-xl overflow-hidden"
          style={{ background: '#101420', border: '1px solid rgba(35,42,62,0.8)', boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>

          {applications.length === 0 && !loading ? (
            <div className="flex flex-col items-center py-20 gap-4">
              <div className="w-14 h-14 rounded-2xl grid place-items-center text-brand-text-disabled"
                style={{ background: 'rgba(35,42,62,0.5)', border: '1px solid rgba(35,42,62,0.8)' }}>
                <FileTextIcon />
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-brand-text-primary">No applications yet</div>
                <div className="text-xs text-brand-text-muted mt-1">Apply for jobs to track your applications here.</div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    {['Position', 'Status', 'Applied'].map((h, i) => (
                      <th key={h}
                        className={`text-left px-6 py-3 text-[10px] font-mono uppercase tracking-widest font-medium text-brand-text-disabled ${i === 2 ? 'hidden sm:table-cell' : ''}`}
                        style={{ borderBottom: '1px solid rgba(35,42,62,0.6)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [1, 2, 3, 4].map(i => <SkeletonRow key={i} />)
                  ) : (
                    applications.map(app => (
                      <tr key={app.id}
                        className="transition-colors"
                        style={{ borderTop: '1px solid rgba(35,42,62,0.5)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(24,30,46,0.6)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td className="px-6 py-4 font-semibold text-brand-text-primary">{app.job_offer_title}</td>
                        <td className="px-6 py-4"><StatusBadge status={app.status} /></td>
                        <td className="px-6 py-4 text-brand-text-muted font-mono text-xs hidden sm:table-cell">
                          {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
