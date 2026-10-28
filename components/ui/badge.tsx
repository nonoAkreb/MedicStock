import type { HTMLAttributes } from 'react';
type Variant = 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline';
const style: Record<Variant, string> = {
  default: 'border-transparent bg-slate-900 text-white',
  success: 'border-transparent bg-emerald-50 text-emerald-700',
  warning: 'border-transparent bg-amber-50 text-amber-700',
  destructive: 'border-transparent bg-rose-50 text-rose-700',
  secondary: 'border-transparent bg-slate-100 text-slate-600',
  outline: 'border-slate-200 text-slate-600',
};
export function Badge({
  variant = 'default',
  className = '',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold leading-none ${style[variant]} ${className}`}
      {...props}
    />
  );
}
