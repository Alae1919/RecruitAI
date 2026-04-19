import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-light dark:bg-brand-base p-6">
        <div className="text-center max-w-md animate-fadeIn">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <span className="text-2xl">⚠</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-brand-text-primary mb-2">Something went wrong</h1>
          <p className="text-sm text-gray-500 dark:text-brand-text-muted mb-6">
            An unexpected error occurred. Try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-accent hover:bg-brand-accent-hover text-gray-900 font-semibold text-sm rounded-xl transition-colors"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
