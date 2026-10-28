# Rapport d’audit — MediStock

**Date :** 28 octobre 2026  
**Périmètre :** revue statique du code applicatif, de l’authentification et du schéma/politiques Supabase.  
**Conclusion :** **risque élevé pour un déploiement opérationnel en l’état.** Deux problèmes peuvent compromettre la fiabilité des stocks ou permettre des actions non autorisées. Corriger les constats élevés avant d’utiliser l’application avec des données réelles.

Cet audit ne constitue pas un test d’intrusion et n’a pas porté sur un projet Supabase en ligne, sa configuration d’authentification, ses données, ni son déploiement. Les constats dépendant de ces paramètres sont signalés comme tels.

## Synthèse des constats

| #   | Priorité                                             | Constat                                                                                                                                                             | Risque                                                                                         |
| --- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1   | **Élevée — remédiation locale, déploiement restant** | Sans migration appliquée, les politiques actuelles autorisent encore les comptes authentifiés à lire les données et les rôles infirmiers à enregistrer des sorties. | Un compte créé sans approbation peut consulter les données et diminuer les quantités.          |
| 2   | **Élevée — remédiation locale, déploiement restant** | Avant correction, l’interface et le script de schéma pouvaient laisser des données fictives dans un environnement connecté.                                         | Un inventaire fictif peut être confondu avec le stock réel.                                    |
| 3   | **Moyenne**                                          | La réception d’une commande ne fait que changer son statut ; elle n’ajoute rien à l’inventaire.                                                                     | Les commandes « reçues » et les quantités en stock peuvent diverger.                           |
| 4   | **Moyenne, conditionnelle**                          | Aucune séparation par clinique/organisation n’est prévue dans les tables ou les politiques RLS.                                                                     | Si plusieurs cliniques partagent le même projet Supabase, elles partagent aussi leurs données. |
| 5   | **Moyenne, à confirmer**                             | Le rafraîchissement de session peut tenter d’écrire des cookies depuis une page Server Component.                                                                   | Une session expirée peut provoquer un échec au lieu d’être renouvelée correctement.            |

## Détails

### 1. Accès sans approbation — Élevée jusqu’au déploiement de la migration

**Références :** [`app/register/page.tsx`](./app/register/page.tsx), [`supabase/migrations/20261028120000_gate_unapproved_users.sql`](./supabase/migrations/20261028120000_gate_unapproved_users.sql), [`supabase/schema.sql`](./supabase/schema.sql)

**État :** le formulaire d’inscription a été retiré et le code local ajoute une approbation par défaut à `pending` ainsi que des politiques qui bloquent ces profils. La migration n’a pas été appliquée au projet Supabase réel ; tant qu’elle n’est pas déployée, les anciennes politiques restent applicables. La configuration Supabase Auth peut également accepter des comptes via API ou OAuth tant que les nouvelles inscriptions ne sont pas désactivées côté projet.

**Impact :** avant application de la migration, un compte non approuvé peut consulter les données et enregistrer des sorties de stock. Après migration, les nouveaux profils restent bloqués ; les comptes ne devront pas être approuvés avant la mise en place de l’isolation par centre du lot 4.

**Action restante :** désactiver les nouvelles inscriptions dans Supabase Auth, déployer et tester la migration avec sauvegarde, puis implémenter l’approbation par centre après le lot 4.

### 2. Données de démonstration dans le parcours réel — Élevée jusqu’au déploiement

**Références :** [`app/dashboard/dashboard-client.tsx`](./app/dashboard/dashboard-client.tsx), [`supabase/schema.sql`](./supabase/schema.sql), [`supabase/seed.sql`](./supabase/seed.sql)

**État :** le code local n’initialise plus les tableaux avec des exemples en mode Supabase ; chaque résultat (y compris une liste vide) remplace l’état, et une erreur de lecture vide les données puis bloque les actions en affichant un message explicite. Le schéma ne contient plus de données préchargées ; les exemples ont été déplacés dans un fichier `seed.sql` à usage local/démo seulement. Le déploiement du code reste à faire.

