import type { SupabaseClient } from '@supabase/supabase-js';
import type { Movement, Order, OrderLine } from '@/lib/dashboard/types';
import type { PurchaseOrderDraft } from '@/components/dashboard/purchase-order-form';

type OrderRow = {
  id: string;
  reference: string;
  suppliers?: { name: string } | null;
  purchase_order_items?: { count: number }[];
  total_amount: number;
  status: string;
  created_at: string;
};

const mapOrder = (x: OrderRow): Order => ({
  id: x.id,
  reference: x.reference,
  supplier: x.suppliers?.name || 'Fournisseur',
  items: x.purchase_order_items?.[0]?.count || 0,
  amount: Number(x.total_amount),
  status: x.status === 'in_transit' ? 'En transit' : x.status === 'received' ? 'Reçue' : x.status,
  date: x.created_at.slice(0, 10),
});

export async function listOrders(client: SupabaseClient): Promise<Order[]> {
  const { data, error } = await client
    .from('purchase_orders')
    .select('*, suppliers(name), purchase_order_items(count)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Chargement des commandes impossible : ${error.message}`);
  return (data || []).map((x) => mapOrder(x as OrderRow));
}

export async function listOrderLines(client: SupabaseClient): Promise<Map<string, OrderLine[]>> {
  const { data, error } = await client
    .from('purchase_order_items')
    .select('order_id,item_id,description,quantity,unit_price');
  if (error) throw new Error('Chargement des lignes de commande impossible');
  const linesByOrder = new Map<string, OrderLine[]>();
  (data || []).forEach((line) => {
    const lines = linesByOrder.get(line.order_id) || [];
    lines.push({
      item_id: line.item_id,
      description: line.description,
      quantity: line.quantity,
      unit_price: Number(line.unit_price),
    });
    linesByOrder.set(line.order_id, lines);
  });
  return linesByOrder;
}

export async function createOrder(client: SupabaseClient, draft: PurchaseOrderDraft) {
  const { data, error } = await client.rpc('create_purchase_order', {
    p_reference: draft.reference,
    p_supplier_id: draft.supplier_id,
    p_expected_date: draft.expected_date || null,
    p_items: draft.items,
  });
  return { id: typeof data === 'string' ? data : null, error };
}

export type ReceivedItem = { item_id: string; quantity: number; movement: Movement };

export async function receiveOrder(client: SupabaseClient, orderId: string, expectedLines: number) {
  const { data, error } = await client.rpc('receive_purchase_order', { p_order_id: orderId });
  if (error) return { received: null as ReceivedItem[] | null, error };
  if (typeof data !== 'object' || data === null || !('received_items' in data))
    return {
      received: null,
      error: { message: 'Réception non confirmée par la base. Rechargez les données avant de réessayer.' },
    };
  const received = data.received_items as ReceivedItem[];
  if (
    !Array.isArray(received) ||
    received.length !== expectedLines ||
    received.some(
      (line) =>
        typeof line.item_id !== 'string' ||
        typeof line.quantity !== 'number' ||
        typeof line.movement !== 'object' ||
        line.movement === null,
    )
  )
    return {
      received: null,
      error: { message: 'Réponse de réception invalide. Rechargez les données avant de réessayer.' },
    };
  return { received, error: null };
}
