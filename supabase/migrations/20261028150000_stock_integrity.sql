-- Lot 4 : intégrité des données de stock
-- 1. Archivage logique des articles (archived_at) + FK mouvements en restrict.
-- 2. Snapshot de prix unitaire sur chaque mouvement.
-- 3. Statuts de commande réduits à in_transit / received.
--
-- ROLLBACK manuel :
--   alter table public.purchase_orders drop constraint purchase_orders_status_check;
--   alter table public.purchase_orders add constraint purchase_orders_status_check
--     check (status in ('pending','in_transit','received','cancelled'));
--   alter table public.purchase_orders alter column status set default 'pending';
--   alter table public.stock_movements drop column unit_price;
--   alter table public.stock_movements drop constraint stock_movements_item_id_fkey;
--   alter table public.stock_movements add constraint stock_movements_item_id_fkey
--     foreign key (item_id) references public.inventory_items(id) on delete cascade;
--   alter table public.inventory_items drop column archived_at;
--   puis rejouer record_stock_movement / receive_purchase_order de la migration
--   20261028130000_center_scoped_access.sql.

-- ─────────────────────────────────────────────────────────────
-- 1. Archivage logique
-- ─────────────────────────────────────────────────────────────

alter table public.inventory_items
  add column if not exists archived_at timestamptz;

create index if not exists inventory_items_active_idx
  on public.inventory_items(center_id)
  where archived_at is null;

-- Un delete physique d'article ne doit plus effacer l'historique :
-- la FK passe en restrict (le delete échouera tant que des mouvements existent,
-- l'application utilise désormais archived_at).
alter table public.stock_movements
  drop constraint if exists stock_movements_item_id_fkey;
alter table public.stock_movements
  add constraint stock_movements_item_id_fkey
  foreign key (item_id) references public.inventory_items(id) on delete restrict;

-- ─────────────────────────────────────────────────────────────
-- 2. Snapshot de prix sur les mouvements
-- ─────────────────────────────────────────────────────────────

alter table public.stock_movements
  add column if not exists unit_price numeric(12,2) check (unit_price >= 0);

-- Backfill : approximation documentée — le prix courant de l'article est copié
-- sur les mouvements passés (le prix au moment réel du mouvement est inconnu).
update public.stock_movements m
set unit_price = i.price
from public.inventory_items i
where m.item_id = i.id and m.unit_price is null;

-- record_stock_movement : ignore les articles archivés et fige le prix courant.
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
  where id = p_item_id and center_id = v_center_id and archived_at is null
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
  insert into public.stock_movements(center_id, item_id, user_id, type, quantity, reason, unit_price)
  values(v_center_id, v_item.id, auth.uid(), p_type, p_quantity, p_reason, v_item.price)
  returning * into v_movement;

  return v_movement;
end;
$$;

-- receive_purchase_order : le snapshot de prix est le prix d'achat de la ligne
-- de commande (coût réel), pas le prix catalogue de l'article.
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
    -- Un article archivé peut encore être réceptionné : la marchandise existe
    -- physiquement ; la ligne de mouvement garde la trace et le stock est mis
    -- à jour sans réactiver l'article.
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
      center_id, item_id, user_id, type, quantity, reason, unit_price
    )
    values(v_center_id, v_item.id, auth.uid(), 'in', v_line.quantity, 'delivery', v_line.unit_price)
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

revoke all on function public.record_stock_movement(uuid, text, integer, text) from public, anon;
grant execute on function public.record_stock_movement(uuid, text, integer, text) to authenticated;
revoke all on function public.receive_purchase_order(uuid) from public, anon;
grant execute on function public.receive_purchase_order(uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 3. Statuts de commande : in_transit / received uniquement
-- ─────────────────────────────────────────────────────────────

-- Garde-fou : refuse la migration si des lignes existantes portent un statut
-- que le nouveau CHECK ne couvre plus.
do $$
declare
  v_bad bigint;
begin
  select count(*) into v_bad
  from public.purchase_orders
  where status not in ('in_transit', 'received');
  if v_bad > 0 then
    raise exception 'purchase_orders contient % ligne(s) avec un statut autre que in_transit/received. Corrigez-les avant d’appliquer cette migration.', v_bad;
  end if;
end $$;

alter table public.purchase_orders
  drop constraint if exists purchase_orders_status_check;
alter table public.purchase_orders
  add constraint purchase_orders_status_check
  check (status in ('in_transit', 'received'));
alter table public.purchase_orders
  alter column status set default 'in_transit';
