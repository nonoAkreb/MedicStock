import type { SupabaseClient } from '@supabase/supabase-js';
import type { Movement } from '@/lib/dashboard/types';

type MovementRow = Movement & {
  inventory_items?: { name: string } | null;
  profiles?: { full_name: string } | null;
};

export async function listMovements(client: SupabaseClient): Promise<Movement[]> {
  const { data, error } = await client
    .from('stock_movements')
    .select('*, inventory_items(name), profiles(full_name)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw new Error(`Chargement des mouvements impossible : ${error.message}`);
  return (data || []).map((x: MovementRow) => ({
    ...x,
    item_name: x.inventory_items?.name,
    user_name: x.profiles?.full_name,
  }));
}

export async function recordMovement(
  client: SupabaseClient,
  args: { itemId: string; type: 'in' | 'out'; quantity: number; reason: string },
) {
  const { data, error } = await client.rpc('record_stock_movement', {
    p_item_id: args.itemId,
    p_type: args.type,
    p_quantity: args.quantity,
    p_reason: args.reason,
  });
  return { movement: data as Movement | null, error };
}
