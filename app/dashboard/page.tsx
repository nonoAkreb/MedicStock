import { requireApprovedUser } from '@/lib/auth/require-approved-user';
import DashboardClient from './dashboard-client';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // Mode démo : uniquement si explicitement activé, jamais en fallback d'une config manquante.
  if (!url || !key) {
    if (process.env.NEXT_PUBLIC_MEDISTOCK_DEMO === '1') return <DashboardClient />;
    throw new Error('Configuration Supabase manquante');
  }

  await requireApprovedUser();
  return <DashboardClient />;
}
