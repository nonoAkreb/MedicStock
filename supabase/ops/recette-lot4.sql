-- RECETTE LOT 4 — intégrité des données de stock
-- À exécuter bloc par bloc dans le SQL Editor Supabase APRÈS avoir appliqué
-- 20261028140000 puis 20261028150000 (et les migrations multi-centres).
-- Connectez-vous via l'app avec un compte approved rattaché à un centre
-- pour les tests fonctionnels ; les blocs SQL se lancent en admin.

-- ─── 1. Archivage logique ─────────────────────────────────────
-- a) Depuis l'app, ouvrez un article → « Archiver l'article ».
-- b) Vérifiez : l'article a disparu de l'inventaire MAIS ses mouvements existent
--    toujours et archived_at est renseigné :
select id, name, archived_at from public.inventory_items where archived_at is not null;
select count(*) as mouvements_conserves
from public.stock_movements m
join public.inventory_items i on i.id = m.item_id
where i.archived_at is not null;
-- c) Un delete physique doit être REFUSÉ (FK restrict) :
-- delete from public.inventory_items where id = '<id_archivé>';
-- → ERROR: update or delete on table "inventory_items" violates foreign key
--   constraint "stock_movements_item_id_fkey" on table "stock_movements"

-- ─── 2. Snapshot de prix ──────────────────────────────────────
-- a) Notez le prix courant d'un article, faites une entrée de stock via l'app.
-- b) Changez le prix de l'article, faites une seconde entrée.
-- c) Vérifiez que chaque mouvement a figé SON prix :
select m.created_at, m.type, m.quantity, m.unit_price, i.price as prix_actuel
from public.stock_movements m
join public.inventory_items i on i.id = m.item_id
order by m.created_at desc
limit 10;
-- → les deux mouvements montrent des unit_price différents si le prix a changé.
-- Backfill : les mouvements antérieurs à la migration portent le prix courant
-- de l'article (approximation documentée, pas le prix historique réel).

-- ─── 3. Anti double-soumission ────────────────────────────────
-- a) App : modale « Nouveau mouvement » → double-clic rapide sur
--    « Enregistrer le mouvement ». Le bouton se grise au premier clic.
-- b) Vérifiez en base : une seule ligne créée :
select created_at, type, quantity
from public.stock_movements
where user_id = auth.uid()
order by created_at desc
limit 5;

-- ─── 4. Concurrence (FOR UPDATE) ─────────────────────────────
-- Deux onglets app ouverts sur le même centre, même article, stock = 10.
-- Lancez en quasi-simultané deux sorties de 8 :
--   → la première passe, la seconde échoue « Stock insuffisant »
--   (le FOR UPDATE sérialise : pas de quantité négative, pas de mouvement perdu).
select id, quantity from public.inventory_items where id = '<article>';
select created_at, type, quantity from public.stock_movements
where item_id = '<article>' order by created_at desc limit 5;

-- ─── 5. Statuts de commande ──────────────────────────────────
-- La migration échoue avec un message explicite si des lignes portent
-- 'pending' ou 'cancelled'. Vérifiez après application :
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.purchase_orders'::regclass and contype = 'c';
-- → check (status = ANY (ARRAY['in_transit','received']))
-- Réception d'une commande : mouvements 'in' créés avec unit_price = prix
-- d'achat de la ligne de commande (pas le prix catalogue).
