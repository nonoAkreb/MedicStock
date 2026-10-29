import type { FormEvent } from 'react';
import { Modal } from '../modal';

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
    <Modal
      title="Nouveau fournisseur"
      subtitle="Ajoutez un partenaire à votre répertoire."
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={onSubmit}>
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
          <button className="btn secondary" type="button" disabled={busy} onClick={onClose}>
            Annuler
          </button>
          <button className="btn" type="submit" disabled={busy}>
            Ajouter le fournisseur
          </button>
        </div>
      </form>
    </Modal>
  );
}
