import React from 'react';

const inputBase = {
  background: '#101420',
  border: '1px solid rgba(35,42,62,0.8)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
};

function handleFocus(e, error) {
  e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.7)' : 'rgba(245,158,11,0.5)';
  e.currentTarget.style.boxShadow = error
    ? 'inset 0 1px 0 rgba(255,255,255,0.03), 0 0 0 3px rgba(239,68,68,0.08)'
    : 'inset 0 1px 0 rgba(255,255,255,0.03), 0 0 0 3px rgba(245,158,11,0.07)';
}

function handleBlur(e, error) {
  e.currentTarget.style.borderColor = error ? 'rgba(239,68,68,0.5)' : 'rgba(35,42,62,0.8)';
  e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255,255,255,0.03)';
}

export default function Input({
  label,
  error,
  hint,
  className = '',
  containerClassName = '',
  required,
  as: Tag = 'input',
  ...props
}) {
  const id = props.id || props.name;
  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-brand-text-muted">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <Tag
        id={id}
        className={`
          w-full px-3.5 py-2.5 text-sm rounded-xl
          text-brand-text-primary
          placeholder:text-brand-text-disabled
          transition-all outline-none
          disabled:opacity-50 disabled:cursor-not-allowed
          ${Tag === 'textarea' ? 'resize-y min-h-[80px]' : ''}
          ${className}
        `}
        style={{
          ...inputBase,
          borderColor: error ? 'rgba(239,68,68,0.5)' : 'rgba(35,42,62,0.8)',
        }}
        onFocus={e => handleFocus(e, !!error)}
        onBlur={e => handleBlur(e, !!error)}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-brand-text-disabled">{hint}</p>}
    </div>
  );
}

export function Select({ label, error, hint, children, containerClassName = '', className = '', required, ...props }) {
  const id = props.id || props.name;
  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-brand-text-muted">
          {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
      )}
      <select
        id={id}
        className={`w-full px-3.5 py-2.5 text-sm rounded-xl text-brand-text-primary outline-none transition-all cursor-pointer ${className}`}
        style={{ ...inputBase, borderColor: error ? 'rgba(239,68,68,0.5)' : 'rgba(35,42,62,0.8)' }}
        onFocus={e => handleFocus(e, !!error)}
        onBlur={e => handleBlur(e, !!error)}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-brand-text-disabled">{hint}</p>}
    </div>
  );
}
