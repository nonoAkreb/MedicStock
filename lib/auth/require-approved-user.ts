import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Client Supabase en lecture seule : le rafraîchissement de session est écrit
// par middleware.ts ; les Server Components ne doivent pas écrire de cookies.
export async function createAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Lecture seule (Server Component) : le middleware écrit le refresh.
        },
      },
    },
  );
}

// Exige une session valide ; redirige vers /login?error=session sinon.
export async function requireUser() {
  const supabase = await createAuthClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) redirect('/login?error=session');
  return { supabase, user };
}

// Exige en plus un profil approuvé rattaché à un centre ; sinon /pending.
export async function requireApprovedUser() {
  const { supabase, user } = await requireUser();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('access_status, center_id')
    .eq('id', user.id)
    .maybeSingle();
  if (error || !profile || profile.access_status !== 'approved' || !profile.center_id) {
    redirect('/pending');
  }
  return { supabase, user, profile };
}
