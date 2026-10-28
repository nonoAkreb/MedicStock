import type { ButtonHTMLAttributes } from 'react';

const variants: Record<string, string> = {
  default:
    'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:ring-emerald-500',
  outline:
    'border border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/70 focus-visible:ring-emerald-500',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus-visible:ring-slate-400',
  dark: 'bg-[#123148] text-white hover:bg-[#1a435c] focus-visible:ring-cyan-300',
};
export function buttonVariants({
  variant = 'default',
  className = '',
}: { variant?: keyof typeof variants | string; className?: string } = {}) {
  return `inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variants[variant] || variants.default} ${className}`;
}
export function Button({
  variant = 'default',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return <button className={buttonVariants({ variant, className })} {...props} />;
}