**Impact résiduel :** les anciennes installations qui ont déjà reçu les données de démonstration ne sont pas nettoyées par ces changements. Il faut inventorier et traiter ces lignes séparément après confirmation métier ; ne pas supprimer automatiquement des données ressemblant aux exemples.

**Action restante :** déployer l’application après validation du lot 1, inventorier les données existantes par centre et vérifier que les écrans présentent les réponses réelles (y compris les listes vides).

### 3. Réception de commande sans mise à jour des stocks — Moyenne

**Référence :** [`app/dashboard/dashboard-client.tsx` (lignes 53–54)](./app/dashboard/dashboard-client.tsx)

La création d’une commande enregistre une ligne générique, sans rattacher les articles commandés à des produits d’inventaire. La fonction de réception ne met à jour que le statut de la commande à `received` ; elle n’enregistre aucun mouvement et n’augmente aucune quantité.

**Impact :** une commande peut apparaître comme reçue alors que le stock réel reste inchangé. Cela rend les indicateurs et les alertes d’inventaire incomplets.

**Recommandation :** modéliser les lignes de commande avec les références d’articles et quantités attendues, puis réaliser la réception et les mouvements de stock dans une opération transactionnelle contrôlée.

### 4. Absence d’isolation entre cliniques — Moyenne, selon le déploiement

**Références :** [`supabase/schema.sql` (lignes 1–37, 90–107)](./supabase/schema.sql)

Les tables métier ne possèdent pas de clé de centre/organisation, et les politiques de lecture autorisent tous les utilisateurs authentifiés (`using(true)`). La plateforme doit gérer plusieurs centres dans une même base, structurés par direction régionale de la santé, direction départementale, puis centre de santé.

**Impact :** des comptes peuvent consulter les données d’autres centres si plusieurs établissements partagent la base sans politiques d’isolation.

**Recommandation :** modéliser la hiérarchie Direction régionale de la santé → Direction départementale → Centre de santé, rattacher chaque utilisateur à un unique centre et appliquer des politiques RLS qui contrôlent cette appartenance sur chaque table et chaque opération.

### 5. Écriture de cookies depuis une page Server Component — Moyenne, à confirmer

**Référence :** [`app/dashboard/page.tsx` (lignes 15–24)](./app/dashboard/page.tsx)

Le client Supabase serveur de la page appelle `cookieStore.set` dans `setAll`. Dans Next.js, l’écriture des cookies est normalement réservée aux Route Handlers et Server Actions ; une page Server Component peut ne pas être autorisée à écrire. Ce chemin est notamment pertinent si Supabase doit renouveler une session.

**Impact :** le renouvellement d’une session expirée peut échouer ou déclencher une erreur lors du chargement du tableau de bord.

**Recommandation :** gérer le renouvellement des cookies dans un middleware ou un Route Handler compatible avec l’écriture des cookies, selon le modèle recommandé par `@supabase/ssr`. Tester explicitement l’accès avec un jeton expiré.

## Vérifications effectuées

- **TypeScript :** `npx tsc --noEmit --incremental false` — réussi.
- **Build Next.js :** un premier essai a échoué sur `ENOSPC` ; après vérification d’environ 34,6 Go libres, `npm run build` a réussi. Le build signale des avertissements de dépréciation Node.js concernant `punycode`.
- **Tests automatisés :** aucun script de test ou de lint n’est déclaré dans `package.json`.
- **Configuration réelle Supabase :** non vérifiée ; `.env.local` n’est pas présent dans le répertoire examiné.

## Ordre de remédiation conseillé

1. Fermer ou approuver explicitement les inscriptions avant d’autoriser l’accès au stock et aux mouvements.
2. Empêcher l’affichage des données de démonstration lorsque Supabase est configuré et remonter les erreurs de lecture.
3. Rendre la réception de commande cohérente avec l’inventaire, de préférence de façon transactionnelle.
4. Décider/documenter le modèle mono-clinique ou multi-tenant et appliquer l’isolation correspondante.
5. Valider le renouvellement des sessions Supabase dans le runtime Next.js de production.
6. Libérer de l’espace disque, relancer le build, puis ajouter des tests d’intégration couvrant RLS, mouvements infirmiers, lectures vides/échouées et réception de commande.

