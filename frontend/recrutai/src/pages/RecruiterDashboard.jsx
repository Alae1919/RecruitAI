import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import PipelineNav from '../components/recruiter/PipelineNav';
import CommandPalette from '../components/recruiter/palette/CommandPalette';
import { isPaletteShortcut } from '../components/recruiter/palette/paletteLogic';
import { usePipelineSummary } from '../shared/hooks/usePipelineSummary';
import { Briefcase, Users, Plus, User, Calendar, Search } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'My Offers',   to: '/recruiter-dashboard/view-offers',                  icon: Briefcase },
  { label: 'Candidates',  to: '/recruiter-dashboard/recruiter_candidate',           icon: Users },
  { label: 'Post a job',  to: '/recruiter-dashboard/add-offers',                    icon: Plus, action: true },
  { label: 'Interviews',  to: '/recruiter-dashboard/recruiter_candidate_entretien', icon: Calendar },
  { label: 'Profile',     to: '/recruiter-dashboard/profile',                       icon: User },
];

const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform || '');

function SearchTrigger({ onClick }) {
  return (
    <div className="px-3 mb-3">
      <button onClick={onClick}
        className="w-full h-9 px-3 rounded-xl flex items-center gap-2 text-xs text-brand-text-muted transition-colors hover:text-brand-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50"
        style={{ background: 'rgba(24,30,46,0.7)', border: '1px solid rgba(35,42,62,0.8)' }}>
        <Search size={13} /> <span>Search…</span>
        <kbd className="ml-auto text-[10px] font-mono text-brand-text-disabled">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
      </button>
    </div>
  );
}

export default function RecruiterDashboard() {
  const { data: summary } = usePipelineSummary();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if (isPaletteShortcut(e)) { e.preventDefault(); setPaletteOpen(open => !open); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const navItems = NAV_ITEMS.map(item => {
    if (item.label === 'My Offers') return { ...item, badge: summary?.offers };
    if (item.label === 'Candidates') return { ...item, badge: summary?.candidates };
    return item;
  });
  return (
    <>
      <DashboardLayout
        navItems={navItems}
        sidebarExtra={<><SearchTrigger onClick={() => setPaletteOpen(true)} /><PipelineNav summary={summary} /></>}
      />
      <CommandPalette isOpen={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
