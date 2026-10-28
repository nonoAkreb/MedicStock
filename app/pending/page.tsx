import { requireUser } from '@/lib/auth/require-approved-user';
import PendingClient from './pending-client';

export const dynamic = 'force-dynamic';

export default async function PendingAccessPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Mode démo : uniquement si explicitement activé, jamais en fallback d'une config manquante.
  if (!url || !key) {
    if (process.env.NEXT_PUBLIC_MEDISTOCK_DEMO === '1') return <PendingClient />;
    throw new Error('Configuration Supabase manquante');
  }

  // Session requise ; l'approbation n'est PAS exigée ici (c'est le but de la page).
  await requireUser();
  return <PendingClient />;
}
