begin;

create table if not exists public.health_regions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.health_departments (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.health_regions(id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now(),
  unique (region_id, name),
  unique (id, region_id)
);

create table if not exists public.health_centers (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.health_departments(id) on delete restrict,
  name text not null,
  created_at timestamptz not null default now(),
  unique (department_id, name),
  unique (id, department_id)
);

alter table public.profiles
  add column if not exists center_id uuid references public.health_centers(id) on delete restrict;
alter table public.suppliers
  add column if not exists center_id uuid references public.health_centers(id) on delete restrict;
alter table public.inventory_items
  add column if not exists center_id uuid references public.health_centers(id) on delete restrict;
alter table public.stock_movements
  add column if not exists center_id uuid references public.health_centers(id) on delete restrict;
alter table public.purchase_orders
  add column if not exists center_id uuid references public.health_centers(id) on delete restrict;
alter table public.purchase_order_items
  add column if not exists center_id uuid references public.health_centers(id) on delete restrict;

create index if not exists profiles_center_id_idx on public.profiles(center_id);
create index if not exists suppliers_center_id_idx on public.suppliers(center_id);
create index if not exists inventory_center_id_idx on public.inventory_items(center_id);
create index if not exists movements_center_date_idx on public.stock_movements(center_id, created_at desc);
create index if not exists orders_center_date_idx on public.purchase_orders(center_id, created_at desc);
create index if not exists order_items_center_id_idx on public.purchase_order_items(center_id);
alter table public.purchase_orders drop constraint if exists purchase_orders_reference_key;
create unique index if not exists purchase_orders_center_reference_key
  on public.purchase_orders(center_id, reference)
  where center_id is not null;

create or replace function public.current_user_center_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select center_id
  from public.profiles
  where id = auth.uid()
    and access_status = 'approved'
    and center_id is not null;
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and access_status = 'approved'
    and center_id is not null;
$$;

create or replace function public.has_center_access(p_center_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p_center_id is not null
    and p_center_id = public.current_user_center_id()
    and public.current_user_role() in ('admin', 'pharmacist', 'nurse');
$$;

create or replace function public.enforce_current_center()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_center_id uuid;
begin
  if auth.uid() is null then
    return new;
  end if;

  v_center_id := public.current_user_center_id();
  if v_center_id is null then
    raise exception 'Profil approuvé et rattaché à un centre requis';
  end if;

  if tg_op = 'INSERT' then
    if new.center_id is not null and new.center_id <> v_center_id then
      raise exception 'Impossible de créer une donnée pour un autre centre';
    end if;
    new.center_id := v_center_id;
  else
    if old.center_id is distinct from v_center_id
       or new.center_id is distinct from old.center_id then
      raise exception 'Le rattachement au centre ne peut pas être modifié';
    end if;
  end if;

  if tg_table_name in ('inventory_items', 'purchase_orders') then
    if new.supplier_id is not null
       and not exists (
         select 1 from public.suppliers
         where id = new.supplier_id and center_id = v_center_id
       ) then
      raise exception 'Fournisseur appartenant à un autre centre ou introuvable';
    end if;
  end if;

  return new;
end;
$$;

create trigger suppliers_enforce_current_center
before insert or update on public.suppliers
for each row execute function public.enforce_current_center();
create trigger inventory_enforce_current_center
before insert or update on public.inventory_items
for each row execute function public.enforce_current_center();
create trigger orders_enforce_current_center
before insert or update on public.purchase_orders
for each row execute function public.enforce_current_center();

create or replace function public.enforce_scoped_references()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_center_id uuid;
  v_parent_center_id uuid;
begin
  if auth.uid() is null then
    return new;
  end if;

  v_center_id := public.current_user_center_id();
  if v_center_id is null then
    raise exception 'Profil approuvé et rattaché à un centre requis';
  end if;

  if tg_table_name = 'stock_movements' then
    select center_id into v_parent_center_id
    from public.inventory_items
    where id = new.item_id;
  else
    select center_id into v_parent_center_id
    from public.purchase_orders
    where id = new.order_id;
  end if;

  if v_parent_center_id is null or v_parent_center_id <> v_center_id then
    raise exception 'Référence appartenant à un autre centre ou introuvable';
  end if;

  if tg_table_name = 'purchase_order_items' and new.item_id is not null
     and not exists (
       select 1 from public.inventory_items
       where id = new.item_id and center_id = v_center_id
     ) then
    raise exception 'Article appartenant à un autre centre ou introuvable';
  end if;

  if tg_op = 'INSERT' then
    if new.center_id is not null and new.center_id <> v_center_id then
      raise exception 'Impossible de créer une donnée pour un autre centre';
    end if;
    new.center_id := v_center_id;
  elsif old.center_id is distinct from v_center_id
        or new.center_id is distinct from old.center_id then
    raise exception 'Le rattachement au centre ne peut pas être modifié';
  end if;

  return new;
end;
$$;

create trigger movements_enforce_scoped_references
before insert or update on public.stock_movements
for each row execute function public.enforce_scoped_references();
create trigger order_items_enforce_scoped_references
before insert or update on public.purchase_order_items
for each row execute function public.enforce_scoped_references();

create or replace function public.request_center_access(p_center_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;
  if p_center_id is null or not exists (
    select 1 from public.health_centers where id = p_center_id
  ) then
    raise exception 'Centre de santé introuvable';
  end if;

  select * into v_profile
  from public.profiles
  where id = auth.uid()
  for update;
  if not found or v_profile.access_status <> 'pending' then
    raise exception 'Seul un profil en attente peut demander un rattachement';
  end if;
  if v_profile.center_id is not null and v_profile.center_id <> p_center_id then
    raise exception 'Une demande existe déjà pour un autre centre';
  end if;

  update public.profiles set center_id = p_center_id
  where id = auth.uid();
end;
$$;

create or replace function public.review_center_profile(
  p_user_id uuid,
  p_access_status text,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_center_id uuid;
begin
  v_center_id := public.current_user_center_id();
  if auth.uid() is null or v_center_id is null
     or public.current_user_role() <> 'admin' then
    raise exception 'Action réservée à l’administrateur du centre';
  end if;
  if p_user_id is null or p_user_id = auth.uid()
     or p_access_status is null or p_access_status not in ('approved', 'suspended')
     or p_role is null or p_role not in ('pharmacist', 'nurse') then
    raise exception 'Décision ou rôle invalide';
  end if;

  update public.profiles
  set access_status = p_access_status, role = p_role, updated_at = now()
  where id = p_user_id
    and center_id = v_center_id
    and role <> 'admin';
  if not found then
    raise exception 'Utilisateur introuvable dans ce centre ou administrateur non modifiable';
  end if;
end;
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
set search_path = public, pg_temp
as $$
declare
  v_item public.inventory_items;
  v_movement public.stock_movements;
  v_role text;
  v_center_id uuid;
begin
  v_center_id := public.current_user_center_id();
  v_role := public.current_user_role();
  if auth.uid() is null or v_center_id is null or v_role is null then
    raise exception 'Profil approuvé et rattaché à un centre requis';
  end if;
  if v_role not in ('admin', 'pharmacist', 'nurse') then
    raise exception 'Rôle non autorisé';
  end if;
  if v_role = 'nurse'
     and (p_type <> 'out' or p_reason not in ('patient_dispense', 'department_transfer')) then
    raise exception 'Action non autorisée pour le rôle infirmier';
  end if;
  if p_type is null or p_type not in ('in', 'out')
     or p_quantity is null or p_quantity <= 0
     or p_reason is null
     or p_reason not in ('delivery', 'patient_dispense', 'expired_disposal', 'department_transfer') then
    raise exception 'Mouvement invalide';
  end if;

  select * into v_item
  from public.inventory_items
  where id = p_item_id and center_id = v_center_id
  for update;
  if not found then
    raise exception 'Article introuvable dans ce centre';
  end if;
  if p_type = 'out' and v_item.quantity < p_quantity then
    raise exception 'Stock insuffisant';
  end if;

  update public.inventory_items
  set quantity = quantity + case when p_type = 'in' then p_quantity else -p_quantity end
  where id = v_item.id;
  insert into public.stock_movements(center_id, item_id, user_id, type, quantity, reason)
  values(v_center_id, v_item.id, auth.uid(), p_type, p_quantity, p_reason)
  returning * into v_movement;

  return v_movement;
end;
$$;

create or replace function public.create_purchase_order(
  p_reference text,
  p_supplier_id uuid,
  p_expected_date date,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_center_id uuid;
  v_role text;
  v_order_id uuid;
  v_line jsonb;
  v_item_id uuid;
  v_item_name text;
  v_quantity integer;
  v_unit_price numeric(12,2);
  v_total numeric(12,2) := 0;
begin
  v_center_id := public.current_user_center_id();
  v_role := public.current_user_role();
  if auth.uid() is null or v_center_id is null
     or v_role not in ('admin', 'pharmacist') then
    raise exception 'Action réservée à un utilisateur approuvé de la pharmacie';
  end if;
  if nullif(btrim(p_reference), '') is null then
    raise exception 'Référence de commande obligatoire';
  end if;
  if p_supplier_id is null or not exists (
    select 1 from public.suppliers where id = p_supplier_id and center_id = v_center_id
  ) then
    raise exception 'Fournisseur introuvable dans ce centre';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 then
    raise exception 'La commande doit contenir au moins une ligne';
  end if;

  for v_line in select value from jsonb_array_elements(p_items)
  loop
    if jsonb_typeof(v_line) <> 'object'
       or nullif(v_line->>'item_id', '') is null
       or nullif(v_line->>'quantity', '') is null
       or nullif(v_line->>'unit_price', '') is null then
      raise exception 'Ligne de commande incomplète';
    end if;
    v_item_id := (v_line->>'item_id')::uuid;
    v_quantity := (v_line->>'quantity')::integer;
    v_unit_price := (v_line->>'unit_price')::numeric(12,2);
    if v_quantity <= 0 or v_unit_price < 0 or v_unit_price = 'NaN'::numeric then
      raise exception 'Quantité ou prix invalide';
    end if;
    select name into v_item_name from public.inventory_items
    where id = v_item_id and center_id = v_center_id;
    if not found then
      raise exception 'Article introuvable dans ce centre';
    end if;
    v_total := v_total + v_quantity * v_unit_price;
  end loop;

  insert into public.purchase_orders(
    center_id, reference, supplier_id, status, total_amount, expected_date
  )
  values(v_center_id, btrim(p_reference), p_supplier_id, 'in_transit', v_total, p_expected_date)
  returning id into v_order_id;

  for v_line in select value from jsonb_array_elements(p_items)
  loop
    v_item_id := (v_line->>'item_id')::uuid;
    v_quantity := (v_line->>'quantity')::integer;
    v_unit_price := (v_line->>'unit_price')::numeric(12,2);
    select name into v_item_name from public.inventory_items
    where id = v_item_id and center_id = v_center_id;
    insert into public.purchase_order_items(
      center_id, order_id, item_id, description, quantity, unit_price
    )
    values(v_center_id, v_order_id, v_item_id, v_item_name, v_quantity, v_unit_price);
  end loop;

  return v_order_id;
end;
$$;

create or replace function public.receive_purchase_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_center_id uuid;
  v_role text;
  v_order public.purchase_orders;
  v_line record;
  v_item public.inventory_items;
  v_movement public.stock_movements;
  v_received jsonb := '[]'::jsonb;
begin
  v_center_id := public.current_user_center_id();
  v_role := public.current_user_role();
  if auth.uid() is null or v_center_id is null
     or v_role not in ('admin', 'pharmacist') then
    raise exception 'Action réservée à un utilisateur approuvé de la pharmacie';
  end if;

  select * into v_order
  from public.purchase_orders
  where id = p_order_id and center_id = v_center_id
  for update;
  if not found then
    raise exception 'Commande introuvable dans ce centre';
  end if;
  if v_order.status <> 'in_transit' then
    raise exception 'Seule une commande en transit peut être réceptionnée';
  end if;
  if not exists (
    select 1 from public.purchase_order_items
    where order_id = p_order_id and center_id = v_center_id
  ) or exists (
    select 1 from public.purchase_order_items
    where order_id = p_order_id and center_id = v_center_id and item_id is null
  ) then
    raise exception 'La commande est vide ou contient une ligne sans article';
  end if;

  for v_line in
    select * from public.purchase_order_items
    where order_id = p_order_id and center_id = v_center_id
    order by item_id, id
  loop
    select * into v_item
    from public.inventory_items
    where id = v_line.item_id and center_id = v_center_id
    for update;
    if not found then
      raise exception 'Article de commande introuvable dans ce centre';
    end if;

    update public.inventory_items
    set quantity = quantity + v_line.quantity
    where id = v_item.id
    returning * into v_item;
    insert into public.stock_movements(
      center_id, item_id, user_id, type, quantity, reason
    )
    values(v_center_id, v_item.id, auth.uid(), 'in', v_line.quantity, 'delivery')
    returning * into v_movement;

    v_received := v_received || jsonb_build_array(jsonb_build_object(
      'item_id', v_item.id,
      'quantity', v_item.quantity,
      'movement', to_jsonb(v_movement)
    ));
  end loop;

  update public.purchase_orders
  set status = 'received'
  where id = p_order_id and center_id = v_center_id
  returning * into v_order;

  return jsonb_build_object(
    'order_id', v_order.id,
    'status', v_order.status,
    'received_items', v_received
  );
end;
$$;

do $$
declare
  v_policy record;
  v_unexpected_policies text;
  v_legacy_policies text[] := array[
    'profiles self and admins read', 'admin manages profiles',
    'authenticated read suppliers', 'pharmacy manages suppliers',
    'authenticated read inventory', 'pharmacy manages inventory',
    'authenticated read movements',
    'authenticated read orders', 'pharmacy manages orders',
    'authenticated read order items', 'pharmacy manages order items'
  ];
begin
  select string_agg(format('%s.%s', tablename, policyname), ', ')
  into v_unexpected_policies
  from pg_policies
  where schemaname = 'public'
    and tablename = any(array[
      'profiles', 'suppliers', 'inventory_items', 'stock_movements',
      'purchase_orders', 'purchase_order_items',
      'health_regions', 'health_departments', 'health_centers'
    ])
    and policyname <> all(v_legacy_policies);
  if v_unexpected_policies is not null then
    raise exception 'Politiques RLS non reconnues : %. Examinez-les avant la migration.', v_unexpected_policies;
  end if;

  for v_policy in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any(array[
        'profiles', 'suppliers', 'inventory_items', 'stock_movements',
        'purchase_orders', 'purchase_order_items',
        'health_regions', 'health_departments', 'health_centers'
      ])
      and policyname = any(v_legacy_policies)
  loop
    execute format('drop policy %I on public.%I', v_policy.policyname, v_policy.tablename);
  end loop;
end;
$$;

alter table public.health_regions enable row level security;
alter table public.health_departments enable row level security;
alter table public.health_centers enable row level security;
alter table public.profiles enable row level security;
alter table public.suppliers enable row level security;
alter table public.inventory_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;

create policy "public reads health regions"
  on public.health_regions for select to anon, authenticated using (true);
create policy "public reads health departments"
  on public.health_departments for select to anon, authenticated using (true);
create policy "public reads health centers"
  on public.health_centers for select to anon, authenticated using (true);
create policy "profiles self and center admin read"
  on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or (public.current_user_role() = 'admin'
        and center_id = public.current_user_center_id())
  );
create policy "center members read suppliers"
  on public.suppliers for select to authenticated
  using (public.has_center_access(center_id));
create policy "pharmacy manages center suppliers"
  on public.suppliers for all to authenticated
  using (center_id = public.current_user_center_id()
         and public.current_user_role() in ('admin', 'pharmacist'))
  with check (center_id = public.current_user_center_id()
              and public.current_user_role() in ('admin', 'pharmacist'));
create policy "center members read inventory"
  on public.inventory_items for select to authenticated
  using (public.has_center_access(center_id));
create policy "pharmacy manages center inventory"
  on public.inventory_items for all to authenticated
  using (center_id = public.current_user_center_id()
         and public.current_user_role() in ('admin', 'pharmacist'))
  with check (center_id = public.current_user_center_id()
              and public.current_user_role() in ('admin', 'pharmacist'));
create policy "center members read movements"
  on public.stock_movements for select to authenticated
  using (public.has_center_access(center_id));
create policy "center members read orders"
  on public.purchase_orders for select to authenticated
  using (public.has_center_access(center_id));
create policy "center members read order items"
  on public.purchase_order_items for select to authenticated
  using (public.has_center_access(center_id));

revoke all on public.health_regions, public.health_departments, public.health_centers from anon, authenticated;
grant select on public.health_regions, public.health_departments, public.health_centers to anon, authenticated;
revoke insert, update, delete on public.health_regions, public.health_departments, public.health_centers from anon, authenticated;

revoke all on public.profiles from authenticated;
grant select on public.profiles to authenticated;
revoke all on public.suppliers, public.inventory_items, public.stock_movements,
  public.purchase_orders, public.purchase_order_items from anon, authenticated;
grant select, insert, update, delete on public.suppliers, public.inventory_items to authenticated;
revoke insert, update, delete on public.stock_movements from authenticated;
grant select on public.stock_movements to authenticated;
revoke insert, update, delete on public.purchase_orders, public.purchase_order_items from authenticated;
grant select on public.purchase_orders, public.purchase_order_items to authenticated;

revoke all on function public.current_user_center_id() from public, anon;
revoke all on function public.current_user_role() from public, anon;
revoke all on function public.has_center_access(uuid) from public, anon;
revoke all on function public.enforce_current_center() from public, anon, authenticated;
revoke all on function public.enforce_scoped_references() from public, anon, authenticated;
revoke all on function public.request_center_access(uuid) from public, anon;
revoke all on function public.review_center_profile(uuid, text, text) from public, anon;
revoke all on function public.record_stock_movement(uuid, text, integer, text) from public, anon;
revoke all on function public.create_purchase_order(text, uuid, date, jsonb) from public, anon;
revoke all on function public.receive_purchase_order(uuid) from public, anon;

grant execute on function public.current_user_center_id() to authenticated;
grant execute on function public.current_user_role() to authenticated;
grant execute on function public.has_center_access(uuid) to authenticated;
grant execute on function public.request_center_access(uuid) to authenticated;
grant execute on function public.review_center_profile(uuid, text, text) to authenticated;
grant execute on function public.record_stock_movement(uuid, text, integer, text) to authenticated;
grant execute on function public.create_purchase_order(text, uuid, date, jsonb) to authenticated;
grant execute on function public.receive_purchase_order(uuid) to authenticated;

commit;
