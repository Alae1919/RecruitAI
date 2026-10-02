import React from 'react';
import { Search } from 'lucide-react';
import Input from './Input';

/** Plain search field: same surface, border and focus ring as every other Input. */
export default function SearchInput({ value, onChange, placeholder = 'Search…', className = '', ...props }) {
  return (
    <div className={`relative min-w-[200px] ${className}`}>
      <Search
        size={15}
        aria-hidden="true"
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-disabled pointer-events-none"
      />
      <Input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label={placeholder}
        className="pl-10"
        containerClassName="space-y-0"
        {...props}
      />
    </div>
  );
}
