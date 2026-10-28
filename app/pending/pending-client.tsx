'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, LogOut, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { formatError } from '@/lib/errors';

type Region = { id: string; name: string };
type Department = { id: string; region_id: string; name: string };
type Center = { id: string; department_id: string; name: string };

export default function PendingAccessPage() {
  const router = useRouter();
  const [message, setMessage] = useState('Vérification de votre demande d’accès…');
  const [busy, setBusy] = useState(false);
  const [accessStatus, setAccessStatus] = useState('');
  const [requestedCenterId, setRequestedCenterId] = useState('');
  const [regions, setRegions] = useState<Region[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [regionId, setRegionId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [centerId, setCenterId] = useState('');

  const visibleDepartments = useMemo(
    () => departments.filter(department => department.region_id === regionId),
    [departments, regionId],
  );
  const visibleCenters = useMemo(
    () => centers.filter(center => center.department_id === departmentId),
    [centers, departmentId],
  );
  const requestedCenter = centers.find(center => center.id === requestedCenterId);
  const requestedDepartment = departments.find(department => department.id === requestedCenter?.department_id);
  const requestedRegion = regions.find(region => region.id === requestedDepartment?.region_id);

  useEffect(() => {
    let active = true;
    const checkAccess = async () => {
      if (!supabase) {
        setMessage('La connexion Supabase n’est pas configurée.');
        return;
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        router.replace('/login');
        return;
      }

      const [{ data: profile, error: profileError }, { data: regionRows, error: regionsError },
        { data: departmentRows, error: departmentsError }, { data: centerRows, error: centersError }] =
        await Promise.all([
          supabase.from('profiles').select('access_status, center_id').eq('id', user.id).maybeSingle(),
          supabase.from('health_regions').select('id,name').order('name'),
          supabase.from('health_departments').select('id,region_id,name').order('name'),
          supabase.from('health_centers').select('id,department_id,name').order('name'),
        ]);

      if (!active) return;
      const directoryError = regionsError || departmentsError || centersError;
      if (profileError || !profile) {
        setMessage(`Impossible de vérifier votre statut${profileError ? ` : ${formatError(profileError)}` : '.'}`);
        return;
      }
      if (directoryError) {
        setMessage(`Impossible de charger la hiérarchie des centres : ${formatError(directoryError)}`);
        return;
      }
      setRegions(regionRows || []);
      setDepartments(departmentRows || []);
      setCenters(centerRows || []);
      setAccessStatus(profile.access_status);
      setRequestedCenterId(profile.center_id || '');

      if (profile.access_status === 'approved' && profile.center_id) {
        router.replace('/dashboard');
      } else if (profile.access_status === 'suspended') {
        setMessage('Votre accès est suspendu. Contactez l’administrateur de votre centre.');
      } else if (profile.center_id) {
        setMessage('Votre demande de rattachement est en attente d’approbation par l’administrateur du centre.');
      } else {
        setMessage('Sélectionnez votre direction régionale, votre direction départementale, puis votre centre de santé.');
      }
    };

    void checkAccess();
    return () => { active = false; };
  }, [router]);

  const requestAccess = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !centerId) return;
    setBusy(true);
    const { error } = await supabase.rpc('request_center_access', { p_center_id: centerId });
    if (error) {
      setMessage(`Envoi de la demande impossible : ${formatError(error)}`);
      setBusy(false);
      return;
    }
    setRequestedCenterId(centerId);
    setAccessStatus('pending');
    setMessage('Votre demande est enregistrée. L’administrateur du centre doit l’approuver avant tout accès aux données.');
    setBusy(false);
  };

  const signOut = async () => {
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setMessage(`Déconnexion impossible : ${formatError(error)}`);
      setBusy(false);
      return;
    }
    router.replace('/login');
  };

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <Link className="auth-brand" href="/">
          <span className="auth-brand-icon"><Activity size={20} strokeWidth={2.5} /></span>
          <span>MediStock<small>GESTION DES CENTRES DE SANTÉ</small></span>
        </Link>
        <div className="auth-intro">
          <div className="auth-kicker">VÉRIFICATION D’ACCÈS</div>
          <h1>Accès non disponible</h1>
          <p role="status">{message}</p>
        </div>
        {accessStatus === 'pending' && !requestedCenterId && regions.length > 0 && (
          <form onSubmit={requestAccess}>
            <div className="field">
              <label htmlFor="health-region">Direction régionale *</label>
              <select id="health-region" required value={regionId} onChange={event => {
                setRegionId(event.target.value);
                setDepartmentId('');
                setCenterId('');
              }}>
                <option value="">Sélectionner une région</option>
                {regions.map(region => <option key={region.id} value={region.id}>{region.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="health-department">Direction départementale *</label>
              <select id="health-department" required value={departmentId} disabled={!regionId} onChange={event => {
                setDepartmentId(event.target.value);
                setCenterId('');
              }}>
                <option value="">Sélectionner un département</option>
                {visibleDepartments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label htmlFor="health-center">Centre de santé *</label>
              <select id="health-center" required value={centerId} disabled={!departmentId} onChange={event => setCenterId(event.target.value)}>
                <option value="">Sélectionner un centre</option>
                {visibleCenters.map(center => <option key={center.id} value={center.id}>{center.name}</option>)}
              </select>
            </div>
            <button className="auth-submit" type="submit" disabled={busy || !centerId}>
              {busy ? 'Envoi…' : 'Demander l’accès à ce centre'}
            </button>
          </form>
        )}
        {requestedCenterId && requestedCenter && (
          <p className="auth-secure">
            Demande pour : {requestedRegion?.name || 'Région'} → {requestedDepartment?.name || 'Département'} → {requestedCenter.name}
          </p>
        )}
        {accessStatus === 'pending' && !requestedCenterId && regions.length === 0 && (
          <p className="auth-secure">Aucun centre n’est encore configuré. Contactez l’opérateur de MediStock.</p>
        )}
        <button className="auth-submit" type="button" onClick={signOut} disabled={busy || !supabase}>
          <LogOut size={16} /> {busy ? 'Traitement…' : 'Se déconnecter'}
        </button>
        <div className="auth-secure"><ShieldCheck size={14} /> Un compte n’accède qu’aux données de son centre</div>
      </div>
      <div className="auth-copyright">© 2026 MediStock</div>
    </main>
  );
}
