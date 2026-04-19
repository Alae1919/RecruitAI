import React from 'react';
import PublicHeader from '../navigation/PublicHeader';

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface-light dark:bg-brand-base transition-theme">
      <PublicHeader />
      <main className="pt-14">{children}</main>
    </div>
  );
}
