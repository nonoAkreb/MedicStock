'use client';
import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownLeft,
  ArrowDownRight,
  ArrowLeftRight,
  ArrowRight,
  BellRing,
  Boxes,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Download,
  HandCoins,
  Package,
  PackagePlus,
  Pill,
  ShieldCheck,
  ShoppingCart,
  Stethoscope,
  Truck,
  Users,
  Zap,
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

type Category = 'medication' | 'ppe' | 'surgical' | 'other';
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
type Props = {
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
const xof = (n: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n) + ' FCFA';
const dateLabel = (d: string) =>
  new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
const iconFor = (c: Category) =>
  c === 'medication' ? (
    <Pill size={15} />
  ) : c === 'ppe' ? (
    <ShieldCheck size={15} />
  ) : c === 'surgical' ? (
    <Stethoscope size={15} />
  ) : (
    <Package size={15} />
  );
const categoryLabel: Record<Category, string> = {
  medication: 'Médicament',
  ppe: 'EPI',
  surgical: 'Chirurgie',
  other: 'Autre',
};
function Metric({
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
function SectionTitle({
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
function StockTable({
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

export function NurseDashboard({ name, items, movements, onMove }: Props) {
  const [query, setQuery] = useState('');
  const [todayMidnight] = useState(() => new Date(new Date().toDateString()));
  const today = movements.filter(
    (m) =>
      m.type === 'out' && new Date(m.created_at).toDateString() === todayMidnight.toDateString(),
  );
  const frequent = useMemo(() => {
    const freq = new Map<string, number>();
    movements.forEach((m) => freq.set(m.item_id, (freq.get(m.item_id) || 0) + m.quantity));
    return [...items].sort((a, b) => (freq.get(b.id) || 0) - (freq.get(a.id) || 0)).slice(0, 4);
  }, [items, movements]);
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Metric
          label="Sorties validées aujourd’hui"
          value={today.length}
          sub="Dispensations et transferts enregistrés"
          icon={<CheckCircle2 size={18} />}
          tone="emerald"
        />
        <Metric
          label="Articles disponibles"
          value={items.filter((i) => i.quantity > 0).length}
          sub={`${items.filter((i) => i.quantity === 0).length} article(s) en rupture`}
          icon={<Boxes size={18} />}
          tone="blue"
        />
      </div>
      <Card className="overflow-hidden border-emerald-100 bg-gradient-to-r from-emerald-50/70 to-white">
        <div className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-800">
              <Zap size={17} />
              <h2 className="font-[Manrope,sans-serif] text-sm font-bold">Action rapide</h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Enregistrez une dispensation patient ou un transfert de service.
            </p>
          </div>
          <Button
            className="min-h-11 w-full sm:w-auto"
            onClick={() =>
              onMove(items.find((i) => i.quantity > 0)?.id || '', 'out', 'patient_dispense')
            }
          >
            <ArrowDownRight size={16} /> Enregistrer une sortie
          </Button>
        </div>
      </Card>
      <Card className="overflow-hidden">
        <SectionTitle
          title="Articles fréquemment utilisés"
          sub="Accès rapide à vos consommables habituels"
        />
        <div className="grid gap-2 p-4 sm:grid-cols-2 xl:grid-cols-4">
          {frequent.map((i) => (
            <button
              key={i.id}
              onClick={() => onMove(i.id, 'out', 'patient_dispense')}
              disabled={i.quantity === 0}
              className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:border-emerald-200 hover:bg-emerald-50/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                {iconFor(i.category)}
              </span>
              <span className="min-w-0 flex-1">
                <b className="block truncate text-[11px] text-slate-700">{i.name}</b>
                <small className="mt-1 block text-[10px] text-slate-400">
                  Disponible : {i.quantity}
                </small>
              </span>
              <ArrowRight size={14} className="shrink-0 text-slate-300" />
            </button>
          ))}
        </div>
      </Card>
      <StockTable
        items={items}
        query={query}
        onQuery={setQuery}
        onMove={(id) => onMove(id, 'out', 'patient_dispense')}
      />
    </div>
  );
}

export function PharmacistDashboard({ items, movements, onMove }: Props) {
  const [movementFilter, setMovementFilter] = useState<'all' | 'in' | 'out'>('all');
  const [todayMidnight] = useState(() => new Date(new Date().toDateString()));
  const today = movements.filter(
    (m) => new Date(m.created_at).toDateString() === todayMidnight.toDateString(),
  );
  const incoming = today.filter((m) => m.type === 'in').reduce((s, m) => s + m.quantity, 0);
  const outgoing = today.filter((m) => m.type === 'out').reduce((s, m) => s + m.quantity, 0);
  const low = items
    .filter((i) => i.quantity <= i.min_threshold)
    .sort((a, b) => a.quantity / a.min_threshold - b.quantity / b.min_threshold);
  const expired = items.filter(
    (i) => i.expiration_date && new Date(i.expiration_date + 'T12:00:00') < todayMidnight,
  );
  const expiry = (days: number) =>
    items.filter((i) => {
      if (!i.expiration_date) return false;
      const diff =
        (new Date(i.expiration_date + 'T12:00:00').getTime() - todayMidnight.getTime()) / 86400000;
      return diff >= 0 && diff <= days;
    }).length;
  const visible = movements.filter((m) => movementFilter === 'all' || m.type === movementFilter);
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Sous le seuil critique"
          value={low.length}
          sub="À réapprovisionner"
          icon={<AlertTriangle size={18} />}
          tone="amber"
        />
        <Metric
          label="Lots périmés"
          value={expired.length}
          sub="Retirer du stock sans délai"
          icon={<CalendarClock size={18} />}
          tone="rose"
        />
        <Metric
          label="Expirent sous 30 jours"
          value={expiry(30)}
          sub={`60 j : ${expiry(60)} · 90 j : ${expiry(90)}`}
          icon={<Clock3 size={18} />}
          tone="amber"
        />
        <Metric
          label="Mouvements aujourd’hui"
          value={`${incoming} ↑ / ${outgoing} ↓`}
          sub={`${today.filter((m) => m.type === 'in').length} entrées · ${today.filter((m) => m.type === 'out').length} sorties`}
          icon={<ArrowLeftRight size={18} />}
          tone="blue"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => onMove(items[0]?.id || '', 'in', 'delivery')}>
          <ArrowDownLeft size={15} /> Enregistrer une livraison
        </Button>
        <Button
          variant="outline"
          className="border-rose-200 text-rose-700 hover:bg-rose-50"
          onClick={() =>
            onMove(items.find((i) => i.expiration_date)?.id || '', 'out', 'expired_disposal')
          }
        >
          <AlertTriangle size={15} /> Déclarer une perte / périmé
        </Button>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.25fr_.75fr]">
        <Card className="overflow-hidden">
          <SectionTitle
            title="Mouvements de stock récents"
            sub="Journal des entrées et sorties"
            action={
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                {(['all', 'in', 'out'] as const).map((k) => (
                  <button
                    key={k}
                    onClick={() => setMovementFilter(k)}
                    className={`rounded-md px-2 py-1 text-[9px] font-semibold ${movementFilter === k ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
                  >
                    {k === 'all' ? 'Tous' : k === 'in' ? 'Entrées' : 'Sorties'}
                  </button>
                ))}
              </div>
            }
          />
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Article</TableHead>
                <TableHead>Flux</TableHead>
                <TableHead>Qté</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead>Heure</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.slice(0, 8).map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-semibold text-slate-700">
                    {m.item_name || items.find((i) => i.id === m.item_id)?.name || 'Article'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={m.type === 'in' ? 'success' : 'warning'}>
                      {m.type === 'in' ? 'Entrée' : 'Sortie'}
                    </Badge>
                  </TableCell>
                  <TableCell>{m.quantity}</TableCell>
                  <TableCell>
                    {m.reason === 'delivery'
                      ? 'Livraison'
                      : m.reason === 'expired_disposal'
                        ? 'Perte / périmé'
                        : m.reason === 'patient_dispense'
                          ? 'Dispensation'
                          : 'Transfert'}
                  </TableCell>
                  <TableCell>
                    {new Date(m.created_at).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                </TableRow>
              ))}
              {!visible.length && (
                <TableRow>
                  <TableCell colSpan={5} className="py-9 text-center text-slate-400">
                    Aucun mouvement pour ce filtre.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
        <Card className="overflow-hidden">
          <SectionTitle
            title="À commander en urgence"
            sub="Classés selon le niveau de stock"
            action={<Badge variant="destructive">{low.length} alertes</Badge>}
          />
          {low.length ? (
            low.slice(0, 6).map((i) => (
              <div
                key={i.id}
                className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600">
                  {iconFor(i.category)}
                </span>
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-[11px] text-slate-700">{i.name}</b>
                  <span className="text-[9px] text-slate-400">
                    Lot {i.sku_batch} · seuil {i.min_threshold}
                  </span>
                  <Progress
                    value={i.min_threshold ? (i.quantity / i.min_threshold) * 100 : 0}
                    className="mt-1.5 h-1.5 [&>div]:bg-rose-500"
                  />
                </div>
                <span className="text-[10px] font-bold text-rose-600">{i.quantity}</span>
              </div>
            ))
          ) : (
            <div className="p-9 text-center text-xs text-slate-400">
              Aucun réapprovisionnement urgent. ✅
            </div>
          )}
        </Card>
      </div>
      <Card className="overflow-hidden">
        <SectionTitle
          title="Suivi des lots & expirations"
          sub="Priorité aux produits proches de leur date limite"
        />
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Produit</TableHead>
              <TableHead>Lot</TableHead>
              <TableHead>Fournisseur</TableHead>
              <TableHead>Expiration</TableHead>
              <TableHead>Quantité</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items
              .filter((i) => i.expiration_date)
              .sort((a, b) => String(a.expiration_date).localeCompare(String(b.expiration_date)))
              .slice(0, 7)
              .map((i) => {
                const diff = Math.ceil(
                  (new Date((i.expiration_date || '') + 'T12:00:00').getTime() -
                    todayMidnight.getTime()) /
                    86400000,
                );
                return (
                  <TableRow key={i.id}>
                    <TableCell className="font-semibold text-slate-700">{i.name}</TableCell>
                    <TableCell>{i.sku_batch}</TableCell>
                    <TableCell>{i.supplier_name || '—'}</TableCell>
                    <TableCell>{dateLabel(i.expiration_date || '')}</TableCell>
                    <TableCell>{i.quantity}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          diff < 0
                            ? 'destructive'
                            : diff <= 30
                              ? 'destructive'
                              : diff <= 60
                                ? 'warning'
                                : 'secondary'
                        }
                      >
                        {diff < 0 ? 'Périmé' : `J−${diff}`}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

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
