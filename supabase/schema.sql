-- MediStock · schéma Supabase (PostgreSQL)
-- Schéma de base uniquement : appliquer toutes les migrations, y compris
-- 20261028130000_center_scoped_access.sql, avant de connecter l'application.
-- Ce fichier seul ne fournit pas encore l'isolation multi-centres.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'nurse' check (role in ('admin','pharmacist','nurse')),
  access_status text not null default 'pending' check (access_status in ('pending','approved','suspended')),
  updated_at timestamptz not null default now()
);
alter table public.profiles add column if not exists access_status text not null default 'pending';
do $$ begin
  if not exists (select 1 from pg_constraint where conname='profiles_access_status_check' and conrelid='public.profiles'::regclass) then
    alter table public.profiles add constraint profiles_access_status_check check (access_status in ('pending','approved','suspended'));
  end if;
end $$;
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(), name text not null,
  contact_name text not null default '', email text not null default '', phone text not null default '',
  created_at timestamptz not null default now()
);
create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(), name text not null,
  category text not null check(category in ('medication','ppe','surgical','other')),
  sku_batch text not null, expiration_date date, supplier_id uuid references public.suppliers(id) on delete set null,
  quantity integer not null default 0 check(quantity >= 0), min_threshold integer not null default 10 check(min_threshold >= 0),
  price numeric(12,2) not null default 0 check(price >= 0), created_at timestamptz not null default now()
);
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(), item_id uuid not null references public.inventory_items(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  type text not null check(type in ('in','out')), quantity integer not null check(quantity > 0),
  reason text not null check(reason in ('delivery','patient_dispense','expired_disposal','department_transfer')),
  created_at timestamptz not null default now()
);
create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(), reference text not null unique,
  supplier_id uuid references public.suppliers(id) on delete set null,
  status text not null default 'pending' check(status in ('pending','in_transit','received','cancelled')),
  total_amount numeric(12,2) not null default 0, expected_date date, created_at timestamptz not null default now()
);
create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.purchase_orders(id) on delete cascade,
  item_id uuid references public.inventory_items(id) on delete set null, description text not null,
  quantity integer not null check(quantity > 0), unit_price numeric(12,2) not null default 0
);
create index if not exists inventory_expiration_idx on public.inventory_items(expiration_date);
create index if not exists inventory_category_idx on public.inventory_items(category);
create index if not exists movements_item_date_idx on public.stock_movements(item_id, created_at desc);
create index if not exists orders_status_idx on public.purchase_orders(status);

-- Nouveau profil à l'inscription. L'accès reste en attente jusqu'à une approbation explicite.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,full_name,role,access_status)
  values(new.id,coalesce(nullif(new.raw_user_meta_data->>'full_name',''),nullif(new.raw_user_meta_data->>'name',''),nullif(new.raw_user_meta_data->>'display_name',''),split_part(coalesce(new.email,''),'@',1)), 'nurse', 'pending');
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.current_user_role() returns text language sql stable security definer set search_path=public as $$
 select role from public.profiles where id=auth.uid() and access_status='approved'; $$;

-- Transaction atomique : contrôle du stock, mise à jour de quantité et journalisation.
create or replace function public.record_stock_movement(p_item_id uuid,p_type text,p_quantity integer,p_reason text)
returns public.stock_movements language plpgsql security definer set search_path=public as $$
declare v_item public.inventory_items; v_movement public.stock_movements; v_role text;
begin
 if auth.uid() is null then raise exception 'Authentification requise'; end if;
 v_role := public.current_user_role();
 if v_role is null or v_role not in ('admin','pharmacist','nurse') then raise exception 'Profil non approuvé ou rôle non autorisé'; end if;
 if v_role='nurse' and (p_type<>'out' or p_reason not in ('patient_dispense','department_transfer')) then raise exception 'Action non autorisée pour le rôle infirmier'; end if;
 if p_type not in ('in','out') or p_quantity <= 0 then raise exception 'Mouvement invalide'; end if;
 select * into v_item from public.inventory_items where id=p_item_id for update;
 if not found then raise exception 'Article introuvable'; end if;
 if p_type='out' and v_item.quantity < p_quantity then raise exception 'Stock insuffisant'; end if;
 update public.inventory_items set quantity=quantity + case when p_type='in' then p_quantity else -p_quantity end where id=p_item_id;
 insert into public.stock_movements(item_id,user_id,type,quantity,reason) values(p_item_id,auth.uid(),p_type,p_quantity,p_reason) returning * into v_movement;
 return v_movement;
