'use client';

import React from 'react';

export interface CalculatorButtonProps {
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
  colSpan?: number;
}

export default function CalculatorButton({ 
  onClick, 
  className = '', 
  children, 
  ariaLabel,
  colSpan = 1
}: CalculatorButtonProps) {
  const colSpanClass = colSpan === 2 ? 'col-span-2' : '';
  
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`
        relative overflow-hidden rounded-xl font-semibold text-lg
        transition-all duration-200 transform active:scale-95
        hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400
        ${colSpanClass} ${className}
      `}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
    </button>
  );
} 