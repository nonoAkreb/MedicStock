import type { Item, Movement, Order, Supplier } from './types';
import { dateIn } from './format';

export const suppliersSeed: Supplier[] = [
  {
    id: 's1',
    name: 'Laborex Côte d’Ivoire',
    contact_name: 'Aminata Koné',
    email: 'commandes@laborex.ci',
    phone: '+225 27 22 44 18 20',
  },
  {
    id: 's2',
    name: 'Copharmed',
    contact_name: 'Jean-Marc Yao',
    email: 'ventes@copharmed.ci',
    phone: '+225 27 21 75 90 10',
  },
  {
    id: 's3',
    name: 'Medline Afrique',
    contact_name: 'Fatou Diabaté',
    email: 'contact@medline.ci',
    phone: '+225 07 09 32 11 40',
  },
  {
    id: 's4',
    name: 'Pharmivoire',
    contact_name: 'Koffi N’Guessan',
    email: 'pro@pharmivoire.ci',
    phone: '+225 27 20 30 44 08',
  },
];
export const makeItems = (): Item[] => [
  {
    id: 'i1',
    name: 'Amoxicilline 500 mg',
    category: 'medication',
    sku_batch: 'AMX-2408-B12',
    expiration_date: dateIn(21),
    supplier_id: 's1',
    quantity: 124,
    min_threshold: 100,
    price: 1850,
    created_at: dateIn(-30),
  },
  {
    id: 'i2',
    name: 'Gants chirurgicaux stériles',
    category: 'ppe',
    sku_batch: 'GCS-2409-L04',
    expiration_date: dateIn(212),
    supplier_id: 's3',
    quantity: 42,
    min_threshold: 60,
    price: 250,
    created_at: dateIn(-26),
  },
  {
    id: 'i3',
    name: 'Seringues 5 ml (boîte de 100)',
    category: 'surgical',
    sku_batch: 'SRG-2410-A27',
    expiration_date: dateIn(530),
    supplier_id: 's2',
    quantity: 86,
    min_threshold: 40,
    price: 5200,
    created_at: dateIn(-19),
  },
  {
    id: 'i4',
    name: 'Paracétamol 1 g',
    category: 'medication',
    sku_batch: 'PAR-2411-C08',
    expiration_date: dateIn(56),
    supplier_id: 's4',
    quantity: 18,
    min_threshold: 50,
    price: 1200,
    created_at: dateIn(-17),
  },
  {
    id: 'i5',
    name: 'Masques chirurgicaux Type IIR',
    category: 'ppe',
    sku_batch: 'MCH-2407-D18',
    expiration_date: dateIn(92),
    supplier_id: 's3',
    quantity: 230,
    min_threshold: 150,
    price: 90,
    created_at: dateIn(-14),
  },
  {
    id: 'i6',
    name: 'Sutures résorbables 3/0',
    category: 'surgical',
    sku_batch: 'SUT-2406-E03',
    expiration_date: dateIn(12),
    supplier_id: 's2',
    quantity: 9,
    min_threshold: 15,
    price: 3400,
    created_at: dateIn(-12),
  },
  {
    id: 'i7',
    name: 'Solution hydroalcoolique 500 ml',
    category: 'other',
    sku_batch: 'SHA-2410-F05',
    expiration_date: dateIn(340),
    supplier_id: 's1',
    quantity: 76,
    min_threshold: 30,
    price: 2200,
    created_at: dateIn(-10),
  },
  {
    id: 'i8',
    name: 'Ceftriaxone 1 g injectable',
    category: 'medication',
    sku_batch: 'CTX-2405-A11',
    expiration_date: dateIn(63),
    supplier_id: 's4',
    quantity: 24,
    min_threshold: 35,
    price: 6800,
    created_at: dateIn(-8),
  },
  {
    id: 'i9',
    name: 'Compresses stériles 10×10',
    category: 'other',
    sku_batch: 'CMP-2411-B14',
    expiration_date: dateIn(180),
    supplier_id: 's3',
    quantity: 315,
    min_threshold: 100,
    price: 75,
    created_at: dateIn(-6),
  },
];
export const initialMovements: Movement[] = [
  {
    id: 'm1',
    item_id: 'i1',
    type: 'in',
    quantity: 80,
    reason: 'delivery',
    created_at: new Date(Date.now() - 1000 * 60 * 38).toISOString(),
    item_name: 'Amoxicilline 500 mg',
    user_name: 'A. Koné',
  },
  {
    id: 'm2',
    item_id: 'i4',
    type: 'out',
    quantity: 12,
    reason: 'patient_dispense',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    item_name: 'Paracétamol 1 g',
    user_name: 'M. Traoré',
  },
  {
    id: 'm3',
    item_id: 'i6',
    type: 'out',
    quantity: 4,
    reason: 'department_transfer',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    item_name: 'Sutures résorbables 3/0',
    user_name: 'A. Koné',
  },
  {
    id: 'm4',
    item_id: 'i2',
    type: 'in',
    quantity: 30,
    reason: 'delivery',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    item_name: 'Gants chirurgicaux stériles',
    user_name: 'S. Diomandé',
  },
  {
    id: 'm5',
    item_id: 'i8',
    type: 'out',
    quantity: 6,
    reason: 'patient_dispense',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    item_name: 'Ceftriaxone 1 g injectable',
    user_name: 'M. Traoré',
  },
];
export const orderSeed: Order[] = [
  {
    id: 'o1',
    reference: 'CMD-2026-086',
    supplier: 'Laborex Côte d’Ivoire',
    items: 1,
    amount: 55500,
    status: 'En transit',
    date: dateIn(-2),
    lines: [{ item_id: 'i1', description: 'Amoxicilline 500 mg', quantity: 30, unit_price: 1850 }],
  },
  {
    id: 'o2',
    reference: 'CMD-2026-085',
    supplier: 'Copharmed',
    items: 1,
    amount: 12500,
    status: 'Reçue',
    date: dateIn(-5),
    lines: [
      { item_id: 'i2', description: 'Gants chirurgicaux stériles', quantity: 50, unit_price: 250 },
    ],
  },
  {
    id: 'o3',
    reference: 'CMD-2026-084',
    supplier: 'Medline Afrique',
    items: 1,
    amount: 62400,
    status: 'Reçue',
    date: dateIn(-12),
    lines: [
      {
        item_id: 'i3',
        description: 'Seringues 5 ml (boîte de 100)',
        quantity: 12,
        unit_price: 5200,
      },
    ],
  },
];
export const DEMO_KEY = 'medistock-demo';
export type DemoData = { items: Item[]; suppliers: Supplier[]; movements: Movement[]; orders: Order[] };

export function loadDemo(): DemoData | null {
  const raw = localStorage.getItem(DEMO_KEY);
  if (!raw) return null;
  const saved: unknown = JSON.parse(raw);
  if (typeof saved !== 'object' || saved === null || Array.isArray(saved))
    throw new Error('Format du stockage de démonstration invalide.');
  const data = saved as Partial<DemoData>;
  if (
    !Array.isArray(data.items) ||
    !Array.isArray(data.suppliers) ||
    !Array.isArray(data.movements) ||
    !Array.isArray(data.orders)
  )
    throw new Error('Données de démonstration incomplètes.');
  return data as DemoData;
}

export function saveDemo(data: DemoData) {
  localStorage.setItem(DEMO_KEY, JSON.stringify(data));
}
