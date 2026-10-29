export function SettingsPage({
  isLive,
  onNotify,
}: {
  isLive: boolean;
  onNotify: (s: string) => void;
}) {
  return (
            <div className="panel" style={{ padding: 22 }}>
              <div className="panel-title">Préférences du centre</div>
              <p className="panel-sub" style={{ marginBottom: 22 }}>
                Configuration de votre espace MediStock
              </p>
              <div className="form-grid" style={{ padding: 0, maxWidth: 700 }}>
                <div className="field">
                  <label>Nom du centre</label>
                  <input defaultValue="Clinique du Lagon" />
                </div>
                <div className="field">
                  <label>Ville</label>
                  <input defaultValue="Abidjan, Côte d’Ivoire" />
                </div>
                <div className="field">
                  <label>Devise</label>
                  <select defaultValue="XOF">
                    <option>XOF — Franc CFA</option>
                  </select>
                </div>
                <div className="field">
                  <label>Alertes d’expiration</label>
                  <select defaultValue="90">
                    <option value="30">30 jours</option>
                    <option value="60">60 jours</option>
                    <option value="90">90 jours</option>
                  </select>
                </div>
              </div>
              <button
                className="btn"
                style={{ marginTop: 22 }}
                onClick={() => onNotify('Préférences enregistrées')}
              >
                Enregistrer les modifications
              </button>
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
