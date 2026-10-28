'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export type PurchaseOrderDraft = {
  reference: string;
  supplier_id: string;
  expected_date: string;
  items: Array<{ item_id: string; quantity: number; unit_price: number }>;
};

type Props = {
  initialReference: string;
  suppliers: Array<{ id: string; name: string }>;
  items: Array<{ id: string; name: string; price: number }>;
  onSubmit: (draft: PurchaseOrderDraft) => void;
  onCancel: () => void;
  busy?: boolean;
};

type DraftLine = { item_id: string; quantity: string; unit_price: string };

export function PurchaseOrderForm({ initialReference, suppliers, items, onSubmit, onCancel, busy }: Props) {
  const [reference, setReference] = useState(initialReference);
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [expectedDate, setExpectedDate] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([{ item_id: '', quantity: '1', unit_price: '0' }]);

  const amount = lines.reduce(
    (total, line) => total + (Number(line.quantity) || 0) * (Number(line.unit_price) || 0),
    0,
  );

  const updateLine = (index: number, patch: Partial<DraftLine>) => {
    setLines(current => current.map((line, lineIndex) => (
      lineIndex === index ? { ...line, ...patch } : line
    )));
  };

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({
      reference: reference.trim(),
      supplier_id: supplierId,
      expected_date: expectedDate,
      items: lines.map(line => ({
        item_id: line.item_id,
        quantity: Number(line.quantity),
        unit_price: Number(line.unit_price),
      })),
    });
  };

  return (
    <form className="modal" onSubmit={submit}>
      <div className="modal-head">
        <div>
          <h2>Nouvelle commande</h2>
          <p>Associez chaque ligne à un article réel de l’inventaire.</p>
        </div>
        <button type="button" className="close" disabled={busy} onClick={onCancel}>×</button>
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="order-reference">Référence *</label>
          <input id="order-reference" required value={reference} onChange={event => setReference(event.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="order-supplier">Fournisseur *</label>
          <select id="order-supplier" required value={supplierId} onChange={event => setSupplierId(event.target.value)}>
            <option value="" disabled>Sélectionner un fournisseur</option>
            {suppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
          </select>
        </div>
        <div className="field full">
          <label htmlFor="order-expected-date">Date de livraison prévue</label>
          <input id="order-expected-date" type="date" value={expectedDate} onChange={event => setExpectedDate(event.target.value)} />
        </div>
      </div>
      <div className="form-grid">
        <div className="field full">
          <label>Lignes commandées *</label>
          {lines.map((line, index) => (
            <div className="form-grid" key={index}>
              <div className="field">
                <label htmlFor={`order-item-${index}`}>Article</label>
                <select
                  id={`order-item-${index}`}
                  required
                  value={line.item_id}
                  onChange={event => {
                    const item = items.find(candidate => candidate.id === event.target.value);
                    updateLine(index, {
                      item_id: event.target.value,
                      unit_price: item ? String(item.price) : '0',
                    });
                  }}
                >
                  <option value="" disabled>Sélectionner un article</option>
                  {items.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor={`order-quantity-${index}`}>Quantité</label>
                <input id={`order-quantity-${index}`} type="number" min="1" step="1" required value={line.quantity} onChange={event => updateLine(index, { quantity: event.target.value })} />
              </div>
              <div className="field">
                <label htmlFor={`order-price-${index}`}>Prix unitaire (FCFA)</label>
                <input id={`order-price-${index}`} type="number" min="0" step="1" required value={line.unit_price} onChange={event => updateLine(index, { unit_price: event.target.value })} />
              </div>
              <button
                type="button"
                className="btn secondary"
                aria-label="Supprimer cette ligne"
                disabled={lines.length === 1}
                onClick={() => setLines(current => current.filter((_, lineIndex) => lineIndex !== index))}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button type="button" className="btn secondary" onClick={() => setLines(current => [...current, { item_id: '', quantity: '1', unit_price: '0' }])}>
            <Plus size={14} /> Ajouter une ligne
          </button>
        </div>
      </div>
      <div className="panel-sub">Montant total calculé : {new Intl.NumberFormat('fr-FR').format(amount)} FCFA</div>
      <div className="modal-actions">
        <button className="btn secondary" type="button" disabled={busy} onClick={onCancel}>Annuler</button>
        <button className="btn" type="submit" disabled={busy || !suppliers.length || !items.length}>Créer la commande</button>
      </div>
    </form>
  );
}
