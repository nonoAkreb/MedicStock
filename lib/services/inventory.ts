import type { SupabaseClient } from '@supabase/supabase-js';
import type { Item } from '@/lib/dashboard/types';

type ItemRow = Item & { suppliers?: { name: string | null } | null };
const mapItem = (x: ItemRow): Item => ({ ...x, supplier_name: x.suppliers?.name ?? undefined });

export type ItemPayload = {
  name: string;
  category: Item['category'];
  sku_batch: string;
  expiration_date: string | null;
  supplier_id: string | null;
  quantity: number;
  min_threshold: number;
  price: number;
};

export async function listItems(client: SupabaseClient): Promise<Item[]> {
  const { data, error } = await client
    .from('inventory_items')
    .select('*, suppliers(name)')
    .is('archived_at', null)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Chargement de l’inventaire impossible : ${error.message}`);
  return (data || []).map((x) => mapItem(x as ItemRow));
}

export async function upsertItem(client: SupabaseClient, payload: ItemPayload, editId?: string) {
  const q = editId
    ? client.from('inventory_items').update(payload).eq('id', editId)
    : client.from('inventory_items').insert(payload);
  const { data, error } = await q.select('*,suppliers(name)').single();
  return { item: data ? mapItem(data as ItemRow) : null, error };
}

export async function archiveItem(client: SupabaseClient, id: string) {
  const { error } = await client
    .from('inventory_items')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  return { error };
}
