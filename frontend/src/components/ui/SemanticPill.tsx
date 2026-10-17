import React from 'react';

export type SemanticPillVariant = 'emerald' | 'blue' | 'red' | 'slate' | 'zk-masked';

export interface SemanticPillProps {
  variant?: SemanticPillVariant;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const VARIANT_STYLES: Record<SemanticPillVariant, string> = {
  emerald: 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]',
  blue: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]',
  red: 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]',
  slate: 'bg-[#F8FAFC] text-[#334155] border-[#CBD5E1]',
  'zk-masked': 'bg-[#0F172A] text-[#FFFFFF] border-[#0F172A] tracking-wider',
};

export function SemanticPill({
  variant = 'slate',
  children,
  className = '',
  title,
}: SemanticPillProps) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-0.5 font-mono text-[11px] font-semibold leading-tight whitespace-nowrap tabular-nums ${VARIANT_STYLES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
