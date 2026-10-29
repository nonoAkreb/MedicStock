import { Plus, Search } from 'lucide-react';
import { money, shortDate } from '@/lib/dashboard/format';
import type { Item, Order, Supplier } from '@/lib/dashboard/types';

export function OrdersPage({
  query,
  onQueryChange,
  orders,
  suppliers,
  items,
  onNewOrder,
  onReceive,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  orders: Order[];
  suppliers: Supplier[];
  items: Item[];
  onNewOrder: () => void;
  onReceive: (o: Order) => void | Promise<void>;
}) {
  return (
            <>
              <div className="page-toolbar">
                <div className="search">
                  <Search size={15} />
                  <input
                    placeholder="Rechercher une commande…"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                  />
                </div>
                <button
                  className="btn"
                  onClick={onNewOrder}
                  disabled={!suppliers.length || !items.length}
                >
                  <Plus size={14} /> Nouvelle commande
                </button>
              </div>
              <div className="panel">
                <div className="panel-head">
                  <div>
                    <div className="panel-title">Commandes d’approvisionnement</div>
                    <div className="panel-sub">Suivi des livraisons entrantes et reçues</div>
                  </div>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>RÉFÉRENCE</th>
                        <th>FOURNISSEUR</th>
                        <th>ARTICLES</th>
                        <th>MONTANT</th>
                        <th>DATE</th>
                        <th>STATUT</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders
                        .filter((o) =>
                          (o.reference + o.supplier).toLowerCase().includes(query.toLowerCase()),
                        )
                        .map((o) => (
                          <tr key={o.id}>
                            <td>
                              <strong>{o.reference}</strong>
                            </td>
                            <td>{o.supplier}</td>
                            <td>{o.items} références</td>
                            <td>
                              <b>{money(o.amount)}</b>
                            </td>
                            <td>{shortDate(o.date)}</td>
                            <td>
                              <span
                                className={'pill ' + (o.status === 'Reçue' ? 'green' : 'yellow')}
                              >
                                {o.status}
                              </span>
                            </td>
                            <td>
                              {o.status === 'En transit' &&
                                (o.lines?.length && o.lines.every((line) => line.item_id) ? (
                                  <button className="link-btn" onClick={() => void onReceive(o)}>
                                    Réceptionner
                                  </button>
                                ) : (
                                  <span title="La commande historique ne référence pas ses articles de stock">
                                    Détail manquant
                                  </span>
                                ))}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
  );
}
