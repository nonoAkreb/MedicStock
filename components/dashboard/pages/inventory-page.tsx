import {
  Download,
  MoreHorizontal,
  Package,
  Pill,
  Plus,
  Search,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { categoryLabel } from '@/lib/dashboard/constants';
import { money, shortDate } from '@/lib/dashboard/format';
import type { Item, Supplier } from '@/lib/dashboard/types';

const catIcon = (c: string) =>
  c === 'medication' ? (
    <Pill size={15} />
  ) : c === 'ppe' ? (
    <ShieldCheck size={15} />
  ) : c === 'surgical' ? (
    <Stethoscope size={15} />
  ) : (
    <Package size={15} />
  );
const stockBadge = (i: Item) =>
  i.quantity <= i.min_threshold * 0.5
    ? ['Critique', 'red']
    : i.quantity <= i.min_threshold
      ? ['Stock bas', 'yellow']
      : ['En stock', 'green'];

function InventoryTable({
  filtered,
  role,
  suppliers,
  onNewItem,
  onEditItem,
}: {
  filtered: Item[];
  role: string;
  suppliers: Supplier[];
  onNewItem: () => void;
  onEditItem: (i: Item) => void;
}) {
  return (
    <div className="panel content-table">
      <div className="panel-head">
        <div>
          <div className="panel-title">
            Articles en stock{' '}
            <span style={{ color: '#95a3a5', fontWeight: 500 }}>({filtered.length})</span>
          </div>
          <div className="panel-sub">Consultez et gérez les fournitures de votre centre</div>
        </div>
        {role !== 'nurse' && (
          <button
            className="btn"
            onClick={onNewItem}
          >
            <Plus size={14} /> Nouvel article
          </button>
        )}
      </div>
      {filtered.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ARTICLE</th>
                <th>CATÉGORIE</th>
                <th>LOT / SÉRIE</th>
                <th>EXPIRATION</th>
                <th>QUANTITÉ</th>
                <th>STATUT</th>
                <th>FOURNISSEUR</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => (
                <tr key={i.id}>
                  <td>
                    <div className="item-name">
                      <div className={'item-thumb ' + i.category}>{catIcon(i.category)}</div>
                      <div>
                        <strong>{i.name}</strong>
                        {role !== 'nurse' && (
                          <div style={{ fontSize: 9, color: '#9aa6a7', marginTop: 3 }}>
                            {money(i.price)} / unité
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{categoryLabel[i.category]}</td>
                  <td>{i.sku_batch}</td>
                  <td>{shortDate(i.expiration_date)}</td>
                  <td>
                    <div className="stock-cell">
                      <b style={{ color: '#304750' }}>{i.quantity}</b>
                      <div className="stock-track">
                        <div
                          className={
                            'stock-fill ' +
                            (i.quantity <= i.min_threshold * 0.5
                              ? 'critical'
                              : i.quantity <= i.min_threshold
                                ? 'low'
                                : '')
                          }
                          style={{
                            width: `${Math.min(100, (i.quantity / Math.max(1, i.min_threshold * 2)) * 100)}%`,
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 9, color: '#9aa6a7' }}>min. {i.min_threshold}</span>
                    </div>
                  </td>
                  <td>
                    <span className={'pill ' + stockBadge(i)[1]}>{stockBadge(i)[0]}</span>
                  </td>
                  <td>
                    {i.supplier_name || suppliers.find((s) => s.id === i.supplier_id)?.name || '—'}
                  </td>
                  <td>
                    {role !== 'nurse' && (
                      <button
                        className="icon-btn"
                        style={{ width: 28, height: 28 }}
                        onClick={() => onEditItem(i)}
                        aria-label="Modifier"
                      >
                        <MoreHorizontal size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty">
          <div className="empty-icon">
            <Search size={20} />
          </div>
          <b>Aucun article trouvé</b>
          <span>Essayez une autre recherche ou modifiez les filtres.</span>
        </div>
      )}
    </div>
  );
}

export function InventoryPage({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  role,
  filtered,
  suppliers,
  onNewItem,
  onEditItem,
  onExport,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  filter: string;
  onFilterChange: (v: string) => void;
  role: string;
  filtered: Item[];
  suppliers: Supplier[];
  onNewItem: () => void;
  onEditItem: (i: Item) => void;
  onExport: () => void;
}) {
  return (
            <>
              <div className="page-toolbar">
                <div className="search">
                  <Search size={15} />
                  <input
                    placeholder="Rechercher un article, un lot…"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                  />
                </div>
                <select
                  className="select"
                  value={filter}
                  onChange={(e) => onFilterChange(e.target.value)}
                >
                  <option value="all">Toutes les catégories</option>
                  <option value="medication">Médicaments</option>
                  <option value="ppe">EPI</option>
                  <option value="surgical">Chirurgie</option>
                  <option value="other">Autres</option>
                </select>
                {role === 'admin' && (
                  <button className="btn secondary" onClick={onExport}>
                    <Download size={14} /> Exporter
                  </button>
                )}
              </div>
              <InventoryTable filtered={filtered} role={role} suppliers={suppliers} onNewItem={onNewItem} onEditItem={onEditItem} />
            </>
  );
}
