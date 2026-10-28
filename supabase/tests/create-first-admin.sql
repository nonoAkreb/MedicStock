-- PREMIER ADMINISTRATEUR — canal opérateur
-- Aucune clé dans ce fichier : l'utilisateur est créé via le Dashboard
-- Supabase (Authentication → Add user → Create new user, auto-confirm),
-- puis ce script promeut son profil. À exécuter dans le SQL Editor
-- (rôle postgres, hors dépôt — ne pas commiter les valeurs réelles).

-- ─── Étape 0 : variables à renseigner ────────────────────────
--   :admin_email  = e-mail du compte créé dans le Dashboard
--   :center_name  = nom exact du centre (dans health_centers)

-- ─── Étape 1 : vérifier que le compte existe et est pending ──
select u.id, u.email, p.access_status, p.role, p.center_id
from auth.users u
join public.profiles p on p.id = u.id
where u.email = '<ADMIN_EMAIL>';
-- Attendu : 1 ligne, access_status='pending' (trigger handle_new_user).
-- Si 0 ligne : l'utilisateur n'existe pas encore ou le trigger est absent
-- (voir RUNBOOK §1a).

-- ─── Étape 2 : promouvoir (idempotent) ───────────────────────
begin;

update public.profiles
set access_status = 'approved',
    role = 'admin',
    center_id = (select id from public.health_centers where name = '<CENTER_NAME>' limit 1),
    updated_at = now()
where id = (select id from auth.users where email = '<ADMIN_EMAIL>')
  and (select count(*) from public.profiles where role = 'admin' and access_status = 'approved') < 4;
-- Le filtre « < 4 » évite une promotion massive accidentelle ; ajuster au besoin.

-- Garde-fou : rien n'est commité si le centre est introuvable
do $$
begin
  if not exists (select 1 from public.health_centers where name = '<CENTER_NAME>') then
    raise exception 'Centre introuvable : <CENTER_NAME>';
  end if;
end $$;

commit;

-- ─── Étape 3 : vérification ──────────────────────────────────
select p.id, p.role, p.access_status, p.center_id, c.name as centre
from public.profiles p
left join public.health_centers c on c.id = p.center_id
where p.id = (select id from auth.users where email = '<ADMIN_EMAIL>');
-- Attendu : role='admin', access_status='approved', centre = <CENTER_NAME>
-- Puis connexion à l'app : le tableau de bord doit s'ouvrir.

-- Alternative 100% SQL (si Dashboard indisponible) : créer le user via
-- auth admin API depuis un script opérateur avec la service_role tenue
-- dans le secret-store de l'opérateur — jamais dans ce dépôt.
