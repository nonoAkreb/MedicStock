import { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BellRing,
  Download,
  HandCoins,
  Truck,
  Users,
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
import {
  Metric,
  SectionTitle,
  xof,
  type Props,
} from './shared';

export function AdminDashboard({
  items,
  movements,
  profileCounts,
  expenses,
  onNavigate,
  onExport,
}: Props) {
  const [todayMidnight] = useState(() => new Date(new Date().toDateString()));
  const total = items.reduce((s, i) => s + i.quantity * i.price, 0);
  const monthlyOut = movements
    .filter(
      (m) =>
        m.type === 'out' &&
        new Date(m.created_at).getMonth() === todayMidnight.getMonth() &&
        new Date(m.created_at).getFullYear() === todayMidnight.getFullYear(),
    )
    .reduce((s, m) => s + m.quantity * (items.find((i) => i.id === m.item_id)?.price || 0), 0);
  const turnover = total > 0 ? (monthlyOut / total) * 100 : 0;
  const max = Math.max(1, ...expenses.map((e) => e.value));
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Valeur totale de l’inventaire"
          value={xof(total)}
          sub="Calculée sur les quantités disponibles"
          icon={<HandCoins size={18} />}
          tone="emerald"
        />
        <Metric
          label="Rotation estimée ce mois"
          value={`${turnover.toFixed(1)}%`}
          sub="Sorties valorisées / valeur en stock"
          icon={<Activity size={18} />}
          tone="blue"
        />
        <Metric
          label="Utilisateurs actifs"
          value={profileCounts.admin + profileCounts.pharmacist + profileCounts.nurse}
          sub="Comptes répertoriés dans la clinique"
          icon={<Users size={18} />}
          tone="violet"
        />
        <Metric
          label="Articles à surveiller"
          value={items.filter((i) => i.quantity <= i.min_threshold).length}
          sub="Sous le seuil de réapprovisionnement"
          icon={<BellRing size={18} />}
          tone="amber"
        />
      </div>
      <div className="no-print flex flex-wrap gap-2">
        <Button onClick={() => onNavigate('team')}>
          <Users size={15} /> Gérer les utilisateurs
        </Button>
        <Button variant="outline" onClick={() => onNavigate('suppliers')}>
          <Truck size={15} /> Fournisseurs
        </Button>
        <Button variant="outline" onClick={onExport}>
          <Download size={15} /> Export CSV
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <Download size={15} /> Imprimer / PDF
        </Button>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <Card className="overflow-hidden">
          <SectionTitle
            title="Dépenses en consommables"
            sub="Valeur des sorties de stock · 6 derniers mois"
            action={<Badge variant="secondary">XOF</Badge>}
          />
          <div className="px-5 pb-5 pt-6">
            <div className="flex h-48 items-end gap-3 border-b border-l border-slate-100 px-2 pb-1">
              {expenses.map((e, i) => (
                <div
                  key={`${e.label}-${i}`}
                  className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <span className="text-[8px] text-slate-400 opacity-0 transition group-hover:opacity-100">
                    {xof(e.value)}
                  </span>
                  <div
                    title={`${e.label} · ${xof(e.value)}`}
                    className={`w-full max-w-12 rounded-t-lg transition-all ${i === expenses.length - 1 ? 'bg-emerald-500' : 'bg-cyan-200 hover:bg-cyan-300'}`}
                    style={{ height: `${Math.max(5, (e.value / max) * 100)}%` }}
                  />
                  <span className="text-[9px] capitalize text-slate-400">{e.label}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[9px] text-slate-400">
              Calculé à partir des sorties journalisées et du prix unitaire des articles.
            </p>
          </div>
        </Card>
        <Card className="overflow-hidden">
          <SectionTitle
            title="Répartition des accès"
            sub="Utilisateurs par rôle"
            action={
              <button
                onClick={() => onNavigate('team')}
                className="text-[10px] font-semibold text-emerald-700"
              >
                Gérer <ArrowRight size={12} className="ml-1 inline" />
              </button>
            }
          />
          <div className="space-y-4 p-5">
            {[
              {
                role: 'Administrateurs',
                count: profileCounts.admin,
                initial: 'A',
                color: 'bg-violet-100 text-violet-700',
              },
              {
                role: 'Pharmaciens',
                count: profileCounts.pharmacist,
                initial: 'P',
                color: 'bg-cyan-100 text-cyan-700',
              },
              {
                role: 'Infirmiers',
                count: profileCounts.nurse,
                initial: 'I',
                color: 'bg-emerald-100 text-emerald-700',
              },
            ].map((u) => (
              <div key={u.role} className="flex items-center gap-3">
                <Avatar className={u.color}>{u.initial}</Avatar>
                <span className="flex-1 text-[11px] font-medium text-slate-600">{u.role}</span>
                <Badge variant="secondary">{u.count}</Badge>
              </div>
            ))}
          </div>
          <div className="mx-5 mb-5 rounded-xl bg-slate-50 p-3 text-[10px] leading-5 text-slate-500">
            Les droits sont contrôlés par rôle dans Supabase RLS. Les prix et rapports financiers
            sont réservés à la direction.
          </div>
        </Card>
      </div>
      <Card className="overflow-hidden">
        <SectionTitle
          title="Inventaire sous supervision"
          sub="Principaux postes et fournisseurs associés"
          action={
            <button
              onClick={() => onNavigate('inventory')}
              className="text-[10px] font-semibold text-emerald-700"
            >
              Voir l’inventaire <ArrowRight size={12} className="ml-1 inline" />
            </button>
          }
        />
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Article</TableHead>
              <TableHead>Lot</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Valeur</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.slice(0, 6).map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-semibold text-slate-700">{i.name}</TableCell>
                <TableCell>{i.sku_batch}</TableCell>
                <TableCell>{i.supplier_name || '—'}</TableCell>
                <TableCell>{i.quantity}</TableCell>
                <TableCell>{xof(i.quantity * i.price)}</TableCell>
                <TableCell>
                  {i.quantity <= i.min_threshold ? (
                    <Badge variant="warning">À commander</Badge>
                  ) : (
                    <Badge variant="success">Normal</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
