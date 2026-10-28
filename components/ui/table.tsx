import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
export function Table({className='',...props}:TableHTMLAttributes<HTMLTableElement>){return <div className="relative w-full overflow-auto"><table className={`w-full caption-bottom text-left text-xs ${className}`} {...props}/></div>}
export function TableHeader({className='',...props}:HTMLAttributes<HTMLTableSectionElement>){return <thead className={`[&_tr]:border-b [&_tr]:border-slate-100 ${className}`} {...props}/>}
export function TableBody({className='',...props}:HTMLAttributes<HTMLTableSectionElement>){return <tbody className={`[&_tr:last-child]:border-0 ${className}`} {...props}/>}
export function TableRow({className='',...props}:HTMLAttributes<HTMLTableRowElement>){return <tr className={`border-b border-slate-100 transition-colors hover:bg-slate-50/70 ${className}`} {...props}/>}
export function TableHead({className='',...props}:ThHTMLAttributes<HTMLTableCellElement>){return <th className={`h-10 px-3 text-[9px] font-bold uppercase tracking-wider text-slate-400 ${className}`} {...props}/>}
export function TableCell({className='',...props}:TdHTMLAttributes<HTMLTableCellElement>){return <td className={`px-3 py-3 align-middle text-[11px] text-slate-600 ${className}`} {...props}/>}
