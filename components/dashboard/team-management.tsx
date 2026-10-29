'use client';

import { ROLES, roleLabel, type Role } from '@/lib/dashboard/roles';
import { useCallback, useEffect, useState } from 'react';
import { Check, RefreshCw, ShieldCheck, UserRound } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { formatError } from '@/lib/errors';

type CenterProfile = {
  id: string;
  full_name: string;
  role: Role;
  access_status: 'pending' | 'approved' | 'suspended';
};



export function TeamManagement() {
  const [profiles, setProfiles] = useState<CenterProfile[]>([]);
  const [roles, setRoles] = useState<Record<string, Role>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadProfiles = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase
      .from('profiles')
      .select('id,full_name,role,access_status')
      .order('full_name');
    if (queryError) {
      setError(`Chargement des utilisateurs impossible : ${formatError(queryError)}`);
      setProfiles([]);
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void loadProfiles(), 0);
    return () => clearTimeout(t);
  }, [loadProfiles]);

  const review = async (profile: CenterProfile, accessStatus: 'approved' | 'suspended') => {
    if (!supabase) return;
    setBusyId(profile.id);
    setError('');
    setNotice('');
    try {
      const { error: reviewError } = await supabase.rpc('review_center_profile', {
        p_user_id: profile.id,
        p_access_status: accessStatus,
        p_role: roles[profile.id] || (profile.role === ROLES.pharmacist ? ROLES.pharmacist : ROLES.nurse),
      });
      if (reviewError) {
        setError(`Mise à jour de l’accès impossible : ${formatError(reviewError)}`);
      } else {
        setNotice(
          accessStatus === 'approved' ? 'Accès au centre approuvé.' : 'Accès au centre suspendu.',
        );
        await loadProfiles();
      }
    } finally {
      setBusyId('');
    }
  };

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <div className="panel-title">Membres du centre</div>
          <div className="panel-sub">
            Les droits sont limités au centre de santé de l’administrateur connecté.
          </div>
        </div>
        <button
          className="btn secondary"
          type="button"
          onClick={() => void loadProfiles()}
          disabled={loading}
        >
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>
      {error && (
        <p role="alert" className="panel-sub">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="panel-sub">
          {notice}
        </p>
      )}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>MEMBRE</th>
              <th>RÔLE</th>
              <th>ACCÈS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4}>Chargement des membres…</td>
              </tr>
            ) : profiles.length === 0 ? (
              <tr>
                <td colSpan={4}>Aucun membre rattaché à ce centre.</td>
              </tr>
            ) : (
              profiles.map((profile) => (
                <tr key={profile.id}>
                  <td>
                    <div className="item-name">
                      <div className="avatar" style={{ width: 30, height: 30, fontSize: 10 }}>
                        <UserRound size={14} />
                      </div>
                      <strong>{profile.full_name || 'Utilisateur sans nom'}</strong>
                    </div>
                  </td>
                  <td>
                    {profile.role === ROLES.admin ? (
                      roleLabel.admin
                    ) : (
                      <select
                        aria-label={`Rôle de ${profile.full_name || 'l’utilisateur'}`}
                        value={roles[profile.id] || profile.role}
                        onChange={(event) => {
                          const selectedRole = event.target.value;
                          if (selectedRole === ROLES.pharmacist || selectedRole === ROLES.nurse) {
                            setRoles((current) => ({ ...current, [profile.id]: selectedRole }));
                          }
                        }}
                      >
                        <option value="pharmacist">Pharmacien</option>
                        <option value="nurse">Infirmier</option>
                      </select>
                    )}
                  </td>
                  <td>
                    <span
                      className={`pill ${profile.access_status === 'approved' ? 'green' : profile.access_status === 'suspended' ? 'red' : 'yellow'}`}
                    >
                      {profile.access_status === 'approved'
                        ? 'Actif'
                        : profile.access_status === 'suspended'
                          ? 'Suspendu'
                          : 'En attente'}
                    </span>
                  </td>
                  <td>
                    {profile.role !== ROLES.admin &&
                      (profile.access_status === 'approved' ? (
                        <button
                          className="link-btn"
                          type="button"
                          disabled={busyId === profile.id}
                          onClick={() => void review(profile, 'suspended')}
                        >
                          Suspendre
                        </button>
                      ) : (
                        <button
                          className="link-btn"
                          type="button"
                          disabled={busyId === profile.id}
                          onClick={() => void review(profile, 'approved')}
                        >
                          <Check size={14} /> Approuver
                        </button>
                      ))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="panel-sub">
        <ShieldCheck size={14} /> L’attribution d’un rôle administrateur est réservée à l’opérateur
        de la base.
      </div>
    </section>
  );
}
