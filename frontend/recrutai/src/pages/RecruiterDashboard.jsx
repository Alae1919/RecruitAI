import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Briefcase, Users, Plus, User, Calendar } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'My Offers',   to: '/recruiter-dashboard/view-offers',                  icon: Briefcase },
  { label: 'Candidates',  to: '/recruiter-dashboard/recruiter_candidate',           icon: Users },
  { label: 'Post a job',  to: '/recruiter-dashboard/add-offers',                    icon: Plus, action: true },
  { label: 'Interviews',  to: '/recruiter-dashboard/recruiter_candidate_entretien', icon: Calendar },
  { label: 'Profile',     to: '/recruiter-dashboard/profile',                       icon: User },
];

export default function RecruiterDashboard() {
  return <DashboardLayout navItems={NAV_ITEMS} />;
}
