-- INVENTAIRE — données historiques sans center_id
-- Lecture seule : comptages + extraction pour le mapping à valider.
-- N'AFFECTE AUCUN centre automatiquement. Le mapping validé produit la
-- section UPDATE en fin de fichier (à générer puis exécuter en transaction).

-- ─── 1. Comptages ────────────────────────────────────────────
select 'profiles' as table_name, count(*) filter (where center_id is null) as sans_centre, count(*) as total
from public.profiles
union all
select 'suppliers', count(*) filter (where center_id is null), count(*) from public.suppliers
union all
select 'inventory_items', count(*) filter (where center_id is null), count(*) from public.inventory_items
union all
select 'stock_movements', count(*) filter (where center_id is null), count(*) from public.stock_movements
union all
select 'purchase_orders', count(*) filter (where center_id is null), count(*) from public.purchase_orders
union all
select 'purchase_order_items', count(*) filter (where center_id is null), count(*) from public.purchase_order_items;

-- ─── 2. Détail des profils orphelins ─────────────────────────
-- À copier dans center-mapping.csv (colonne proposal laissée vide,
-- à remplir par le métier : e-mail → centre réel).
select p.id, u.email, p.full_name, p.role, p.access_status, p.created_at,
       '' as center_id_propose, '' as commentaire
from public.profiles p
join auth.users u on u.id = p.id
where p.center_id is null
order by p.created_at;

-- ─── 3. Données techniques orphelines ────────────────────────
-- Fournisseurs / articles / commandes sans centre : chaque ligne part
-- dans le mapping avec un rattachement proposé à valider.
select 'supplier' as type, id::text, name as libelle, created_at::text,
       '' as center_id_propose
from public.suppliers where center_id is null
union all
select 'item', id::text, name, created_at::text, ''
from public.inventory_items where center_id is null
union all
select 'order', id::text, reference, created_at::text, ''
from public.purchase_orders where center_id is null
order by 1, 3;

-- Mouvements orphelins : ils suivent le centre de leur article —
-- pas de décision à prendre, la section UPDATE les traite en cascade.
select m.id, i.name as article, m.type, m.quantity, m.created_at
from public.stock_movements m
left join public.inventory_items i on i.id = m.item_id
where m.center_id is null
order by m.created_at;

-- ─── 4. Génération des UPDATE depuis center-mapping.csv validé ─
-- Après validation du mapping, importer le CSV dans une table temporaire :
--   create temp table mapping (type text, id uuid, center_id uuid);
--   \copy mapping from 'center-mapping.csv' csv header;
-- puis :
--   update public.profiles p set center_id = m.center_id
--   from mapping m where m.type='profile' and m.id = p.id;
--   update public.suppliers s set center_id = m.center_id
--   from mapping m where m.type='supplier' and m.id = s.id;
--   update public.inventory_items i set center_id = m.center_id
--   from mapping m where m.type='item' and m.id = i.id;
--   update public.purchase_orders o set center_id = m.center_id
--   from mapping m where m.type='order' and m.id = o.id;
--   -- cascades : mouvements et lignes de commande héritent du parent
--   update public.stock_movements sm set center_id = i.center_id
--   from public.inventory_items i where sm.item_id = i.id and sm.center_id is null;
--   update public.purchase_order_items poi set center_id = o.center_id
--   from public.purchase_orders o where poi.order_id = o.id and poi.center_id is null;
-- Tout en UNE transaction ; relancer la section 1 pour vérifier 0 orphelin.
