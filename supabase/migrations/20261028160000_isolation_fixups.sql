-- Lot 5 — correctifs d'isolation relevés à la relecture des migrations.
-- 1. create_purchase_order ignorait les articles archivés (lot 4) : une commande
--    pouvait référencer un article archivé.
-- 2. La politique « for all » de inventory_items autorisait encore le DELETE
--    physique via l'API pour admin/pharmacist — contournement de l'archivage
--    logique. Le grant delete est retiré (la FK restrict ne suffit pas : un
--    article sans mouvement pouvait encore être effacé).
--
-- ROLLBACK manuel :
--   grant delete on public.inventory_items to authenticated;
--   puis rejouer create_purchase_order de la migration
--   20261028130000_center_scoped_access.sql.

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
    where id = v_item_id and center_id = v_center_id and archived_at is null;
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
    where id = v_item_id and center_id = v_center_id and archived_at is null;
    insert into public.purchase_order_items(
      center_id, order_id, item_id, description, quantity, unit_price
    )
    values(v_center_id, v_order_id, v_item_id, v_item_name, v_quantity, v_unit_price);
  end loop;

  return v_order_id;
end;
$$;

revoke all on function public.create_purchase_order(text, uuid, date, jsonb) from public, anon;
grant execute on function public.create_purchase_order(text, uuid, date, jsonb) to authenticated;

revoke delete on public.inventory_items from authenticated;
