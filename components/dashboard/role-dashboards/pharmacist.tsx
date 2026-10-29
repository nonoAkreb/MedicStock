import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowLeftRight,
  CalendarClock,
  Clock3,
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
  dateLabel,
  iconFor,
  type Props,
} from './shared';

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

