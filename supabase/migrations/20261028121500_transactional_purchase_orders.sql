-- Depends on 20261028120000_gate_unapproved_users.sql.
-- Purchase-order creation and receipt must be all-or-nothing transactions.
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
revoke insert, update, delete on public.purchase_orders, public.purchase_order_items from authenticated;
grant select on public.purchase_orders, public.purchase_order_items to authenticated;

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
