import React from 'react';
import Button from '../ui/Button';

export default function EmptyState({ icon = '📭', title, description, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fadeIn">
      <div className="w-16 h-16 mb-5 rounded-2xl bg-gray-100 dark:bg-brand-elevated flex items-center justify-center text-2xl">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-brand-text-primary mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-brand-text-muted max-w-xs mb-6">{description}</p>
      )}
      {action && actionLabel && (
        <Button onClick={action}>{actionLabel}</Button>
      )}
    </div>
  );
}
