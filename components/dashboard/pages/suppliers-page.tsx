import { ArrowRight, Plus, Search } from 'lucide-react';
import type { Item, Supplier } from '@/lib/dashboard/types';

export function SuppliersPage({
  query,
  onQueryChange,
  suppliers,
  items,
  onNewSupplier,
  onNotify,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  suppliers: Supplier[];
  items: Item[];
  onNewSupplier: () => void;
  onNotify: (s: string) => void;
}) {
  return (
            <>
              <div className="page-toolbar">
                <div className="search">
                  <Search size={15} />
                  <input
                    placeholder="Rechercher un fournisseur…"
                    value={query}
                    onChange={(e) => onQueryChange(e.target.value)}
                  />
                </div>
                <button className="btn" onClick={onNewSupplier}>
                  <Plus size={14} /> Ajouter un fournisseur
                </button>
              </div>
              <div className="panel">
                <div className="panel-head">
                  <div>
                    <div className="panel-title">Répertoire fournisseurs</div>
                    <div className="panel-sub">{suppliers.length} partenaires référencés</div>
                  </div>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>FOURNISSEUR</th>
                        <th>CONTACT</th>
                        <th>EMAIL</th>
                        <th>TÉLÉPHONE</th>
                        <th>ARTICLES</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {suppliers
                        .filter((s) =>
                          (s.name + s.contact_name + s.email)
                            .toLowerCase()
                            .includes(query.toLowerCase()),
                        )
                        .map((s) => (
                          <tr key={s.id}>
                            <td>
                              <div className="item-name">
                                <div className="supplier-avatar">
                                  {s.name
                                    .split(' ')
                                    .slice(0, 2)
                                    .map((x) => x[0])
                                    .join('')
                                    .toUpperCase()}
                                </div>
                                <strong>{s.name}</strong>
                              </div>
                            </td>
                            <td>{s.contact_name}</td>
                            <td>{s.email}</td>
                            <td>{s.phone}</td>
                            <td>
                              <span className="pill green">
                                {items.filter((i) => i.supplier_id === s.id).length} articles
                              </span>
                            </td>
                            <td>
                              <button
                                className="icon-btn"
                                style={{ width: 29, height: 29 }}
                                onClick={() => {
                                  navigator.clipboard?.writeText(s.email);
                                  onNotify('Adresse e-mail copiée');
                                }}
                              >
                                <ArrowRight size={14} />
                              </button>
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
