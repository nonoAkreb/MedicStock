import type { FormEvent } from 'react';
import { ArrowLeftRight, X } from 'lucide-react';
import type { Item } from '@/lib/dashboard/types';

export function MovementFormModal({
  items,
  role,
  moveItemId,
  moveType,
  moveReason,
  busy,
  onSubmit,
  onClose,
}: {
  items: Item[];
  role: string;
  moveItemId: string;
  moveType: 'in' | 'out';
  moveReason: string;
  busy: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  return (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}
        >
          <form className="modal" onSubmit={onSubmit}>
            <div className="modal-head">
              <div>
                <h2>Nouveau mouvement</h2>
                <p>Le niveau d’inventaire sera actualisé automatiquement.</p>
              </div>
              <button type="button" className="close" disabled={busy} onClick={onClose}>
                <X size={16} />
              </button>
            </div>
            <div className="form-grid">
              <div className="field full">
                <label>Article *</label>
                <select name="item_id" required defaultValue={moveItemId || items[0]?.id || ''}>
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} — disponible : {i.quantity}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Type de mouvement *</label>
                <select name="type" defaultValue={role === 'nurse' ? 'out' : moveType}>
                  {role === 'nurse' ? (
                    <option value="out">Sortie de stock</option>
                  ) : (
                    <>
                      <option value="in">Entrée de stock</option>
                      <option value="out">Sortie de stock</option>
                    </>
                  )}
                </select>
              </div>
              <div className="field">
                <label>Quantité *</label>
                <input name="quantity" type="number" min="1" required defaultValue="1" />
              </div>
              <div className="field full">
                <label>Motif *</label>
                <select
                  name="reason"
                  defaultValue={
                    role === 'nurse'
                      ? moveReason === 'department_transfer'
                        ? 'department_transfer'
                        : 'patient_dispense'
                      : moveReason
                  }
                >
                  {role === 'nurse' ? (
                    <>
                      <option value="patient_dispense">Dispensation patient</option>
                      <option value="department_transfer">Transfert vers un service</option>
                    </>
                  ) : (
                    <>
                      <option value="delivery">Livraison / don</option>
                      <option value="patient_dispense">Dispensation patient</option>
                      <option value="department_transfer">Demande / transfert de service</option>
                      <option value="expired_disposal">Destruction (péremption)</option>
                    </>
                  )}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button
                className="btn secondary"
                type="button"
                disabled={busy}
                onClick={onClose}
              >
                Annuler
              </button>
              <button className="btn" type="submit" disabled={busy}>
                <ArrowLeftRight size={14} /> Enregistrer le mouvement
              </button>
            </div>
          </form>
        </div>
  );
}
