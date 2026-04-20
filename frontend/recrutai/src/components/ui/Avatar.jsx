import React from 'react';

export default function Avatar({ name, size = 32, rounded = 'full' }) {
  const initials = (name || '?').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();
  let h = 0;
  for (let i = 0; i < (name || '').length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  const rounding = rounded === 'xl' ? '0.75rem' : '50%';
  return (
    <div
      className="grid place-items-center font-semibold text-white shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: rounding,
        background: `oklch(0.52 0.12 ${h})`,
        boxShadow: `0 0 ${Math.round(size * 0.4)}px oklch(0.52 0.12 ${h} / 0.4)`,
        fontSize: size > 48 ? 22 : size > 28 ? 13 : 10,
      }}
    >
      {initials}
    </div>
  );
}