## Plan de remédiation détaillé par lots

Plan proposé pour une équipe réduite (un développeur et un valideur métier). Les charges sont indicatives, en jours ouvrés, et à confirmer après clarification du mode de déploiement Supabase. Les lots 1 et 2 sont des prérequis à toute utilisation avec des stocks réels. Ne pas appliquer de migration de données en production sans sauvegarde et répétition préalable sur un environnement de test.

### Lot 0 — Préparer et sécuriser la remédiation

**Priorité :** préalable · **Charge indicative :** 0,5 jour

- Confirmer si l’application est mono-clinique (un projet Supabase distinct par centre) ou multi-clinique (plusieurs centres dans un même projet).
- Confirmer si l’inscription publique est activée dans Supabase, si les comptes existants doivent rester actifs et qui approuve les nouveaux utilisateurs.
- Créer ou vérifier un environnement de test Supabase, une sauvegarde/restauration et une procédure de retour arrière.
- Libérer l’espace disque nécessaire au build ; identifier la destination du déploiement et son runtime Next.js.
- Recenser les comptes existants et leurs rôles avant toute modification d’accès.

**Critères de sortie :** décisions mono/multi-clinique et d’approbation documentées ; environnement de test utilisable ; sauvegarde restaurable ; build relançable sans erreur de disque.

**Dépendances :** aucune. Les décisions de ce lot conditionnent les lots 1 et 4.

#### Résultat d’exécution du lot 0 — 28 octobre 2026

- **Décision prise :** l’application gère plusieurs centres de santé dans une même plateforme selon la hiérarchie Direction régionale de la santé → Direction départementale → Centre de santé. Le lot 4 devra mettre en œuvre cette hiérarchie et une isolation effective par centre dans les politiques RLS et les fonctions SQL.
- **Espace disque :** environ 34,6 Go libres sur C: lors de la vérification ; le manque d’espace observé au précédent build n’est plus présent à cet instant.
- **Configuration Supabase locale :** aucun `supabase/config.toml` ou dossier de migrations n’était présent ; la configuration Supabase vient d’un fichier `.env` local. La CLI Supabase n’est pas installée. Les vérifications réseau ont confirmé l’accessibilité de l’API ; l’état des comptes et des sauvegardes reste à vérifier.
- **Protection locale :** aucun `.gitignore` n’existait. Le fichier `.claude/settings.json` contient une valeur de configuration ressemblant à un jeton d’authentification ; sa valeur n’est pas reproduite dans ce rapport. Un `.gitignore` a été ajouté pour exclure ce fichier, les `.env*` (en réautorisant `.env.example`), `node_modules` et `.next`. Cette exclusion n’annule pas une exposition passée : révoquer/renouveler le jeton et vérifier qu’il n’a pas été partagé.
- **Build :** `npm run build` a réussi après libération d’espace (compilation, vérifications TypeScript et génération des pages terminées). Des avertissements Node.js de dépréciation `punycode` subsistent, sans échec du build.
- **Reste à faire pour clore le lot :** fournir un environnement/projet Supabase de test sans transmettre de secrets dans le dépôt, vérifier la sauvegarde et sa restauration, puis relever les utilisateurs/organisations existants.

**Décisions d’organisation et d’accès retenues avant le lot 1 et les migrations du lot 4 :**

