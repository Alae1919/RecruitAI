import React from 'react';
import { Link } from 'react-router-dom';

export function Logo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative w-7 h-7 rounded-lg bg-brand-accent grid place-items-center shadow-glow">
        <svg viewBox="0 0 24 24" className="w-4 h-4 text-brand-base" fill="currentColor">
          <path d="M6 4h4.5c2.5 0 4.2 1.3 4.2 3.6 0 1.8-1 3-2.7 3.4l3.8 4.9h-3.3l-3.4-4.6H8.8V16H6V4zm2.8 2.2v3h1.7c1.2 0 1.9-.6 1.9-1.5s-.7-1.5-1.9-1.5H8.8zM17.5 11.8l1.4-.4v4.6h-1.4v-4.2z"/>
          <circle cx="18.2" cy="8.5" r="1.6"/>
        </svg>
      </div>
      <div className="leading-none">
        <div className="text-[15px] font-bold text-brand-text-primary tracking-tight">
          recrut<span className="text-brand-accent">ai</span>
        </div>
        <div className="text-[9px] font-mono tracking-[0.18em] text-brand-text-disabled uppercase mt-0.5">v.0.4 · beta</div>
      </div>
    </div>
  );
}

export default function PublicHeader() {
  return (
    <nav className="h-14 px-6 border-b border-brand-border bg-brand-base/70 backdrop-blur-md sticky top-0 z-40 flex items-center">
      <Link to="/"><Logo /></Link>

      <div className="flex items-center gap-6 ml-10 text-sm text-brand-text-muted">
        <span className="hover:text-brand-text-primary transition-colors cursor-pointer">Product</span>
        <span className="hover:text-brand-text-primary transition-colors cursor-pointer">Customers</span>
        <span className="hover:text-brand-text-primary transition-colors cursor-pointer">Pricing</span>
        <span className="hover:text-brand-text-primary transition-colors cursor-pointer">Changelog</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Link
          to="/login"
          className="h-8 px-3 text-xs rounded-lg font-medium text-brand-text-muted hover:bg-brand-elevated hover:text-brand-text-primary transition-colors inline-flex items-center"
        >
          Sign in
        </Link>
        <Link
          to="/register"
          className="h-8 px-3 text-xs rounded-lg bg-brand-accent hover:bg-brand-accent-hover text-gray-900 font-semibold inline-flex items-center gap-1.5 transition-colors shadow-sm"
        >
          Get started
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </Link>
      </div>
    </nav>
  );
}
