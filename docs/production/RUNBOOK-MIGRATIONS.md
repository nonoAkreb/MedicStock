# RUNBOOK — Déploiement des migrations multi-centres

Ordre d'application obligatoire :

| # | Migration | Contenu | Garde-fou |
|---|-----------|---------|-----------|
| 1 | `20261028120000_gate_unapproved_users` | `access_status`, rôles, `record_stock_movement` v1 | — |
| 2 | `20261028121500_transactional_purchase_orders` | `create/receive_purchase_order` v1 | — |
| 3 | `20261028130000_center_scoped_access` | hiérarchie santé, `center_id`, triggers, RPC v2, politiques centre | **échoue si politiques RLS inconnues** |
| 4 | `20261028140000_health_reference_authenticated_read` | health_* lisible par `authenticated` seulement | dépend des noms de politiques de la n°3 |
| 5 | `20261028150000_stock_integrity` | `archived_at`, `unit_price`, FK restrict, CHECK statuts | **échoue si commandes `pending`/`cancelled`** |
| 6 | `20261028160000_isolation_fixups` | `create_purchase_order` ignore archivés, revoke delete | — |

## 1. Pré-vérifications (production, lecture seule)

```sql
-- 1a. Trigger de création de profil présent ? (vital pour /pending)
select tgname from pg_trigger where tgname = 'on_auth_user_created';
select proname from pg_proc where proname = 'handle_new_user';
-- Attendu : 1 ligne chacun. Sinon, rejouer le bloc correspondant de
-- supabase/schema.sql AVANT la migration 3.

-- 1b. Politiques qui feraient échouer le garde-fou de la migration 3
select tablename, policyname from pg_policies
where schemaname = 'public'
  and tablename in ('profiles','suppliers','inventory_items','stock_movements',
    'purchase_orders','purchase_order_items','health_regions',
    'health_departments','health_centers');
-- Comparer à la liste v_legacy_policies de la migration 3.
-- Toute politique absente des deux listes (legacy + nouvelles) → examen.

-- 1c. Lignes qui feraient échouer la migration 5
select status, count(*) from public.purchase_orders group by status;
-- pending/cancelled > 0 → décider : update … set status='in_transit' (recommandé
-- si ce sont des commandes réelles en cours) ou archiver en amont.

-- 1d. Nom réel des contraintes (FK et CHECK peuvent avoir un nom différent)
select conname from pg_constraint
where conrelid in ('public.stock_movements','public.purchase_orders'::regclass);
```

## 2. Sauvegarde

- Supabase Dashboard → Database → Backups : déclencher un backup manuel, noter l'heure.
- En complément : `pg_dump -Fc -f medistock-pre-migration.dump "$DATABASE_URL"`.
- Exporter aussi `auth.users` (CSV Dashboard → Authentication → Export) — les
  migrations ne touchent pas `auth`, mais la sauvegarde complète sécurise.

## 3. Application sur base de test

- Projet Supabase de staging (ou branche) avec `schema.sql` + `seed.sql`.
- `supabase db push` ou collage successif des 6 fichiers dans le SQL Editor,
  dans l'ordre du tableau ci-dessus.
- Exécuter `supabase/tests/recette-rls-multicentres.sql` et
  `supabase/tests/recette-lot4.sql` — tous les « Attendu » doivent tenir.
- Exécuter `supabase/tests/inventory-no-center.sql` → remplir le fichier de
  mapping `center-mapping.csv`, le faire valider par le métier.
- Appliquer les rattachements validés via la section « UPDATE » du script
  d'inventaire (générée depuis le mapping validé, en une transaction).

## 4. Application en production

1. Fenêtre creuse, mode maintenance si possible (banner ou scale-to-zero du front).
2. Rejouer les pré-vérifications 1a–1d sur la prod.
3. Appliquer les 6 migrations dans l'ordre (SQL Editor ou `supabase db push`).
4. Appliquer immédiatement le mapping `center_id` validé (script d'inventaire,
   section UPDATE) — avant toute reconnexion utilisateur.
5. Fumée : connexion admin → dashboard OK ; un utilisateur par centre ne voit
   que ses données ; création + archivage d'un article ; mouvement OK.
6. Fin de fenêtre.

## 5. Rollback

- Les migrations ne suppriment aucune donnée métier : le rollback le plus sûr
  est la **restauration du backup pg_dump/Supabase** (PITR ou dump).
- Rollback SQL partiel possible en rejouant les versions antérieures des
  fonctions (commentaires « ROLLBACK » en tête de chaque migration lot 4/5) —
  mais `center_id` ajouté par la migration 3 n'est PAS réversible proprement :
  préférer la restauration complète.

## Pièges identifiés à la relecture

- **`handle_new_user` vit dans `schema.sql`, pas dans les migrations** — si la
  prod n'a jamais exécuté `schema.sql`, aucun profil ne sera créé aux futures
  inscriptions (vérification 1a).
- Les politiques « for all » → le DELETE physique sur `inventory_items` est
  maintenant révoqué (migration 6) ; `suppliers`/`purchase_orders` gardent
  insert/update/delete via RLS — normal, le trigger borne au centre.
- `record_stock_movement`, `receive_purchase_order` et `current_user_role`
  sont redéfinies 2–3 fois : **ne jamais appliquer les fichiers hors ordre**.
