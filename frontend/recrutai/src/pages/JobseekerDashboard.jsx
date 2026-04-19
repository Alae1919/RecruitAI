import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';

const NAV_ITEMS = [
  { label: 'Browse Jobs',     to: '/jobseeker-dashboard/mes_applications' },
  { label: 'My Applications', to: '/jobseeker-dashboard/mes_candidatures' },
  { label: 'Interviews',      to: '/jobseeker-dashboard/mes_entretiens' },
  { label: 'Profile',         to: '/jobseeker-dashboard/profile' },
];

export default function JobseekerDashboard() {
  return <DashboardLayout navItems={NAV_ITEMS} />;
}
