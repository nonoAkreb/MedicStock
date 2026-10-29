'use client';
import { useMemo, useState } from 'react';
import {
  Package,
  Pill,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export type Category = 'medication' | 'ppe' | 'surgical' | 'other';
export type DashboardItem = {
  id: string;
  name: string;
  category: Category;
  sku_batch: string;
  expiration_date: string | null;
  supplier_name?: string;
  supplier_id?: string | null;
  quantity: number;
  min_threshold: number;
  price: number;
};
export type DashboardMovement = {
  id: string;
  item_id: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  created_at: string;
  item_name?: string;
  user_name?: string;
};
export type ProfileCounts = { admin: number; pharmacist: number; nurse: number };
export type ExpensePoint = { label: string; value: number };
export type Props = {
  role: string;
  name: string;
  items: DashboardItem[];
  movements: DashboardMovement[];
  profileCounts: ProfileCounts;
  expenses: ExpensePoint[];
  onMove: (itemId: string, type: 'in' | 'out', reason: string) => void;
  onNavigate: (page: string) => void;
  onExport: () => void;
};
export const xof = (n: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' FCFA';
export const dateLabel = (d: string) =>
  new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
export const iconFor = (c: Category) =>
  c === 'medication' ? (
    <Pill size={15} />
  ) : c === 'ppe' ? (
    <ShieldCheck size={15} />
  ) : c === 'surgical' ? (
    <Stethoscope size={15} />
  ) : (
    <Package size={15} />
  );
export const categoryLabel: Record<Category, string> = {
  medication: 'Médicament',
  ppe: 'EPI',
  surgical: 'Chirurgie',
  other: 'Autre',
};
export function Metric({
  label,
  value,
  sub,
  icon,
  tone = 'emerald',
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  tone?: string;
}) {
  const tones: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    violet: 'bg-violet-50 text-violet-700',
  };
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium text-slate-500">{label}</p>
          <div className="mt-2 font-[Manrope,sans-serif] text-2xl font-extrabold tracking-tight text-slate-800">
            {value}
          </div>
          <p className="mt-1 text-[10px] text-slate-400">{sub}</p>
        </div>
        <div
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tones[tone] || tones.emerald}`}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}
export function SectionTitle({
  title,
  sub,
  action,
}: {
  title: string;
  sub: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
      <div>
        <h2 className="font-[Manrope,sans-serif] text-[13px] font-bold text-slate-800">{title}</h2>
        <p className="mt-1 text-[10px] text-slate-400">{sub}</p>
      </div>
      {action}
    </div>
  );
}
export function StockTable({
  items,
  query,
  onQuery,
  onMove,
  showSupplier = false,
}: {
  items: DashboardItem[];
  query: string;
  onQuery: (s: string) => void;
  onMove: (id: string) => void;
  showSupplier?: boolean;
}) {
  const filtered = items.filter((i) =>
    (i.name + ' ' + i.sku_batch).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Card className="overflow-hidden">
      <SectionTitle title="Disponibilité des articles" sub="Recherche rapide dans l’inventaire" />
      <div className="px-4 pt-4">
        <input
          aria-label="Rechercher dans l’inventaire"
          className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          placeholder="Rechercher un article ou un lot…"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Article</TableHead>
            <TableHead>Lot</TableHead>
            <TableHead>Disponible</TableHead>
            <TableHead>Statut</TableHead>
            {showSupplier && <TableHead>Fournisseur</TableHead>}
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((i) => (
            <TableRow key={i.id}>
              <TableCell>
                <span className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                    {iconFor(i.category)}
                  </span>
                  <span className="font-semibold text-slate-700">
                    {i.name}
                    <small className="mt-1 block font-normal text-slate-400">
                      {categoryLabel[i.category]}
                    </small>
                  </span>
                </span>
              </TableCell>
              <TableCell>{i.sku_batch}</TableCell>
              <TableCell>
                <b className="text-slate-800">{i.quantity}</b>
                <span className="ml-1 text-slate-400">unités</span>
              </TableCell>
              <TableCell>
                {i.quantity > 0 ? (
                  <Badge variant={i.quantity <= i.min_threshold ? 'warning' : 'success'}>
                    {i.quantity <= i.min_threshold ? 'Stock bas' : 'Disponible'}
                  </Badge>
                ) : (
                  <Badge variant="destructive">Rupture</Badge>
                )}
              </TableCell>
              {showSupplier && <TableCell>{i.supplier_name || '—'}</TableCell>}
              <TableCell>
                <Button
                  variant="outline"
                  className="h-8 rounded-lg px-2.5 py-1.5 text-[10px]"
                  disabled={i.quantity < 1}
                  onClick={() => onMove(i.id)}
                >
                  Sortie rapide
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {!filtered.length && (
            <TableRow>
              <TableCell
                colSpan={showSupplier ? 6 : 5}
                className="py-10 text-center text-xs text-slate-400"
              >
                Aucun article correspondant à cette recherche.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