1. Quelle est la hiérarchie des organisations ? **Décision : Direction régionale de la santé → Direction départementale de la santé → Centre de santé.**
2. Un même utilisateur peut-il appartenir à plusieurs centres ? **Décision : non, chaque utilisateur est rattaché à un seul centre de santé.** La base devra faire respecter cette unicité.
3. Où s’applique le rôle `admin`, `pharmacist` ou `nurse` ? **Décision : au centre unique de l’utilisateur.**
4. Qui peut créer les niveaux d’organisation et désigner les administrateurs initiaux ? **Décision : un administrateur de plateforme**, sans auto-attribution d’un rôle privilégié par le navigateur.
5. Comment un utilisateur rejoint-il un centre ? **Décision : demande d’accès en attente d’approbation par un administrateur de ce centre.**
6. Comment rattacher les données historiques actuelles ? **Décision en attente de l’équipe métier :** inventorier leurs directions et centres propriétaires puis les rattacher explicitement après sauvegarde ; ne pas affecter automatiquement toutes les données à une organisation par défaut.

**Statut du lot 0 :** cadrage de la hiérarchie multi-organisations et de la règle « un centre par utilisateur » et vérifications locales terminés ; lot **partiellement clos**. La validation de l’environnement de test Supabase, des sauvegardes/restaurations, de l’inventaire réel des comptes/données et de la rotation du jeton exposé reste à effectuer avec les responsables de la plateforme. L’affectation des données historiques à leur hiérarchie demeure un prérequis métier avant migration.

### Lot 1 — Fermer l’accès non approuvé (constat 1)

**Priorité :** P0 · **Charge indicative :** 1 à 2 jours

- Désactiver l’inscription ouverte dans Supabase tant qu’un parcours d’approbation n’est pas opérationnel.
- Mettre en place le parcours retenu : demande d’accès en attente d’approbation par un administrateur de l’organisation. Ne jamais permettre au navigateur de choisir ou de modifier son rôle.
- Côté base, faire appliquer l’état approuvé et le rôle sur toutes les politiques RLS et fonctions sensibles, pas uniquement dans l’interface.
- Vérifier qu’un utilisateur infirmier ne peut effectuer que les sorties autorisées ; qu’un pharmacien peut gérer les stocks ; et qu’un administrateur seul peut administrer les profils.
- Passer en revue les utilisateurs existants et retirer/désactiver les comptes non autorisés, après validation métier.

**Tests d’acceptation :**

1. Une inscription non approuvée ne peut lire aucune donnée métier ni appeler `record_stock_movement`.
2. Un infirmier authentifié ne peut ni créer une entrée, ni gérer articles/fournisseurs/commandes, ni changer son rôle.
3. Les rôles pharmacien et administrateur conservent uniquement les droits prévus.
4. Les tentatives interdites sont refusées côté base, même en appelant Supabase sans passer par l’interface.

**Déploiement/retour arrière :** appliquer d’abord sur la base de test ; conserver un compte administrateur de secours vérifié. Réactiver une inscription ne doit être envisagé qu’après validation des politiques et du processus d’approbation.

**Dépendances :** décisions du lot 0.

#### Résultat d’exécution du lot 1 — 28 octobre 2026

- **Interface :** retrait de l’inscription par e-mail et Google ; la page `/register` informe désormais que l’accès doit être demandé au centre. Les appels Supabase `signUp` ne sont plus présents dans le parcours UI. Les appels à l’action publics ont été renommés pour ne plus promettre une inscription immédiate.
- **Base :** ajout du statut `pending` / `approved` / `suspended`, avec `pending` par défaut pour les nouveaux profils. La fonction de rôle ne renvoie un rôle que pour un profil approuvé ; les politiques de lecture des tables métier et la RPC de mouvement refusent donc les profils en attente/suspendus. Les clients authentifiés ne peuvent plus modifier directement les profils.
- **Garde serveur :** le tableau de bord vérifie le statut du profil côté serveur et renvoie les comptes non approuvés vers `/pending`.
- **Migration préparée :** [`supabase/migrations/20261028120000_gate_unapproved_users.sql`](./supabase/migrations/20261028120000_gate_unapproved_users.sql). Elle n’a **pas** été exécutée sur un projet Supabase réel : aucun environnement/identifiant de test n’est fourni. Ne pas exécuter sur la production sans sauvegarde et contrôle des accès existants.
- **Limite volontaire :** l’approbation par administrateur de centre et l’attribution par centre sont reportées au lot 4, car le schéma actuel n’a ni hiérarchie région/département/centre ni RLS par centre. En attendant, ne pas approuver de comptes dans une base partagée entre centres ; le blocage des nouvelles inscriptions doit aussi être activé dans la configuration Supabase Auth.
- **À vérifier avant clôture :** configurer Auth Supabase pour refuser les nouvelles inscriptions directes, appliquer la migration en environnement test, confirmer qu’un profil `pending` ne peut lire aucune table métier ni appeler la RPC, et vérifier la procédure de reprise des profils existants après réalisation du lot 4.

