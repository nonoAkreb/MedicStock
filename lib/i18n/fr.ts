// Dictionnaire français — point d'entrée unique des chaînes UI.
// Objectif : préparer l'i18n sans ajouter de librairie.
// Pour ajouter une langue : dupliquer ce fichier et remplacer LOCALE/messages.
export const LOCALE = 'fr-FR';
export const messages = {
  nav: {
    overview: 'Vue d’ensemble',
    dashboard: 'Tableau de bord',
    operations: 'Opérations',
    inventory: 'Inventaire',
    movements: 'Mouvements',
    suppliers: 'Fournisseurs',
    orders: 'Commandes',
    administration: 'Administration',
    team: 'Utilisateurs',
    settings: 'Paramètres',
    finances: 'Finances',
  },
  common: {
    cancel: 'Annuler',
    save: 'Enregistrer',
    close: 'Fermer',
    search: 'Rechercher',
    export: 'Exporter',
    loading: 'Chargement…',
    none: '—',
    confirm: 'Confirmer',
    previous: 'Précédent',
    next: 'Suivant',
    all: 'Tout',
    currency: 'XOF',
  },
  category: {
    medication: 'Médicament',
    ppe: 'EPI',
    surgical: 'Chirurgie',
    other: 'Autre',
    all: 'Toutes les catégories',
  },
  reason: {
    delivery: 'Livraison',
    patient_dispense: 'Distribution patient',
    expired_disposal: 'Destruction périmé',
    department_transfer: 'Transfert département',
  },
  role: {
    admin: 'Administrateur',
    pharmacist: 'Pharmacien',
    nurse: 'Infirmier(ère)',
  },
  errors: {
    notAuthorized: 'Action non autorisée',
    duplicate: 'Cet élément existe déjà',
    reference: 'Élément lié à d’autres données',
    constraint: 'Donnée invalide',
    required: 'Champ requis manquant',
    network: 'Connexion impossible, réessayez',
    generic: 'Une erreur est survenue',
    session: 'Votre session a expiré, reconnectez-vous',
    oauth: 'La connexion a échoué, réessayez',
  },
} as const;
export type Messages = typeof messages;
