import type { FormEvent } from 'react';
import type { Center } from '@/lib/dashboard/types';

export function SettingsPage({
  isLive,
  center,
  busy,
  onSave,
}: {
  isLive: boolean;
  center: Center | null;
  busy: boolean;
  onSave: (e: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="panel" style={{ padding: 22 }}>
      <div className="panel-title">Préférences du centre</div>
      <p className="panel-sub" style={{ marginBottom: 22 }}>
        Configuration de votre espace MediStock
      </p>
      <form className="form-grid" style={{ padding: 0, maxWidth: 700 }} onSubmit={onSave}>
        <div className="field">
          <label>Nom du centre</label>
          <input name="name" required defaultValue={center?.name || ''} />
        </div>
        <div className="field">
          <label>Ville</label>
          <input
            name="city"
            defaultValue={center?.city || center?.department_name || ''}
          />
        </div>
        <div className="field">
          <label>Devise</label>
          <select name="currency" defaultValue={center?.currency || 'XOF'}>
            <option value="XOF">XOF — Franc CFA</option>
          </select>
        </div>
        <div className="field">
          <label>Alertes d’expiration</label>
          <select name="alert_days_before" defaultValue={String(center?.alert_days_before || 90)}>
            <option value="30">30 jours</option>
            <option value="60">60 jours</option>
            <option value="90">90 jours</option>
          </select>
        </div>
        <div className="field full">
          <button className="btn" type="submit" disabled={busy}>
            Enregistrer les modifications
          </button>
        </div>
      </form>
      <div
        style={{
          borderTop: '1px solid #edf1ef',
          marginTop: 25,
          paddingTop: 18,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <b style={{ fontSize: 12 }}>Connexion Supabase</b>
          <div className="panel-sub">
            {isLive
              ? 'Base de données connectée'
              : 'Mode démonstration · vos données restent dans ce navigateur'}
          </div>
        </div>
        <span className={'pill ' + (isLive ? 'green' : 'yellow')}>
          {isLive ? 'Connecté' : 'Démo'}
        </span>
      </div>
    </div>
  );
}