### Lot 2 — Supprimer les données fictives du chemin réel (constat 2)

**Priorité :** P0 · **Charge indicative :** 1 à 2 jours

- Distinguer explicitement le mode démo du mode connecté ; n’activer les données de démonstration que lorsque l’application est délibérément configurée en démo.
- En mode Supabase, initialiser les vues à vide ou en chargement, puis remplacer les données par les réponses du serveur, y compris par des listes vides.
- Vérifier les erreurs de chacune des lectures Supabase (inventaire, fournisseurs, mouvements, commandes et données administrateur) et afficher un état d’erreur exploitable plutôt que des exemples.
- Empêcher les actions de stock si le chargement a échoué ou si les données affichées ne sont pas confirmées comme chargées depuis la base.
- Conserver le stockage local uniquement pour le mode démo et empêcher qu’il soit utilisé comme repli lorsque Supabase est configuré.

**Tests d’acceptation :**

1. Une base valide mais vide affiche des états vides, sans aucun article, fournisseur ou mouvement fictif.
2. Une erreur de lecture affiche une erreur et n’affiche ni ne permet de modifier les données de démonstration.
3. Le mode démo conserve son comportement local existant, isolé du mode connecté.
4. Les données réelles chargées et les actions enregistrées restent visibles après rechargement.

**Dépendances :** lot 0. À livrer avant toute utilisation métier, en parallèle du lot 1 si les branches sont isolées.

#### Résultat d’exécution du lot 2 — 28 octobre 2026

- **Accès Supabase local :** les paramètres locaux ont permis de joindre `auth/v1/health` (HTTP 200). Une requête PostgREST sans lecture de lignes (`profiles?select=id&limit=0`) a aussi répondu HTTP 200. Une vérification équivalente de la colonne `access_status` a échoué avec `42703` (colonne inexistante) : la migration du lot 1 n’est donc pas encore présente sur le projet distant. Ces requêtes confirment la connectivité et certains éléments de schéma, pas l’authentification d’un utilisateur ni l’efficacité des règles RLS sur des données.
- **Secret local :** le fichier `.env` contient un paramètre serveur sensible. Sa valeur n’a pas été lue ni communiquée ; `.env` est maintenant exclu de Git par `.gitignore`, et le fichier n’est pas suivi par Git. Vérifier tout de même les partages externes et effectuer une rotation si ce secret a pu être exposé.
- **État connecté :** les listes démarrent vides, toutes les requêtes métier vérifient leurs erreurs, et même une réponse vide remplace explicitement l’état. En cas d’erreur, l’interface affiche la cause, ne présente aucune donnée fictive et bloque l’accès aux actions jusqu’à réessai.
- **Mode démo :** il conserve ses exemples et son stockage local séparément. Un stockage démo illisible/incomplet ou une erreur d’écriture est maintenant signalé au lieu d’être ignoré.
- **Schéma :** les insertions d’exemples ont été retirées de `schema.sql` et déplacées vers [`supabase/seed.sql`](./supabase/seed.sql), explicitement réservé aux bases isolées de démonstration ; la procédure d’installation est précisée dans [`README.md`](./README.md).
- **Validation :** `npx tsc --noEmit --incremental false` et `npm run build` réussissent. Aucune connexion authentifiée ni test RLS n’a été réalisé. Les exemples éventuellement déjà insérés dans une base existante ne sont pas supprimés automatiquement.
- **Séquence de déploiement :** ne pas déployer cette version avec la garde serveur du lot 1 avant d’avoir appliqué et vérifié la migration d’approbation ; le schéma distant actuel ne possède pas encore `access_status`. L’application de cette migration placera les profils existants en attente et coupera leurs accès jusqu’à une réattribution sûre après le lot 4 : planifier cette indisponibilité, sauvegarder et inventorier les comptes avant toute application.
- **À vérifier avant clôture :** tester les états vide et erreur contre un compte utilisateur authentifié en environnement de test, déployer le code, puis inventorier et traiter manuellement les données fictives éventuellement déjà présentes après confirmation métier.

