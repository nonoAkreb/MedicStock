-- Lot 7 / PR B : paramètres du centre dynamiques.
-- Ajoute ville, devise et délai d'alerte d'expiration à health_centers
-- et une RPC admin-only pour les modifier sur SON propre centre.
-- Rollback : drop function public.update_my_center(text, text, text, integer);
--            alter table public.health_centers drop column city, drop column currency, drop column alert_days_before;

alter table public.health_centers
  add column if not exists city text,
  add column if not exists currency text not null default 'XOF',
  add column if not exists alert_days_before integer not null default 90;

create or replace function public.update_my_center(
  p_name text,
  p_city text,
  p_currency text,
  p_alert_days_before integer
)
returns public.health_centers
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_center public.health_centers;
begin
  if public.current_user_role() <> 'admin' then
    raise exception 'Action réservée à l’administrateur du centre';
  end if;
  if p_name is null or btrim(p_name) = '' then
    raise exception 'Le nom du centre est requis';
  end if;
  if p_alert_days_before is null or p_alert_days_before < 1 or p_alert_days_before > 365 then
    raise exception 'Délai d’alerte invalide';
  end if;
  update public.health_centers
     set name = btrim(p_name),
         city = nullif(btrim(p_city), ''),
         currency = coalesce(nullif(btrim(p_currency), ''), currency),
         alert_days_before = p_alert_days_before
   where id = public.current_user_center_id()
  returning * into v_center;
  if not found then
    raise exception 'Centre de santé introuvable';
  end if;
  return v_center;
end;
$$;

revoke all on function public.update_my_center(text, text, text, integer) from public, anon;
grant execute on function public.update_my_center(text, text, text, integer) to authenticated;