end; $$;
revoke all on function public.record_stock_movement(uuid,text,integer,text) from public;
grant execute on function public.record_stock_movement(uuid,text,integer,text) to authenticated;

create or replace function public.create_purchase_order(
  p_reference text,
  p_supplier_id uuid,
  p_expected_date date,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_order_id uuid;
  v_line jsonb;
  v_item_id uuid;
  v_item_name text;
  v_quantity integer;
  v_unit_price numeric(12,2);
  v_total numeric(12,2) := 0;
begin
  v_role := public.current_user_role();
  if auth.uid() is null or v_role is null or v_role not in ('admin', 'pharmacist') then
    raise exception 'Rôle non autorisé';
  end if;
  if nullif(btrim(p_reference), '') is null then
    raise exception 'Référence de commande obligatoire';
  end if;
  if p_supplier_id is null or not exists (select 1 from public.suppliers where id = p_supplier_id) then
    raise exception 'Fournisseur introuvable';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'La commande doit contenir au moins une ligne';
  end if;

  for v_line in select value from jsonb_array_elements(p_items)
  loop
    if nullif(v_line->>'item_id', '') is null
       or nullif(v_line->>'quantity', '') is null
       or nullif(v_line->>'unit_price', '') is null then
      raise exception 'Ligne de commande incomplète';
    end if;
    v_item_id := (v_line->>'item_id')::uuid;
    v_quantity := (v_line->>'quantity')::integer;
    v_unit_price := (v_line->>'unit_price')::numeric(12,2);
    if v_quantity <= 0 or v_unit_price < 0 then
      raise exception 'Quantité ou prix invalide';
    end if;
    select name into v_item_name from public.inventory_items where id = v_item_id;
    if not found then
      raise exception 'Article introuvable';
    end if;
    v_total := v_total + v_quantity * v_unit_price;
  end loop;

  insert into public.purchase_orders(reference, supplier_id, status, total_amount, expected_date)
  values(btrim(p_reference), p_supplier_id, 'in_transit', v_total, p_expected_date)
  returning id into v_order_id;

  for v_line in select value from jsonb_array_elements(p_items)
  loop
    v_item_id := (v_line->>'item_id')::uuid;
    v_quantity := (v_line->>'quantity')::integer;
    v_unit_price := (v_line->>'unit_price')::numeric(12,2);
    select name into v_item_name from public.inventory_items where id = v_item_id;
    insert into public.purchase_order_items(order_id, item_id, description, quantity, unit_price)
    values(v_order_id, v_item_id, v_item_name, v_quantity, v_unit_price);
  end loop;

  return v_order_id;
end;
$$;
revoke all on function public.create_purchase_order(text,uuid,date,jsonb) from public;
grant execute on function public.create_purchase_order(text,uuid,date,jsonb) to authenticated;

create or replace function public.receive_purchase_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_order public.purchase_orders;
  v_line record;
  v_item public.inventory_items;
  v_movement public.stock_movements;
  v_received jsonb := '[]'::jsonb;
begin
  v_role := public.current_user_role();
  if auth.uid() is null or v_role is null or v_role not in ('admin', 'pharmacist') then
    raise exception 'Rôle non autorisé';
  end if;

  select * into v_order
  from public.purchase_orders
  where id = p_order_id
  for update;
  if not found then
    raise exception 'Commande introuvable';
  end if;
  if v_order.status <> 'in_transit' then
    raise exception 'Seule une commande en transit peut être réceptionnée';
  end if;
  if not exists (select 1 from public.purchase_order_items where order_id = p_order_id) then
    raise exception 'La commande ne contient aucune ligne détaillée';
  end if;
  if exists (select 1 from public.purchase_order_items where order_id = p_order_id and item_id is null) then
    raise exception 'Une ligne de commande ne référence aucun article de stock';
  end if;

  for v_line in
    select * from public.purchase_order_items
    where order_id = p_order_id
    order by item_id, id
  loop
    select * into v_item
    from public.inventory_items
    where id = v_line.item_id
    for update;
    if not found then
      raise exception 'Article de commande introuvable';
    end if;

    update public.inventory_items
    set quantity = quantity + v_line.quantity
    where id = v_item.id
    returning * into v_item;

    insert into public.stock_movements(item_id, user_id, type, quantity, reason)
    values(v_item.id, auth.uid(), 'in', v_line.quantity, 'delivery')
    returning * into v_movement;

    v_received := v_received || jsonb_build_array(jsonb_build_object(
      'item_id', v_item.id,
      'quantity', v_item.quantity,
      'movement', to_jsonb(v_movement)
    ));
  end loop;

  update public.purchase_orders
  set status = 'received'
  where id = p_order_id
  returning * into v_order;

  return jsonb_build_object(
    'order_id', v_order.id,
    'status', v_order.status,
    'received_items', v_received
  );
end;
$$;
revoke all on function public.receive_purchase_order(uuid) from public;
grant execute on function public.receive_purchase_order(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.suppliers enable row level security;
alter table public.inventory_items enable row level security;
alter table public.stock_movements enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;

drop policy if exists "profiles self and admins read" on public.profiles;
create policy "profiles self and admins read" on public.profiles for select to authenticated using(id=auth.uid() or public.current_user_role()='admin');
drop policy if exists "admin manages profiles" on public.profiles;
revoke insert, update, delete on public.profiles from authenticated;
grant select on public.profiles to authenticated;
drop policy if exists "authenticated read suppliers" on public.suppliers;
create policy "authenticated read suppliers" on public.suppliers for select to authenticated using(public.current_user_role() in ('admin','pharmacist','nurse'));
drop policy if exists "pharmacy manages suppliers" on public.suppliers;
create policy "pharmacy manages suppliers" on public.suppliers for all to authenticated using(public.current_user_role() in ('admin','pharmacist')) with check(public.current_user_role() in ('admin','pharmacist'));
drop policy if exists "authenticated read inventory" on public.inventory_items;
create policy "authenticated read inventory" on public.inventory_items for select to authenticated using(public.current_user_role() in ('admin','pharmacist','nurse'));
drop policy if exists "pharmacy manages inventory" on public.inventory_items;
create policy "pharmacy manages inventory" on public.inventory_items for all to authenticated using(public.current_user_role() in ('admin','pharmacist')) with check(public.current_user_role() in ('admin','pharmacist'));
drop policy if exists "authenticated read movements" on public.stock_movements;
create policy "authenticated read movements" on public.stock_movements for select to authenticated using(public.current_user_role() in ('admin','pharmacist','nurse'));
-- Les créations passent par record_stock_movement afin de garantir l'atomicité.
drop policy if exists "authenticated read orders" on public.purchase_orders;
create policy "authenticated read orders" on public.purchase_orders for select to authenticated using(public.current_user_role() in ('admin','pharmacist','nurse'));
drop policy if exists "pharmacy manages orders" on public.purchase_orders;
create policy "pharmacy manages orders" on public.purchase_orders for all to authenticated using(public.current_user_role() in ('admin','pharmacist')) with check(public.current_user_role() in ('admin','pharmacist'));
drop policy if exists "authenticated read order items" on public.purchase_order_items;
create policy "authenticated read order items" on public.purchase_order_items for select to authenticated using(public.current_user_role() in ('admin','pharmacist','nurse'));
drop policy if exists "pharmacy manages order items" on public.purchase_order_items;
create policy "pharmacy manages order items" on public.purchase_order_items for all to authenticated using(public.current_user_role() in ('admin','pharmacist')) with check(public.current_user_role() in ('admin','pharmacist'));

grant usage on schema public to authenticated;
grant select,insert,update,delete on public.suppliers,public.inventory_items,public.stock_movements,public.purchase_orders,public.purchase_order_items to authenticated;
revoke insert,update,delete on public.purchase_orders,public.purchase_order_items from authenticated;
grant select on public.purchase_orders,public.purchase_order_items to authenticated;
