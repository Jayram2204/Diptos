import React from 'react';

export type SemanticPillVariant = 'emerald' | 'blue' | 'red' | 'slate' | 'zk-masked' | 'amber';

export interface SemanticPillProps {
  variant?: SemanticPillVariant;
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const VARIANT_STYLES: Record<SemanticPillVariant, string> = {
  emerald: 'bg-emerald-950/50 text-emerald-400 border-emerald-500/30',
  blue: 'bg-blue-950/50 text-sky-400 border-sky-500/30',
  red: 'bg-red-950/50 text-rose-400 border-rose-500/30',
  slate: 'bg-slate-900/60 text-slate-300 border-slate-700/60',
  'zk-masked': 'bg-purple-950/50 text-purple-300 border-purple-500/30 tracking-wider',
  amber: 'bg-amber-950/50 text-amber-400 border-amber-500/30',
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium leading-tight whitespace-nowrap tabular-nums ${VARIANT_STYLES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
