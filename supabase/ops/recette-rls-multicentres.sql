-- RECETTE RLS MULTI-CENTRES — lot 5
-- Jeu de test : 2 régions, 2 départements, 2 centres (un par département),
-- 2 utilisateurs par centre (admin + pharmacien) + 1 utilisateur pending.
-- Les tests utilisateur sont simulés en transaction avec
--   set role authenticated + request.jwt.claims — auth.uid() lit le sub.
-- À exécuter bloc par bloc dans le SQL Editor APRÈS les 6 migrations.

-- ═══ 0. FIXTURES (rôle superuser / postgres) ═══════════════════
-- Créer d'abord les 5 utilisateurs via Dashboard → Authentication
-- → Add user (auto-confirm), puis reporter leurs UUID ci-dessous.
--   :u_admin_a  :u_pharm_a   (centre A)
--   :u_admin_b  :u_pharm_b   (centre B)
--   :u_pending              (sans centre)

insert into public.health_regions(name) values ('Région Test Nord'), ('Région Test Sud');
insert into public.health_departments(region_id, name)
values ((select id from public.health_regions where name='Région Test Nord'), 'Dept Test A'),
       ((select id from public.health_regions where name='Région Test Sud'), 'Dept Test B');
insert into public.health_centers(department_id, name)
values ((select id from public.health_departments where name='Dept Test A'), 'Centre Test A'),
       ((select id from public.health_departments where name='Dept Test B'), 'Centre Test B');

-- Rattacher les profils (admin A/B approuvés, pharm A/B approuvés, pending sans centre)
update public.profiles set access_status='approved', role='admin',
  center_id=(select id from public.health_centers where name='Centre Test A')
where id='<U_ADMIN_A>';
update public.profiles set access_status='approved', role='pharmacist',
  center_id=(select id from public.health_centers where name='Centre Test A')
where id='<U_PHARM_A>';
update public.profiles set access_status='approved', role='admin',
  center_id=(select id from public.health_centers where name='Centre Test B')
where id='<U_ADMIN_B>';
update public.profiles set access_status='approved', role='pharmacist',
  center_id=(select id from public.health_centers where name='Centre Test B')
where id='<U_PHARM_B>';
-- <U_PENDING> reste pending / center_id null.

-- Données dans chaque centre (rôle postgres → trigger ignoré, center explicite)
insert into public.suppliers(name, center_id)
select 'Fourn A', id from public.health_centers where name='Centre Test A';
insert into public.suppliers(name, center_id)
select 'Fourn B', id from public.health_centers where name='Centre Test B';
insert into public.inventory_items(name, category, sku_batch, quantity, price, center_id)
select 'Article A', 'medication', 'LOT-A', 50, 100,
  id from public.health_centers where name='Centre Test A';
insert into public.inventory_items(name, category, sku_batch, quantity, price, center_id)
select 'Article B', 'medication', 'LOT-B', 50, 200,
  id from public.health_centers where name='Centre Test B';
insert into public.purchase_orders(reference, status, center_id)
select 'CMD-A-001', 'in_transit', id from public.health_centers where name='Centre Test A';
-- Ligne orpheline volontaire (test d)
insert into public.inventory_items(name, category, sku_batch, quantity, price)
values ('Article ORPHELIN', 'other', 'LOT-NULL', 10, 50);

-- ═══ (a) Isolation croisée — lecture/écriture/suppression ═════
-- Comme utilisateur PHARM_A :
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"<U_PHARM_A>","role":"authenticated"}';

select count(*) as items_visibles from public.inventory_items;
-- Attendu : 1 (Article A seulement ; B et l'orphelin invisibles)
select count(*) as suppliers_visibles from public.suppliers;  -- 1 (Fourn A)
select count(*) as orders_visibles from public.purchase_orders; -- 1 (CMD-A-001)
select count(*) as movements_visibles from public.stock_movements; -- mouvements centre A seulement

-- Lecture ciblée d'un autre centre → 0 ligne (pas d'erreur, filtré)
select count(*) from public.inventory_items i
join public.health_centers c on c.id = i.center_id
where c.name = 'Centre Test B';
-- Attendu : 0

