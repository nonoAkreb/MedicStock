import type { SupabaseClient } from '@supabase/supabase-js';

export type Profile = {
  id: string;
  full_name: string | null;
  role: string | null;
  access_status: string | null;
  center_id: string | null;
  center?: {
    name: string;
    city: string | null;
    currency: string;
    alert_days_before: number;
    health_departments?: { name: string } | null;
  } | null;
};

export async function getOwnProfile(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from('profiles')
    .select('*, center:health_centers(name, city, currency, alert_days_before, health_departments(name))')
    .eq('id', userId)
    .maybeSingle();
  return { profile: data as Profile | null, error };
}

export async function listProfileRoles(client: SupabaseClient) {
  const { data, error } = await client.from('profiles').select('role');
  return { roles: (data as { role: string }[] | null) || [], error };
}
