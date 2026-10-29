import type { FormEvent } from 'react';
import { Modal } from '../modal';
import type { Item, Supplier } from '@/lib/dashboard/types';

export function ItemFormModal({
  editItem,
  suppliers,
  busy,
  onSubmit,
  onClose,
  onRemove,
}: {
  editItem: Item | null;
  suppliers: Supplier[];
  busy: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
  onRemove: (id: string) => void;
}) {
  return (
    <Modal
      title={editItem ? 'Modifier l’article' : 'Ajouter un article'}
      subtitle="Renseignez les informations de suivi de ce produit."
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={onSubmit}>
        <div className="form-grid">
          <div className="field full">
            <label>Nom de l’article *</label>
            <input
              name="name"
              required
              defaultValue={editItem?.name}
              placeholder="Ex. Amoxicilline 500 mg"
            />
          </div>
          <div className="field">
            <label>Catégorie *</label>
            <select name="category" defaultValue={editItem?.category || 'medication'}>
              <option value="medication">Médicaments</option>
              <option value="ppe">EPI</option>
              <option value="surgical">Outils chirurgicaux</option>
              <option value="other">Autres</option>
            </select>
          </div>
          <div className="field">
            <label>Numéro de lot / série *</label>
            <input
              name="sku_batch"
              required
              defaultValue={editItem?.sku_batch}
              placeholder="LOT-2408-B12"
            />
          </div>
          <div className="field">
            <label>Quantité en stock *</label>
            <input
              name="quantity"
              type="number"
              min="0"
              required
              defaultValue={editItem?.quantity ?? 0}
            />
          </div>
          <div className="field">
            <label>Seuil de réapprovisionnement</label>
            <input
              name="min_threshold"
              type="number"
              min="0"
              defaultValue={editItem?.min_threshold ?? 10}
            />
          </div>
          <div className="field">
            <label>Prix unitaire (FCFA)</label>
            <input name="price" type="number" min="0" defaultValue={editItem?.price ?? 0} />
          </div>
          <div className="field">
            <label>Date d’expiration</label>
            <input
              name="expiration_date"
              type="date"
              defaultValue={editItem?.expiration_date || ''}
            />
          </div>
          <div className="field full">
            <label>Fournisseur</label>
            <select name="supplier_id" defaultValue={editItem?.supplier_id || ''}>
              <option value="">Sans fournisseur</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ padding: '0 23px 15px', display: 'flex', justifyContent: 'space-between' }}>
          {editItem && (
            <button
              type="button"
              className="link-btn"
              style={{ color: '#d47062' }}
              disabled={busy}
              onClick={() => onRemove(editItem.id)}
            >
              Archiver l’article
            </button>
          )}
          <span style={{ marginLeft: 'auto' }} />
        </div>
        <div className="modal-actions">
          <button className="btn secondary" type="button" disabled={busy} onClick={onClose}>
            Annuler
          </button>
          <button className="btn" type="submit" disabled={busy}>
            {editItem ? 'Enregistrer' : 'Ajouter à l’inventaire'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