-- Écriture dans un autre centre → erreur trigger
insert into public.inventory_items(name, category, sku_batch, quantity, price, center_id)
values ('Intrusion', 'other', 'X', 1, 1,
  (select id from public.health_centers where name='Centre Test B'));
-- Attendu : ERROR 'Impossible de créer une donnée pour un autre centre'

-- Update / delete d'une ligne d'un autre centre → 0 ligne affectée (RLS)
update public.inventory_items set quantity = 999
where id = (select id from public.inventory_items where sku_batch='LOT-B');
-- Attendu : 0 rows affected, aucune erreur
delete from public.inventory_items
where id = (select id from public.inventory_items where sku_batch='LOT-B');
-- Attendu : 0 rows affected (ou ERROR permission denied — delete révoqué lot 5)
rollback;

-- ═══ (b) RPC avec références d'un autre centre ════════════════
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"<U_PHARM_A>","role":"authenticated"}';

select public.record_stock_movement(
  (select id from public.inventory_items where sku_batch='LOT-B'), 'out', 1, 'patient_dispense');
-- Attendu : ERROR 'Article introuvable dans ce centre'

select public.create_purchase_order('CMD-X',
  (select id from public.suppliers where name='Fourn B'), null,
  '[{"item_id":"<ID_ARTICLE_A>","quantity":1,"unit_price":10}]'::jsonb);
-- Attendu : ERROR 'Fournisseur introuvable dans ce centre'

select public.create_purchase_order('CMD-X2',
  (select id from public.suppliers where name='Fourn A'), null,
  '[{"item_id":"<ID_ARTICLE_B>","quantity":1,"unit_price":10}]'::jsonb);
-- Attendu : ERROR 'Article introuvable dans ce centre'

select public.receive_purchase_order(
  (select id from public.purchase_orders where reference='CMD-A-001'));
-- Attendu : ERROR si commande B (ici A : réception réelle si ligne valide —
-- utiliser une commande B pour le test croisé : 'Commande introuvable dans ce centre')
rollback;

-- ═══ (c) Règles métier pending / admin ════════════════════════
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"<U_PENDING>","role":"authenticated"}';
-- pending demande le centre A : OK
select public.request_center_access((select id from public.health_centers where name='Centre Test A'));
-- Attendu : succès. IMMÉDIATEMENT après, toujours pending :
select public.request_center_access((select id from public.health_centers where name='Centre Test B'));
-- Attendu : ERROR 'Une demande existe déjà pour un autre centre'
rollback;

begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"<U_ADMIN_A>","role":"authenticated"}';
-- admin A ne peut pas se modifier lui-même
select public.review_center_profile('<U_ADMIN_A>', 'suspended', 'nurse');
-- Attendu : ERROR 'Décision ou rôle invalide'
-- admin A ne peut pas promouvoir un autre admin ni toucher l'admin B
select public.review_center_profile('<U_ADMIN_B>', 'suspended', 'nurse');
-- Attendu : ERROR (utilisateur d'un autre centre / admin non modifiable)
-- admin A approuve le pending qui a demandé son centre : fonctionne seulement
-- si le pending a center_id = centre A (non exécuté ici car rollback ci-dessus)
rollback;

-- ═══ (d) Lignes center_id IS NULL invisibles ══════════════════
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"<U_ADMIN_A>","role":"authenticated"}';
select count(*) from public.inventory_items where sku_batch='LOT-NULL';
-- Attendu : 0 (has_center_access exige center_id non null)
select count(*) from public.suppliers where center_id is null;
-- Attendu : 0
select count(*) from public.purchase_orders where center_id is null;
-- Attendu : 0
select count(*) from public.stock_movements where center_id is null;
-- Attendu : 0
rollback;

-- ═══ Nettoyage ════════════════════════════════════════════════
-- delete from public.purchase_orders where reference like 'CMD-%';
-- delete from public.inventory_items where sku_batch like 'LOT-%';
-- delete from public.suppliers where name like 'Fourn %';
-- delete from public.health_centers where name like 'Centre Test %';
-- delete from public.health_departments where name like 'Dept Test %';
-- delete from public.health_regions where name like 'Région Test %';
