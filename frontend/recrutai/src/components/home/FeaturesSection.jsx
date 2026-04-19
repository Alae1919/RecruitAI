import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/><path d="M12 8v4l3 3"/>
      </svg>
    ),
    title: 'AI Screening',
    description: 'Intelligent CV analysis scores candidates against your job requirements automatically, saving hours of manual review.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    title: 'Smart Interviews',
    description: 'Generate tailored questions for each role and candidate profile. Video responses are transcribed and scored automatically.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: 'Real-time Analytics',
    description: 'Track pipeline health, candidate scores, and hiring velocity with dashboards built for both recruiters and candidates.',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
    title: 'Any Device',
    description: 'Fully responsive — candidates can record video interviews on mobile, recruiters can review anywhere.',
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-surface-light dark:bg-brand-base border-t border-surface-border dark:border-brand-border">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-accent/30 bg-brand-accent/10 mb-4">
            <span className="text-xs font-semibold text-brand-accent tracking-wide uppercase">Platform features</span>
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-brand-text-primary tracking-tight mb-4">
            Built for modern hiring
          </h2>
          <p className="text-base text-gray-500 dark:text-brand-text-muted max-w-xl mx-auto">
            Everything you need to find, evaluate, and hire top talent — without the paperwork.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map(({ icon, title, description }) => (
            <div
              key={title}
              className="group p-6 rounded-2xl border border-surface-border dark:border-brand-border bg-white dark:bg-brand-surface hover:border-brand-accent/40 dark:hover:border-brand-accent/40 hover:shadow-card-light dark:hover:shadow-card transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent mb-4 group-hover:bg-brand-accent/20 transition-colors">
                {icon}
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-brand-text-primary mb-2">{title}</h3>
              <p className="text-sm text-gray-500 dark:text-brand-text-muted leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-accent hover:bg-brand-accent-hover text-gray-900 font-bold rounded-2xl text-sm transition-all shadow-glow hover:shadow-lg active:scale-95"
          >
            Start hiring smarter
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
          <p className="text-xs text-gray-400 dark:text-brand-text-disabled mt-3">Free to use. No credit card required.</p>
        </div>
      </div>
    </section>
  );
}
