import type { HTMLAttributes } from 'react';
export function Avatar({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-emerald-100 text-xs font-bold text-emerald-800 ${className}`}
      {...props}
    />
  );
}
