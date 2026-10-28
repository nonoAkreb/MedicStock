// Traduit les erreurs techniques (Postgres/PostgREST/réseau) en messages métier.
// Le détail technique n'est jamais affiché : il part dans console.error.
export function formatError(error: unknown): string {
  console.error(error);
  const anyError = error as { code?: string; message?: string } | null;
  const code = typeof anyError?.code === 'string' ? anyError.code : '';
  const message = typeof anyError?.message === 'string' ? anyError.message : '';

  if (
    code === '42501' ||
    code === 'PGRST301' ||
    /row-level security|permission denied/i.test(message)
  ) {
    return 'Action non autorisée';
  }
  if (code === '23505') return 'Cet élément existe déjà.';
  if (code === '23503') return 'Opération impossible : cet élément est lié à d’autres données.';
  if (code === '23514') return 'Données non conformes aux contraintes métier.';
  if (code === '23502') return 'Un champ obligatoire est manquant.';
  // P0001 : exceptions « raise » de nos RPC/triggers — le message est déjà un texte métier.
  if (code === 'P0001' && message) return message;
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(message)) {
    return 'Adresse e-mail ou mot de passe invalide.';
  }
  if (/failed to fetch|networkerror|fetch failed|network request failed/i.test(message)) {
    return 'Réseau indisponible. Vérifiez votre connexion.';
  }
  return 'Une erreur est survenue. Réessayez.';
}
