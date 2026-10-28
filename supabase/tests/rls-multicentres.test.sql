-- pgTAP — recette RLS multi-centres automatisée (lot 6)
-- Exécution : supabase test db (pile locale) — voir CI job « database ».
-- Jeu : 2 régions/départements/centres ; centre A = admin+pharmacien+infirmier,
-- centre B = admin+pharmacien, 1 utilisateur pending sans centre.
-- Toute la suite tient en une transaction : fixtures écrites en superuser,
-- puis `set local role authenticated` + request.jwt.claims par utilisateur.

begin;

select plan(33);

-- ═══════════════ FIXTURES (rôle postgres) ═══════════════════
insert into public.health_regions(id,name) values
  ('aa000000-0000-4000-8000-000000000001','Région pgTAP A'),
  ('aa000000-0000-4000-8000-000000000002','Région pgTAP B');
insert into public.health_departments(id,region_id,name) values
  ('bb000000-0000-4000-8000-000000000001','aa000000-0000-4000-8000-000000000001','Dept pgTAP A'),
  ('bb000000-0000-4000-8000-000000000002','aa000000-0000-4000-8000-000000000002','Dept pgTAP B');
insert into public.health_centers(id,department_id,name) values
  ('cc000000-0000-4000-8000-000000000001','bb000000-0000-4000-8000-000000000001','Centre pgTAP A'),
  ('cc000000-0000-4000-8000-000000000002','bb000000-0000-4000-8000-000000000002','Centre pgTAP B');

insert into auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at)
select '00000000-0000-0000-0000-000000000000', id, 'authenticated','authenticated',
       mail, crypt('pw',gen_salt('bf')), now(), now(), now()
from (values
  ('dd000000-0000-4000-8000-000000000001'::uuid,'admin-a@pgtap.test'),
  ('dd000000-0000-4000-8000-000000000002','pharm-a@pgtap.test'),
  ('dd000000-0000-4000-8000-000000000003','nurse-a@pgtap.test'),
  ('dd000000-0000-4000-8000-000000000004','admin-b@pgtap.test'),
  ('dd000000-0000-4000-8000-000000000005','pharm-b@pgtap.test'),
  ('dd000000-0000-4000-8000-000000000006','pending@pgtap.test')
) as u(id,mail);

-- Le trigger handle_new_user crée déjà les profils (pending/nurse) :
-- on ne fait que renseigner rôle, statut et centre.
update public.profiles set full_name='Admin A', role='admin', access_status='approved', center_id='cc000000-0000-4000-8000-000000000001' where id='dd000000-0000-4000-8000-000000000001';
update public.profiles set full_name='Pharm A', role='pharmacist', access_status='approved', center_id='cc000000-0000-4000-8000-000000000001' where id='dd000000-0000-4000-8000-000000000002';
update public.profiles set full_name='Nurse A', role='nurse', access_status='approved', center_id='cc000000-0000-4000-8000-000000000001' where id='dd000000-0000-4000-8000-000000000003';
update public.profiles set full_name='Admin B', role='admin', access_status='approved', center_id='cc000000-0000-4000-8000-000000000002' where id='dd000000-0000-4000-8000-000000000004';
update public.profiles set full_name='Pharm B', role='pharmacist', access_status='approved', center_id='cc000000-0000-4000-8000-000000000002' where id='dd000000-0000-4000-8000-000000000005';
update public.profiles set full_name='Pending', role='nurse', access_status='pending', center_id=null where id='dd000000-0000-4000-8000-000000000006';

insert into public.suppliers(id,name,center_id) values
  ('ee000000-0000-4000-8000-000000000001','Fournisseur A','cc000000-0000-4000-8000-000000000001'),
  ('ee000000-0000-4000-8000-000000000002','Fournisseur B','cc000000-0000-4000-8000-000000000002');
insert into public.inventory_items(id,name,category,sku_batch,quantity,min_threshold,price,center_id) values
  ('ff000000-0000-4000-8000-000000000001','Article A','medication','PGT-A',50,10,100,'cc000000-0000-4000-8000-000000000001'),
  ('ff000000-0000-4000-8000-000000000002','Article B','medication','PGT-B',50,10,200,'cc000000-0000-4000-8000-000000000002'),
  ('ff000000-0000-4000-8000-000000000003','Article archivé A','medication','PGT-ARCH',5,1,10,'cc000000-0000-4000-8000-000000000001'),
  ('ff000000-0000-4000-8000-000000000004','Article orphelin','other','PGT-NULL',10,1,50,null);
update public.inventory_items set archived_at=now() where id='ff000000-0000-4000-8000-000000000003';

