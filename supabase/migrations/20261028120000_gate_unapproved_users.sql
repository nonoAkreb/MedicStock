-- Fail closed until center-scoped approval is available with the organization hierarchy.
alter table public.profiles
  add column if not exists access_status text not null default 'pending';

alter table public.profiles
  alter column access_status set default 'pending';

do $$ begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_access_status_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_access_status_check
      check (access_status in ('pending', 'approved', 'suspended'));
  end if;
end $$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and access_status = 'approved';
$$;

create or replace function public.record_stock_movement(
  p_item_id uuid,
  p_type text,
  p_quantity integer,
  p_reason text
)
returns public.stock_movements
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item public.inventory_items;
  v_movement public.stock_movements;
  v_role text;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;

  v_role := public.current_user_role();
  if v_role is null or v_role not in ('admin', 'pharmacist', 'nurse') then
    raise exception 'Profil non approuvé ou rôle non autorisé';
  end if;

  if v_role = 'nurse'
     and (p_type <> 'out' or p_reason not in ('patient_dispense', 'department_transfer')) then
    raise exception 'Action non autorisée pour le rôle infirmier';
  end if;

  if p_type not in ('in', 'out') or p_quantity is null or p_quantity <= 0 then
    raise exception 'Mouvement invalide';
  end if;

  select * into v_item
  from public.inventory_items
  where id = p_item_id
  for update;

  if not found then
    raise exception 'Article introuvable';
  end if;

  if p_type = 'out' and v_item.quantity < p_quantity then
    raise exception 'Stock insuffisant';
  end if;

  update public.inventory_items
  set quantity = quantity + case when p_type = 'in' then p_quantity else -p_quantity end
  where id = p_item_id;

  insert into public.stock_movements(item_id, user_id, type, quantity, reason)
  values(p_item_id, auth.uid(), p_type, p_quantity, p_reason)
  returning * into v_movement;

  return v_movement;
end;
$$;

drop policy if exists "profiles self and admins read" on public.profiles;
create policy "profiles self and admins read"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.current_user_role() = 'admin');

drop policy if exists "admin manages profiles" on public.profiles;
revoke insert, update, delete on public.profiles from authenticated;
grant select on public.profiles to authenticated;

drop policy if exists "authenticated read suppliers" on public.suppliers;
create policy "authenticated read suppliers"
  on public.suppliers for select to authenticated
  using (public.current_user_role() in ('admin', 'pharmacist', 'nurse'));

drop policy if exists "authenticated read inventory" on public.inventory_items;
create policy "authenticated read inventory"
  on public.inventory_items for select to authenticated
  using (public.current_user_role() in ('admin', 'pharmacist', 'nurse'));

drop policy if exists "authenticated read movements" on public.stock_movements;
create policy "authenticated read movements"
  on public.stock_movements for select to authenticated
  using (public.current_user_role() in ('admin', 'pharmacist', 'nurse'));

drop policy if exists "authenticated read orders" on public.purchase_orders;
create policy "authenticated read orders"
  on public.purchase_orders for select to authenticated
  using (public.current_user_role() in ('admin', 'pharmacist', 'nurse'));

drop policy if exists "authenticated read order items" on public.purchase_order_items;
create policy "authenticated read order items"
  on public.purchase_order_items for select to authenticated
  using (public.current_user_role() in ('admin', 'pharmacist', 'nurse'));
