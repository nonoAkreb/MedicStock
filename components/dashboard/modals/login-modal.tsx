import type { FormEvent } from 'react';
import { Modal } from '../modal';

export function LoginModal({
  isLive,
  email,
  authError,
  busy,
  onSubmit,
  onClose,
}: {
  isLive: boolean;
  email: string;
  authError: string;
  busy: boolean;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      title="Connexion sécurisée"
      subtitle={
        isLive
          ? 'Connectez-vous avec votre compte clinique.'
          : 'Mode démonstration — choisissez un rôle pour explorer.'
      }
      busy={busy}
      onClose={onClose}
    >
      <form onSubmit={onSubmit}>
        <div className="form-grid">
          <div className="field full">
            <label>Adresse e-mail</label>
            <input
              type="email"
              name="email"
              required
              defaultValue={email || 'a.kone@cliniquedulagon.ci'}
              placeholder="vous@clinique.ci"
            />
          </div>
          {isLive ? (
            <div className="field full">
              <label>Mot de passe</label>
              <input name="password" type="password" required placeholder="••••••••" />
            </div>
          ) : (
            <div className="field full">
              <label>Rôle de démonstration</label>
              <select name="role" defaultValue="pharmacist">
                <option value="admin">Administrateur</option>
                <option value="pharmacist">Pharmacien</option>
                <option value="nurse">Infirmier</option>
              </select>
            </div>
          )}
          {authError && (
            <div className="field full" style={{ color: '#d47062' }} role="alert">
              {authError}
            </div>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn secondary" type="button" disabled={busy} onClick={onClose}>
            Annuler
          </button>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Connexion…' : 'Se connecter'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
