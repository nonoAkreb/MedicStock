import type { SupabaseClient } from '@supabase/supabase-js';
import type { Center } from '@/lib/dashboard/types';

export type CenterSettings = {
  name: string;
  city: string | null;
  currency: string;
  alertDaysBefore: number;
};

export async function updateCenter(client: SupabaseClient, settings: CenterSettings) {
  const { data, error } = await client.rpc('update_my_center', {
    p_name: settings.name,
    p_city: settings.city,
    p_currency: settings.currency,
    p_alert_days_before: settings.alertDaysBefore,
  });
  return { center: (data as Center | null) || null, error };
}
