import { useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

import {
  Metric,
  SectionTitle,
  StockTable,
  iconFor,
  type Props,
} from './shared';

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

