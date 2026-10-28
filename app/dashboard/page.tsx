import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
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

  const cookieStore = await cookies();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/login?error=session');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('access_status, center_id')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError || !profile || profile.access_status !== 'approved' || !profile.center_id) redirect('/pending');
  return <DashboardClient />;
}
