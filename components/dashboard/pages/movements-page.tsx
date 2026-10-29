import { Plus } from 'lucide-react';
import { reasonLabel } from '@/lib/dashboard/constants';
import { ago } from '@/lib/dashboard/format';
import type { Item, Movement } from '@/lib/dashboard/types';

export function MovementsPage({
  movements,
  items,
  name,
  onNewMovement,
}: {
  movements: Movement[];
  items: Item[];
  name: string;
  onNewMovement: () => void;
}) {
  return (
    <div className="panel content-table">
      <div className="panel-head">
        <div>
          <div className="panel-title">Historique des mouvements</div>
          <div className="panel-sub">Entrées et sorties enregistrées dans le centre</div>
        </div>
        <button className="btn" onClick={onNewMovement}>
          <Plus size={14} /> Nouveau mouvement
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ARTICLE</th>
              <th>TYPE</th>
              <th>QUANTITÉ</th>
              <th>MOTIF</th>
              <th>UTILISATEUR</th>
              <th>DATE</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id}>
                <td>
                  <strong>
                    {m.item_name || items.find((i) => i.id === m.item_id)?.name || 'Article'}
                  </strong>
                </td>
                <td>
                  <span className={'pill ' + (m.type === 'in' ? 'green' : 'yellow')}>
                    {m.type === 'in' ? 'Entrée' : 'Sortie'}
                  </span>
                </td>
                <td>
                  <b style={{ color: m.type === 'in' ? '#159b78' : '#d17c63' }}>
                    {m.type === 'in' ? '+' : '−'}
                    {m.quantity}
                  </b>
                </td>
                <td>
{reasonLabel[m.reason] || m.reason}
                </td>
                <td>{m.user_name || name}</td>
                <td>{ago(m.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
