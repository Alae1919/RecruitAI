import React from 'react';

export default function Skeleton({ className = '', rounded = 'rounded-lg' }) {
  return (
    <div
      className={`animate-skeleton bg-brand-elevated dark:bg-brand-elevated bg-gray-200 dark:bg-brand-elevated ${rounded} ${className}`}
      style={{ animation: 'skeleton 1.6s ease-in-out infinite' }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-brand-surface border border-surface-border dark:border-brand-border rounded-xl p-6 space-y-3">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-20" rounded="rounded-lg" />
        <Skeleton className="h-8 w-20" rounded="rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="overflow-hidden rounded-xl border border-surface-border dark:border-brand-border">
      <div className="bg-white dark:bg-brand-surface">
        <div className="flex gap-4 px-6 py-3 border-b border-surface-border dark:border-brand-border">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 px-6 py-4 border-b border-surface-border dark:border-brand-border last:border-0">
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" style={{ width: `${60 + Math.random() * 40}%` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonForm({ fields = 6 }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3.5 w-24" rounded="rounded" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}
