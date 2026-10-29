import type { FormEvent } from 'react';
import { X } from 'lucide-react';

export function SupplierFormModal({
  busy,
  onSubmit,
  onClose,
}: {
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
                <h2>Nouveau fournisseur</h2>
                <p>Ajoutez un partenaire à votre répertoire.</p>
              </div>
              <button type="button" className="close" disabled={busy} onClick={onClose}>
                <X size={16} />
              </button>
            </div>
            <div className="form-grid">
              <div className="field full">
                <label>Nom de l’entreprise *</label>
                <input name="name" required placeholder="Ex. Pharmacie Centrale" />
              </div>
              <div className="field">
                <label>Nom du contact</label>
                <input name="contact_name" placeholder="Nom et prénom" />
              </div>
              <div className="field">
                <label>Téléphone</label>
                <input name="phone" placeholder="+225 07…" />
              </div>
              <div className="field full">
                <label>Adresse e-mail</label>
                <input name="email" type="email" placeholder="contact@fournisseur.ci" />
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
                Ajouter le fournisseur
              </button>
            </div>
          </form>
        </div>
  );
}