insert into public.purchase_orders(id,reference,supplier_id,status,center_id) values
  ('a5000000-0000-4000-8000-000000000001','PGT-CMD-A1','ee000000-0000-4000-8000-000000000001','in_transit','cc000000-0000-4000-8000-000000000001'),
  ('a5000000-0000-4000-8000-000000000002','PGT-CMD-A0','ee000000-0000-4000-8000-000000000001','received','cc000000-0000-4000-8000-000000000001'),
  ('a5000000-0000-4000-8000-000000000003','PGT-CMD-B1','ee000000-0000-4000-8000-000000000002','in_transit','cc000000-0000-4000-8000-000000000002');
insert into public.purchase_order_items(order_id,item_id,description,quantity,unit_price,center_id) values
  ('a5000000-0000-4000-8000-000000000001','ff000000-0000-4000-8000-000000000001','Article A',10,120,'cc000000-0000-4000-8000-000000000001');
insert into public.stock_movements(item_id,type,quantity,reason,unit_price,center_id) values
  ('ff000000-0000-4000-8000-000000000004','in',10,'delivery',50,null);

-- ═══════════ Tout le reste en rôle « authenticated » ════════
set local role authenticated;

-- ── pending sans centre : rien de visible ───────────────────
set local request.jwt.claims = '{"sub":"dd000000-0000-4000-8000-000000000006","role":"authenticated"}';
set local "request.jwt.claim.sub" = 'dd000000-0000-4000-8000-000000000006';
select is(
  (select count(*)::int from public.inventory_items), 0,
  'pending sans centre : inventaire vide'
);
select lives_ok(
  $$select public.request_center_access('cc000000-0000-4000-8000-000000000001')$$,
  'request_center_access nominal (pending → centre A)'
);
select throws_ok(
  $$select public.request_center_access('cc000000-0000-4000-8000-000000000002')$$,
  'Une demande existe déjà pour un autre centre',
  'request_center_access refuse un second centre'
);
select is(
  (select count(*)::int from public.inventory_items), 0,
  'pending rattaché non approuvé : toujours 0 ligne'
);

-- ── pharmacien centre A : isolation croisée (a) ─────────────
set local request.jwt.claims = '{"sub":"dd000000-0000-4000-8000-000000000002","role":"authenticated"}';
set local "request.jwt.claim.sub" = 'dd000000-0000-4000-8000-000000000002';
select is((select count(*)::int from public.inventory_items), 2, 'items visibles = centre A seul (incl. archivé)');
select is((select count(*)::int from public.suppliers), 1, 'fournisseurs visibles = centre A seul');
select is((select count(*)::int from public.purchase_orders), 2, 'commandes visibles = centre A seul');
select is((select count(*)::int from public.stock_movements), 0, 'mouvements visibles = centre A seul (orphelin exclu)');
select is((select count(*)::int from public.inventory_items where center_id='cc000000-0000-4000-8000-000000000002'), 0, 'lecture ciblée centre B : 0 ligne');
select throws_ok(
  $$insert into public.inventory_items(name,category,sku_batch,quantity,price,center_id) values('X','other','X',1,1,'cc000000-0000-4000-8000-000000000002')$$,
  'Impossible de créer une donnée pour un autre centre',
  'insert dans un autre centre : refusé'
);
select is_empty(
  $$update public.inventory_items set quantity=999 where id='ff000000-0000-4000-8000-000000000002' returning 1$$,
  'update article centre B : 0 ligne affectée'
);
select is_empty(
  $$update public.suppliers set name='intrusion' where id='ee000000-0000-4000-8000-000000000002' returning 1$$,
  'update fournisseur centre B : 0 ligne affectée'
);
select throws_ok(
  $$delete from public.inventory_items where id='ff000000-0000-4000-8000-000000000002'$$,
  'permission denied for table inventory_items',
  'delete article (tout centre) : privilège révoqué — archivage logique seul'
);
select is((select count(*)::int from public.inventory_items where sku_batch='PGT-NULL'), 0, 'item center_id NULL invisible');

