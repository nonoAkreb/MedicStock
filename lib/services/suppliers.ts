import type { SupabaseClient } from '@supabase/supabase-js';
import type { Supplier } from '@/lib/dashboard/types';

export async function listSuppliers(client: SupabaseClient): Promise<Supplier[]> {
  const { data, error } = await client.from('suppliers').select('*').order('name');
  if (error) throw new Error(`Chargement des fournisseurs impossible : ${error.message}`);
  return data || [];
}

export type SupplierPayload = Omit<Supplier, 'id'>;

export async function createSupplier(client: SupabaseClient, payload: SupplierPayload) {
  const { data, error } = await client.from('suppliers').insert(payload).select().single();
  return { supplier: (data as Supplier | null) || null, error };
}
