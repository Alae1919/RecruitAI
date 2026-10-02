import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import PipelineNav from '../components/recruiter/PipelineNav';
import { usePipelineSummary } from '../shared/hooks/usePipelineSummary';
import { Briefcase, Users, Plus, User, Calendar } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'My Offers',   to: '/recruiter-dashboard/view-offers',                  icon: Briefcase },
  { label: 'Candidates',  to: '/recruiter-dashboard/recruiter_candidate',           icon: Users },
  { label: 'Post a job',  to: '/recruiter-dashboard/add-offers',                    icon: Plus, action: true },
  { label: 'Interviews',  to: '/recruiter-dashboard/recruiter_candidate_entretien', icon: Calendar },
  { label: 'Profile',     to: '/recruiter-dashboard/profile',                       icon: User },
];

export default function RecruiterDashboard() {
  const { data: summary } = usePipelineSummary();
  const navItems = NAV_ITEMS.map(item => {
    if (item.label === 'My Offers') return { ...item, badge: summary?.offers };
    if (item.label === 'Candidates') return { ...item, badge: summary?.candidates };
    return item;
  });
  return <DashboardLayout navItems={navItems} sidebarExtra={<PipelineNav summary={summary} />} />;
}