-- ── RPC bornées au centre (b) ───────────────────────────────
select throws_ok(
  $$select public.record_stock_movement('ff000000-0000-4000-8000-000000000002','out',1,'patient_dispense')$$,
  'Article introuvable dans ce centre',
  'record_stock_movement refuse item_id centre B'
);
select lives_ok(
  $$select public.record_stock_movement('ff000000-0000-4000-8000-000000000001','out',5,'patient_dispense')$$,
  'record_stock_movement nominal (sortie 5)'
);
select is((select quantity from public.inventory_items where id='ff000000-0000-4000-8000-000000000001'), 45, 'stock décrémenté 50 → 45');
select is(
  (select unit_price from public.stock_movements where item_id='ff000000-0000-4000-8000-000000000001' order by created_at desc limit 1),
  100::numeric,
  'unit_price = snapshot du prix article'
);
select throws_ok(
  $$select public.record_stock_movement('ff000000-0000-4000-8000-000000000001','out',999,'patient_dispense')$$,
  'Stock insuffisant',
  'record_stock_movement refuse surstock'
);
select throws_ok(
  $$select public.create_purchase_order('PGT-NEW','ee000000-0000-4000-8000-000000000002',null,'[{"item_id":"ff000000-0000-4000-8000-000000000001","quantity":1,"unit_price":10}]'::jsonb)$$,
  'Fournisseur introuvable dans ce centre',
  'create_purchase_order refuse supplier_id centre B'
);
select throws_ok(
  $$select public.create_purchase_order('PGT-NEW','ee000000-0000-4000-8000-000000000001',null,'[{"item_id":"ff000000-0000-4000-8000-000000000002","quantity":1,"unit_price":10}]'::jsonb)$$,
  'Article introuvable dans ce centre',
  'create_purchase_order refuse item_id centre B'
);
select throws_ok(
  $$select public.create_purchase_order('PGT-NEW','ee000000-0000-4000-8000-000000000001',null,'[{"item_id":"ff000000-0000-4000-8000-000000000003","quantity":1,"unit_price":10}]'::jsonb)$$,
  'Article introuvable dans ce centre',
  'create_purchase_order refuse article archivé'
);
select lives_ok(
  $$select public.create_purchase_order('PGT-NEW','ee000000-0000-4000-8000-000000000001',null,'[{"item_id":"ff000000-0000-4000-8000-000000000001","quantity":2,"unit_price":90}]'::jsonb)$$,
  'create_purchase_order nominal'
);
select throws_ok(
  $$select public.receive_purchase_order('a5000000-0000-4000-8000-000000000003')$$,
  'Commande introuvable dans ce centre',
  'receive_purchase_order refuse order_id centre B'
);
select throws_ok(
  $$select public.receive_purchase_order('a5000000-0000-4000-8000-000000000002')$$,
  'Seule une commande en transit peut être réceptionnée',
  'receive_purchase_order refuse commande déjà reçue'
);
select lives_ok(
  $$select public.receive_purchase_order('a5000000-0000-4000-8000-000000000001')$$,
  'receive_purchase_order nominal'
);
select is((select quantity from public.inventory_items where id='ff000000-0000-4000-8000-000000000001'), 55, 'réception : stock +10 (45 → 55)');
select is(
  (select unit_price from public.stock_movements where item_id='ff000000-0000-4000-8000-000000000001' and type='in' order by created_at desc limit 1),
  120::numeric,
  'réception : unit_price = prix de la ligne de commande'
);

-- ── infirmier centre A ──────────────────────────────────────
set local request.jwt.claims = '{"sub":"dd000000-0000-4000-8000-000000000003","role":"authenticated"}';
set local "request.jwt.claim.sub" = 'dd000000-0000-4000-8000-000000000003';
select throws_ok(
  $$select public.record_stock_movement('ff000000-0000-4000-8000-000000000001','in',1,'delivery')$$,
  'Action non autorisée pour le rôle infirmier',
  'infirmier : entrée refusée'
);
select throws_ok(
  $$select public.review_center_profile('dd000000-0000-4000-8000-000000000002','suspended','nurse')$$,
  'Action réservée à l’administrateur du centre',
  'infirmier : review refusée'
);

-- ── admin centre A : règles (c) ─────────────────────────────
set local request.jwt.claims = '{"sub":"dd000000-0000-4000-8000-000000000001","role":"authenticated"}';
set local "request.jwt.claim.sub" = 'dd000000-0000-4000-8000-000000000001';
select throws_ok(
  $$select public.review_center_profile('dd000000-0000-4000-8000-000000000001','suspended','nurse')$$,
  'Décision ou rôle invalide',
  'admin : ne peut pas se modifier lui-même'
);
select throws_ok(
  $$select public.review_center_profile('dd000000-0000-4000-8000-000000000004','suspended','nurse')$$,
  'Utilisateur introuvable dans ce centre ou administrateur non modifiable',
  'admin : ne peut pas toucher un admin d''un autre centre'
);
select lives_ok(
  $$select public.review_center_profile('dd000000-0000-4000-8000-000000000006','approved','nurse')$$,
  'admin approuve le pending rattaché à son centre'
);

select * from finish();
rollback;
