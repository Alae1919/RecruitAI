import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MessageSquare, Activity, Monitor, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: <Clock size={22} />,
    title: 'AI Screening',
    description: 'Intelligent CV analysis scores candidates against your job requirements automatically, saving hours of manual review.',
  },
  {
    icon: <MessageSquare size={22} />,
    title: 'Smart Interviews',
    description: 'Generate tailored questions for each role and candidate profile. Video responses are transcribed and scored automatically.',
  },
  {
    icon: <Activity size={22} />,
    title: 'Real-time Analytics',
    description: 'Track pipeline health, candidate scores, and hiring velocity with dashboards built for both recruiters and candidates.',
  },
  {
    icon: <Monitor size={22} />,
    title: 'Any Device',
    description: 'Fully responsive — candidates can record video interviews on mobile, recruiters can review anywhere.',
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-24 bg-surface-light dark:bg-brand-base border-t border-surface-border dark:border-brand-border">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
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

        <div className="text-center">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-accent hover:bg-brand-accent-hover text-gray-900 font-bold rounded-2xl text-sm transition-all shadow-glow hover:shadow-lg active:scale-95"
          >
            Start hiring smarter
            <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
          <p className="text-xs text-gray-400 dark:text-brand-text-disabled mt-3">Free to use. No credit card required.</p>
        </div>
      </div>
    </section>
  );
}