### Lot 3 — Rendre la réception de commande transactionnelle (constat 3)

**Priorité :** P1 · **Charge indicative :** 2 à 4 jours

- Définir avec le métier le contenu d’une ligne de commande : article d’inventaire, quantité commandée, quantité reçue, prix unitaire et, si nécessaire, lot et péremption.
- Remplacer la ligne générique actuelle par des lignes rattachées aux articles concernés. Prévoir le traitement des reliquats et des réceptions partielles, ou les exclure explicitement du premier périmètre.
- Créer une fonction SQL transactionnelle qui vérifie le rôle, l’état de la commande et les quantités, enregistre les mouvements d’entrée, met à jour les stocks et marque la réception.
- Rendre l’opération idempotente ou interdire la double réception afin qu’un double clic ou une répétition réseau n’ajoute pas le stock deux fois.
- Adapter l’interface pour afficher le résultat confirmé par la base et présenter les erreurs sans annoncer une réception réussie.

**Tests d’acceptation :**

1. Une réception augmente le stock de la quantité reçue et crée un mouvement traçable pour chaque ligne.
2. Une réception répétée ne double pas le stock.
3. Une commande invalide, déjà reçue ou non autorisée ne change ni statut ni stock.
4. En cas d’échec au milieu du traitement, aucune mise à jour partielle ne subsiste.
5. Les valeurs affichées après réception correspondent aux valeurs relues depuis la base.

**Dépendances :** migration du lot 1 pour l’approbation ; la réception partielle est exclue de ce lot. Les RPC devront être complétées avec l’isolation centre lors du lot 4.

#### Résultat d’exécution du lot 3 — 28 octobre 2026

- **Création de commande :** formulaire détaillé avec fournisseur, référence, date attendue et lignes sélectionnées dans l’inventaire. Le montant est calculé des lignes ; la création passe par une RPC atomique qui valide les rôles, articles, quantités et prix.
- **Réception totale seulement :** la RPC `receive_purchase_order` verrouille la commande, refuse les statuts invalides et les anciennes commandes sans article associé, augmente le stock, ajoute les mouvements d’entrée et change le statut dans une transaction. Une réception partielle est exclue comme convenu.
- **Autorisations :** la création/réception est réservée aux rôles administrateur et pharmacien approuvés. Les écritures directes des clients sur les entêtes et lignes de commande sont retirées ; les écritures passent par les RPC.
- **Données démo :** les commandes de démonstration ont désormais des lignes rattachées à des articles. Le seed reste réservé à une base isolée.
- **Migration préparée :** [`supabase/migrations/20261028121500_transactional_purchase_orders.sql`](./supabase/migrations/20261028121500_transactional_purchase_orders.sql), dépendante de la migration du lot 1. Elle n’a pas été appliquée sur la base distante : les paramètres locaux ne contiennent pas de chaîne de connexion PostgreSQL ni d’identifiant Supabase CLI/Management API permettant d’exécuter du DDL. Les clés API Supabase seules ne sont pas un mécanisme d’exécution SQL ; aucune écriture distante n’a été tentée.
- **Blocage de séquence :** la base distante ne possède pas `access_status` (vérification précédente : `42703`). Il faut d’abord appliquer et tester la migration du lot 1 avec une sauvegarde et un plan de réapprobation, puis celle du lot 3. La base est partagée entre centres et ne possède pas encore la RLS hiérarchique du lot 4 : ne pas exposer les RPC en production avant cette isolation.
- **Validation locale :** `npx tsc --noEmit --incremental false` et `npm run build` réussissent après correction d’un rétrécissement de type nullable sur le client Supabase. L’avertissement de dépréciation Node.js `punycode` n’a pas bloqué le build. Les tests d’intégration sur au moins deux rôles et commandes (complète, répétée, vide/incomplète, quantité invalide) restent à réaliser. Pas de tests SQL/RLS authentifiés réalisés dans cette session.

