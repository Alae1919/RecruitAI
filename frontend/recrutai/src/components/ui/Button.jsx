import React from 'react';
import Spinner from './Spinner';

const variants = {
  primary:   null, // handled via inline style
  secondary: 'text-brand-text-primary hover:bg-brand-elevated active:scale-[.98]',
  danger:    'bg-red-500 hover:bg-red-600 text-white font-semibold active:scale-[.98]',
  ghost:     'text-brand-text-muted hover:bg-brand-elevated hover:text-brand-text-primary active:scale-[.98]',
  link:      'text-brand-accent hover:text-brand-accent-bright underline-offset-2 hover:underline p-0 h-auto',
};

const primaryStyle = {
  background: 'linear-gradient(135deg, #F59E0B 0%, #FCD34D 100%)',
  boxShadow: '0 0 16px rgba(245,158,11,0.25)',
};

const secondaryStyle = {
  background: '#101420',
  border: '1px solid rgba(35,42,62,0.8)',
};

const sizes = {
  sm:   'h-8 px-3 text-xs rounded-lg gap-1.5',
  md:   'h-10 px-4 text-sm rounded-xl gap-2',
  lg:   'h-11 px-6 text-sm rounded-xl gap-2',
  icon: 'h-9 w-9 rounded-xl',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  className = '',
  type = 'button',
  style: extraStyle = {},
  ...props
}) {
  const isDisabled = disabled || loading;

  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';

  const inlineStyle = isPrimary
    ? { ...primaryStyle, ...extraStyle }
    : isSecondary
      ? { ...secondaryStyle, ...extraStyle }
      : extraStyle;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-semibold transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${isPrimary ? 'text-gray-900 hover:brightness-110 active:scale-[.98]' : (variants[variant] || '')}
        ${sizes[size]} ${className}
      `}
      style={inlineStyle}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : null}
      {children}
    </button>
  );
}
