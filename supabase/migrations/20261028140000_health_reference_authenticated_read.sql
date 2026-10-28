-- Le référentiel santé (régions, départements, centres) n'est plus lisible
-- par les anonymes : uniquement par les utilisateurs authentifiés (y compris
-- les profils « pending », qui en ont besoin sur /pending pour demander
-- leur rattachement à un centre).

drop policy if exists "public reads health regions" on public.health_regions;
drop policy if exists "public reads health departments" on public.health_departments;
drop policy if exists "public reads health centers" on public.health_centers;

create policy "authenticated reads health regions"
  on public.health_regions for select to authenticated using (true);
create policy "authenticated reads health departments"
  on public.health_departments for select to authenticated using (true);
create policy "authenticated reads health centers"
  on public.health_centers for select to authenticated using (true);

revoke select on public.health_regions, public.health_departments, public.health_centers
  from anon;