### Lot 4 — Appliquer la hiérarchie et l’isolation des centres (constat 4)

**Priorité :** P1 · **Charge indicative :** 3 à 6 jours, à réestimer après inventaire des données

- Créer le modèle de données hiérarchique : directions régionales, directions départementales rattachées à une région, centres rattachés à une direction départementale.
- Rattacher chaque utilisateur à un seul centre et faire respecter cette cardinalité en base. Les droits régionaux ou départementaux ne sont pas implicites : toute visibilité ou administration à ces niveaux doit être définie explicitement.
- Ajouter un identifiant de centre aux données métier et remplacer les lectures RLS globales par des contrôles d’appartenance à ce centre.
- Appliquer le cloisonnement à toutes les tables et fonctions, y compris profils, inventaire, fournisseurs, mouvements, commandes et opérations transactionnelles ; vérifier qu’une RPC ne peut pas agir sur l’identifiant d’un autre centre.
- Après sauvegarde et inventaire validé, rattacher les données historiques à leur centre et à sa hiérarchie ; ne pas les affecter à un centre par défaut sans confirmation métier.

**Tests d’acceptation multi-centres :**

1. Un utilisateur rattaché à un centre ne peut lire, modifier ou supprimer aucune donnée d’un autre centre.
2. Un département ne peut être rattaché qu’à sa direction régionale parente, et un centre qu’à son département parent.
3. Les fonctions RPC refusent un identifiant d’article ou de commande d’un autre centre.
4. La base refuse le rattachement d’un même utilisateur à un deuxième centre.
5. Les tests couvrent au moins deux régions, deux départements et deux centres ; aucune politique ne repose seulement sur un filtre côté client.

**Dépendances :** décisions du lot 0 ; lot 1 pour le modèle d’approbation et d’appartenance ; inventaire métier des données avant migration.

#### Implémentation locale du lot 4 — 28 octobre 2026

- **Hiérarchie :** migration `20261028130000_center_scoped_access.sql` créant les directions régionales, directions départementales rattachées à leur région et centres rattachés à leur département.
- **Un seul centre par utilisateur :** `profiles.center_id` référence un seul centre. Les comptes en attente peuvent demander leur centre ; un administrateur du même centre peut les approuver ou les suspendre. Les admins ne peuvent pas promouvoir un autre compte au rôle administrateur. Les rôles régionaux/départementaux ne sont pas créés.
- **Données métier :** les fournisseurs, articles, mouvements, commandes et lignes disposent d’un `center_id`. RLS filtre chaque lecture et écriture par centre. Les déclencheurs et RPC vérifient également les références fournisseurs/articles/commandes, les opérations de stock et les réceptions, sans se fier aux filtres client.
- **Profils/données historiques :** les lignes préexistantes restent avec `center_id = NULL` ; aucune affectation arbitraire n’est faite. Les politiques les rendent inaccessibles aux utilisateurs jusqu’à rattachement explicite. Il faut inventorier et associer chaque profil et donnée métier au centre validé avant de rétablir les comptes.
- **Interface :** `/pending` permet de demander le centre selon la hiérarchie région → département → centre. L’écran équipe n’affiche plus de faux utilisateurs et utilise la RPC de validation/suspension limitée au centre de l’administrateur.
- **Démo isolée :** le seed crée explicitement une hiérarchie et rattache chaque donnée d’exemple à un centre fictif ; il reste strictement réservé aux environnements démo.
- **Migration distante :** non exécutée. Le dépôt local ne dispose ni de `psql`, ni de la CLI Supabase, ni d’un identifiant PostgreSQL ou Management API. Les clés Supabase configurées sont des clés API et ne fournissent pas un canal DDL. Les migrations nécessaires doivent être exécutées dans l’ordre : lots 1, 3, puis 4. La migration du lot 4 s’arrête si elle détecte des politiques RLS personnalisées inconnues, afin qu’elles soient examinées au lieu d’être supprimées implicitement. Il faut auparavant confirmer une sauvegarde et le plan de rattachement des données.
- **Validation :** `npx tsc --noEmit --incremental false` et `npm run build` réussissent. Docker est installé mais son moteur n’est pas démarré ; aucun PostgreSQL local n’est disponible. Les migrations SQL et contrôles RLS multi-centres n’ont donc pas été exécutés. Ne pas considérer le lot comme prêt à la production avant la recette SQL/RLS avec au moins deux régions, deux départements et deux centres, et la validation des profils et données historiques.

