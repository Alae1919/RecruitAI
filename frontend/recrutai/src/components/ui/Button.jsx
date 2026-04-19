import React from 'react';
import Spinner from './Spinner';
import { BorderRotate } from './animated-gradient-border';

const variants = {
  primary:   null, // handled via inline style
  secondary: 'text-brand-text-primary hover:bg-brand-elevated active:scale-[.98]',
  danger:    'bg-red-500 hover:bg-red-600 text-white font-semibold active:scale-[.98]',
  ghost:     'text-brand-text-muted hover:bg-brand-elevated hover:text-brand-text-primary active:scale-[.98]',
  link:      'text-brand-accent hover:text-brand-accent-bright underline-offset-2 hover:underline p-0 h-auto',
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
    ? { background: 'linear-gradient(135deg, rgba(245,158,11,0.85) 0%, rgba(252,211,77,0.85) 100%)', ...extraStyle }
    : isSecondary
      ? { ...secondaryStyle, ...extraStyle }
      : extraStyle;

  const baseButton = (
    <button
      type={type}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center font-semibold transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 w-full h-full
        ${isPrimary ? 'text-gray-900' : (variants[variant] || '')}
        ${className}
      `}
      style={inlineStyle}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : null}
      {children}
    </button>
  );

  // If the button is primary, wrap it in the glowing animated border!
  if (isPrimary && !disabled) {
    return (
      <BorderRotate 
        animationSpeed={3}
        borderWidth={2}
        borderRadius={size === 'sm' ? 8 : 12}
        gradientColors={{
          primary: '#F59E0B',
          secondary: '#7C3AED',
          accent: '#FCD34D'
        }}
        backgroundColor="#101420"
        className={`p-0 ${sizes[size]} shadow-glow`}
      >
        {baseButton}
      </BorderRotate>
    );
  }

  // Otherwise return standard button structure
  return React.cloneElement(baseButton, {
    className: `${baseButton.props.className} ${sizes[size]}`
  });
}
