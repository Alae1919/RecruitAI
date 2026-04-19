import React from 'react';

const cardStyle = {
  background: '#101420',
  border: '1px solid rgba(35,42,62,0.8)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
};

const cardHoverStyle = {
  ...cardStyle,
  transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
};

export default function Card({ children, className = '', hover = false, padding = true }) {
  return (
    <div
      className={`rounded-xl ${padding ? 'p-6' : ''} ${className}`}
      style={hover ? cardHoverStyle : cardStyle}
      onMouseEnter={hover ? e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'rgba(35,42,62,1)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
      } : undefined}
      onMouseLeave={hover ? e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'rgba(35,42,62,0.8)';
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)';
      } : undefined}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-base font-semibold text-brand-text-primary ${className}`}>
      {children}
    </h3>
  );
}
