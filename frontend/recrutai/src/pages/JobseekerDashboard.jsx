import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { Search, FileText, Calendar, User } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Browse Jobs',      to: '/jobseeker-dashboard/mes_applications',  icon: Search },
  { label: 'My Applications',  to: '/jobseeker-dashboard/mes_candidatures',  icon: FileText },
  { label: 'Interviews',       to: '/jobseeker-dashboard/mes_entretiens',    icon: Calendar },
  { label: 'Profile',          to: '/jobseeker-dashboard/profile',           icon: User },
];

export default function JobseekerDashboard() {
  return <DashboardLayout navItems={NAV_ITEMS} />;
}
