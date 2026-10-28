# MediStock — Gestion des stocks de santé

Application full-stack responsive pour le suivi de l’inventaire d’un centre de santé, conçue avec Next.js App Router, TypeScript, Tailwind CSS, composants UI inspirés de shadcn/ui et Supabase (PostgreSQL + Auth).

## Démarrage immédiat (démo)

```bash
npm install
npm run dev
```

Ouvrir l’URL indiquée. Sans identifiants Supabase, l’application démarre en **mode démonstration** avec un jeu de données médicales (lots, seuils, péremptions, mouvements, fournisseurs et commandes). Les changements sont conservés localement dans le navigateur. Utiliser « Connexion » pour tester les interfaces par rôle.

## Connexion Supabase

Configurez les variables Supabase à partir de `.env.example` dans un fichier local non versionné, puis redémarrez Next.js. Sur une base neuve isolée, exécutez `supabase/schema.sql`, puis les migrations dans l’ordre chronologique. Sur une base existante, n’exécutez pas le schéma initial : appliquez uniquement les migrations manquantes, après sauvegarde. Le fichier `supabase/seed.sql` contient des exemples liés à un centre fictif et ne doit être exécuté, après toutes les migrations, que sur une base locale/démo isolée.

Les écrans d’authentification sont disponibles sur `/login`, `/register`, `/forgot-password` et `/reset-password`; le callback OAuth est `/auth/callback` et la destination après connexion est `/dashboard`. Le bouton Google utilise `signInWithOAuth({ provider: 'google' })`; le fournisseur Google est activé sur le projet Supabase. Pour une autre configuration OAuth, renseignez l’ID/secret OAuth côté **Supabase → Authentication → Sign In / Providers → Google**, puis ajoutez l’URL de callback Supabase `https://qnxxytmphmeekbspeggy.supabase.co/auth/v1/callback` aux URI de redirection autorisées du client OAuth Google. L’URL de l’application doit aussi être autorisée dans Supabase Auth → URL Configuration.

Le callback Route Handler échange le `code` contre une session cookie via `@supabase/ssr`; les redirections `next` externes sont refusées. Les inscriptions libres sont désactivées dans l’interface. Les nouveaux profils sont créés avec `access_status = 'pending'` et restent sans accès tant qu’ils ne sont pas explicitement approuvés. Pour les environnements existants, appliquer la migration `supabase/migrations/20261028120000_gate_unapproved_users.sql` après sauvegarde. Dans Supabase Auth, désactiver également les nouvelles inscriptions dans la configuration du fournisseur ; le blocage de l’interface seul ne désactive pas l’API d’inscription.

La hiérarchie organisationnelle est **Direction régionale → Direction départementale → Centre de santé**. Un utilisateur appartient à un seul centre ; les directions régionales et départementales n’obtiennent pas de visibilité ou de rôle administrateur implicites. Après les migrations du lot 4, un profil en attente peut demander un rattachement depuis `/pending`, puis l’administrateur de ce centre peut approuver ou suspendre le compte. L’attribution d’un rôle administrateur reste une opération d’exploitation de la base.

### Déploiement des migrations multi-centres

Ordre requis pour une base existante :

1. Sauvegarder la base et inventorier les profils, fournisseurs, articles, mouvements et commandes existants.
2. Appliquer `supabase/migrations/20261028120000_gate_unapproved_users.sql`.
3. Appliquer `supabase/migrations/20261028121500_transactional_purchase_orders.sql`.
4. Appliquer `supabase/migrations/20261028130000_center_scoped_access.sql`.
5. Créer les directions et centres validés par le métier, puis attribuer explicitement un `center_id` aux comptes et à chaque ligne métier historique selon un inventaire approuvé.
6. Vérifier les rattachements, créer/approuver le premier administrateur par une opération SQL sécurisée, puis tester deux centres et leurs rôles avant de rouvrir le service.

La migration du lot 4 ne devine pas le centre des données existantes : les `center_id` historiques restent `NULL` et les politiques les rendent invisibles jusqu’à leur attribution explicite. Elle ne crée aucun centre de santé fictif. Elle interrompt aussi son exécution si elle rencontre des politiques RLS personnalisées inconnues, qui doivent alors être examinées explicitement. Ne pas lancer l’application en exploitation avant l’étape de rattachement et les tests RLS. Les clés API Supabase ne sont pas des identifiants PostgreSQL et ne permettent pas d’exécuter ces migrations.

Les comptes initiaux doivent être créés par un administrateur autorisé. Ne pas attribuer un rôle `admin` via le client ou un champ de métadonnées utilisateur ; le premier administrateur de chaque centre est configuré par un canal opérateur sécurisé. Ensuite, les demandes d’accès non-admin sont approuvées dans l’écran équipe du centre. La migration retire la modification directe des profils depuis le client.

La connexion utilise Supabase Auth email/mot de passe. Les politiques RLS et les RPC vérifient le centre de l’utilisateur pour les profils, fournisseurs, stocks, mouvements, commandes et lignes de commande. Les RPC `record_stock_movement`, `create_purchase_order` et `receive_purchase_order` refusent les identifiants d’un autre centre. La réception des commandes est totale uniquement. Toutes ces protections nécessitent l’application des migrations dans l’ordre ci-dessus et la validation de la migration multi-centres sur une base de test.

## Fonctionnalités

- Tableau de bord avec valorisation XOF, alertes de stock, dates d’expiration (fenêtre 90 jours), activité récente.
- Inventaire : recherche, catégories, création, modification, suppression, lots, fournisseurs, expiration, quantité, seuil, prix.
- Mouvements entrée/sortie : contrôle du stock disponible, mise à jour immédiate et journalisation.
- Répertoire fournisseurs, commandes entrantes (réception), équipe et paramètres du centre.
- Interface responsive tablette/ordinateur/mobile, états vides, skeleton de chargement, notifications toast et mode démo persistant.

## Rôles

- **Admin** : gestion profils, inventaire, fournisseurs et commandes.
- **Pharmacien** : gestion des stocks, fournisseurs et commandes.
- **Infirmier** : consultation et enregistrement des mouvements.

Les rôles d’accès sont vérifiés par les politiques PostgreSQL. Ne jamais exposer la clé `service_role` dans le client.