### Lot 5 — Fiabiliser le renouvellement des sessions (constat 5)

**Priorité :** P2 · **Charge indicative :** 1 à 2 jours

- Aligner l’intégration Supabase SSR sur le modèle de cookies compatible avec la version de Next.js déployée : middleware/proxy pour renouveler la session et Route Handlers/Server Actions pour écrire les cookies lorsque nécessaire.
- Garder la vérification d’identité côté serveur ; ne pas se fier à un contrôle exclusivement client.
- Traiter explicitement les erreurs de lecture/renouvellement de session et éviter les redirections en boucle.

**Tests d’acceptation :**

1. Une session valide ouvre le tableau de bord sans perdre ni invalider les cookies.
2. Une session proche de l’expiration est renouvelée et reste utilisable après navigation et rechargement.
3. Une session expirée ou révoquée redirige une seule fois vers la connexion avec un message clair.
4. Aucun chemin d’accès protégé ne dépend uniquement de `getSession()` côté navigateur.

**Dépendances :** lot 0, puis validation sur le runtime de préproduction.

### Lot 6 — Validation intégrée et mise en production

**Priorité :** obligatoire avant lancement · **Charge indicative :** 1 à 2 jours, hors correction des retours

- Ajouter des tests automatisés pour les règles RLS, les mouvements, les lectures vides/en erreur et la réception des commandes.
- Exécuter `npx tsc --noEmit --incremental false`, les tests ciblés et `npm run build` dans un environnement avec suffisamment d’espace disque.
- Faire une recette avec les rôles infirmier, pharmacien et administrateur, puis vérifier les parcours d’inscription, connexion, renouvellement de session et déconnexion.
- Déployer d’abord en préproduction ; comparer inventaire et mouvements avec les résultats attendus, puis obtenir la validation métier.
- Préparer le retour arrière : version précédente de l’application, sauvegarde de base, migrations compatibles et procédure d’arrêt des écritures si une divergence de stock est détectée.

**Critères de mise en production :** lots 1 et 2 validés ; lot 3 validé si la réception des commandes est utilisée ; stratégie du lot 4 décidée et appliquée ; lot 5 validé ; build et tests réussis ; procédure de sauvegarde/restauration vérifiée.

## Jalons de livraison suggérés

| Jalon                     | Lots      | Condition de passage                                                                                    |
| ------------------------- | --------- | ------------------------------------------------------------------------------------------------------- |
| Sécurisation minimale     | 0, 1 et 2 | Aucun compte non approuvé ne peut accéder aux opérations ; aucune donnée fictive dans le mode connecté. |
| Cohérence métier          | 3 et 4    | Réceptions cohérentes avec le stock ; isolation mono/multi-clinique explicitement garantie.             |
| Préparation de production | 5 et 6    | Sessions validées, tests et build réussis, recette métier et retour arrière prêts.                      |
