export type Item = {
  id: string;
  name: string;
  category: 'medication' | 'ppe' | 'surgical' | 'other';
  sku_batch: string;
  expiration_date: string | null;
  supplier_id: string | null;
  quantity: number;
  min_threshold: number;
  price: number;
  created_at: string;
  supplier_name?: string;
};
export type Supplier = { id: string; name: string; contact_name: string; email: string; phone: string };
export type Movement = {
  id: string;
  item_id: string;
  user_id?: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  created_at: string;
  item_name?: string;
  user_name?: string;
};
export type OrderLine = {
  item_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
};
export type Order = {
  id: string;
  reference: string;
  supplier: string;
  items: number;
  amount: number;
  status: string;
  date: string;
  lines?: OrderLine[];
};
export type Center = {
  id: string;
  name: string;
  city: string | null;
  currency: string;
  alert_days_before: number;
  department_name?: string | null;
};
