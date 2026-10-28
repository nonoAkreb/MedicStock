import type { HTMLAttributes } from 'react';
export function Card({className='',...props}:HTMLAttributes<HTMLDivElement>){return <div className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_35px_-24px_rgba(15,48,63,.25)] ${className}`} {...props}/>}
export function CardHeader({className='',...props}:HTMLAttributes<HTMLDivElement>){return <div className={`flex flex-col gap-1.5 p-6 ${className}`} {...props}/>}
export function CardTitle({className='',...props}:HTMLAttributes<HTMLHeadingElement>){return <h3 className={`font-semibold leading-none tracking-tight ${className}`} {...props}/>}
export function CardDescription({className='',...props}:HTMLAttributes<HTMLParagraphElement>){return <p className={`text-sm text-slate-500 ${className}`} {...props}/>}
export function CardContent({className='',...props}:HTMLAttributes<HTMLDivElement>){return <div className={`p-6 pt-0 ${className}`} {...props}/>}
