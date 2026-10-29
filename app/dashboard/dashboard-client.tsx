'use client';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatError } from '@/lib/errors';
import { ROLES } from '@/lib/dashboard/roles';
import dynamic from 'next/dynamic';
const NurseDashboard = dynamic(() =>
  import('@/components/dashboard/role-dashboards/nurse').then((m) => m.NurseDashboard),
);
const PharmacistDashboard = dynamic(() =>
  import('@/components/dashboard/role-dashboards/pharmacist').then((m) => m.PharmacistDashboard),
);
const AdminDashboard = dynamic(() =>
  import('@/components/dashboard/role-dashboards/admin').then((m) => m.AdminDashboard),
);
import { DashboardSkeleton } from '@/components/dashboard-skeleton';
import { PurchaseOrderForm, type PurchaseOrderDraft } from '@/components/dashboard/purchase-order-form';
import { TeamManagement } from '@/components/dashboard/team-management';
import { ItemFormModal } from '@/components/dashboard/modals/item-form';
import { MovementFormModal } from '@/components/dashboard/modals/movement-form';
import { SupplierFormModal } from '@/components/dashboard/modals/supplier-form';
import { LoginModal } from '@/components/dashboard/modals/login-modal';
import { InventoryPage } from '@/components/dashboard/pages/inventory-page';
import { MovementsPage } from '@/components/dashboard/pages/movements-page';
import { SuppliersPage } from '@/components/dashboard/pages/suppliers-page';
import { OrdersPage } from '@/components/dashboard/pages/orders-page';
import { SettingsPage } from '@/components/dashboard/pages/settings-page';
import { DashboardShell } from '@/components/dashboard/shell';
import { useCenterData } from './use-center-data';
import { categoryLabel } from '@/lib/dashboard/constants';
import { dateIn, uid } from '@/lib/dashboard/format';
import type { Item, Movement, Order, OrderLine } from '@/lib/dashboard/types';
import { archiveItem, upsertItem } from '@/lib/services/inventory';
import { updateCenter } from '@/lib/services/centers';
import { createSupplier } from '@/lib/services/suppliers';
import { createOrder, receiveOrder as receiveOrderRpc } from '@/lib/services/orders';
import { recordMovement } from '@/lib/services/movements';
import {
  ArrowLeftRight,
  Boxes,
  Check,
  ClipboardList,
  HandCoins,
  LayoutDashboard,
  Settings,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react';

export default function Home() {
  const {
    items,
    setItems,
    suppliers,
    setSuppliers,
    movements,
    setMovements,
    orders,
    setOrders,
    center,
    setCenter,
    expenses,
    profileCounts,
    role,
    setRole,
    name,
    setName,
    email,
    setEmail,
    authed,
    setAuthed,
    booting,
    dataError,
  } = useCenterData();
  const [page, setPage] = useState('dashboard');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState('');
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [toast, setToast] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [moveType, setMoveType] = useState<'in' | 'out'>('out');
  const [moveReason, setMoveReason] = useState('patient_dispense');
  const [moveItemId, setMoveItemId] = useState('');
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 3000);
    return () => clearTimeout(t);
  }, [toast]);
  const notify = (s: string) => setToast(s);
  const lowItems = useMemo(
    () => items.filter((i) => i.quantity <= i.min_threshold),
    [items],
  );
  const nav: { title: string; links: [string, string, LucideIcon][] }[] = useMemo(
    () =>
      role === ROLES.nurse
      ? [
          {
            title: 'ESPACE DE SOINS',
            links: [
              ['dashboard', 'Vue infirmier', LayoutDashboard],
              ['inventory', 'Disponibilité', Boxes],
              ['movements', 'Mes mouvements', ArrowLeftRight],
            ],
          },
        ]
      : role === ROLES.pharmacist
        ? [
            {
              title: 'GESTION DES STOCKS',
              links: [
                ['dashboard', 'Vue pharmacien', LayoutDashboard],
                ['inventory', 'Inventaire', Boxes],
                ['movements', 'Mouvements', ArrowLeftRight],
                ['suppliers', 'Fournisseurs', Truck],
                ['orders', 'Commandes', ClipboardList],
              ],
            },
          ]
        : [
            {
              title: 'DIRECTION',
              links: [
                ['dashboard', 'Vue d’ensemble', LayoutDashboard],
                ['finances', 'Finances', HandCoins],
                ['inventory', 'Inventaire', Boxes],
                ['movements', 'Mouvements', ArrowLeftRight],
                ['suppliers', 'Fournisseurs', Truck],
                ['orders', 'Commandes', ClipboardList],
              ],
            },
            {
              title: 'ADMINISTRATION',
              links: [
                ['team', 'Utilisateurs', Users],
                ['settings', 'Paramètres', Settings],
              ],
            },
          ],
    [role],
  );
  const doLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setAuthError('');
    const f = new FormData(e.currentTarget);
    if (!supabase) {
      setAuthed(true);
      setName(String(f.get('email')).split('@')[0]);
      setEmail(String(f.get('email')));
      setRole(String(f.get('role')));
      setModal('');
      notify('Session de démonstration ouverte');
      setBusy(false);
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get('email')),
      password: String(f.get('password')),
    });
    if (error) setAuthError(formatError(error));
    else {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const { data: p } = await supabase
        .from('profiles')
        .select('*, center:health_centers(name, city, currency, alert_days_before, health_departments(name))')
        .eq('id', session?.user.id)
        .maybeSingle();
      if (p?.access_status !== 'approved' || !p?.center_id) {
        window.location.assign('/pending');
        return;
      }
      if (p?.center)
        setCenter({
          id: p.center_id,
          name: p.center.name,
          city: p.center.city,
          currency: p.center.currency,
          alert_days_before: p.center.alert_days_before,
          department_name: p.center.health_departments?.name,
        });
      setName(p?.full_name || String(f.get('email')));
      setRole(p?.role || 'nurse');
      setAuthed(true);
      setEmail(String(f.get('email')));
      setModal('');
      notify('Connexion réussie');
    }
    setBusy(false);
  };
  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setAuthed(false);
    setName('Aïcha Koné');
    setEmail('');
    notify('Vous êtes déconnecté');
    if (supabase) window.location.assign('/login');
  };
  const saveItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const f = new FormData(e.currentTarget);
      const supplier = suppliers.find((s) => s.id === String(f.get('supplier_id')));
      if (supabase) {
        const row = {
          name: String(f.get('name')),
          category: String(f.get('category')) as Item['category'],
          sku_batch: String(f.get('sku_batch')),
          expiration_date: String(f.get('expiration_date')) || null,
          supplier_id: String(f.get('supplier_id')) || null,
          quantity: Number(f.get('quantity')),
          min_threshold: Number(f.get('min_threshold')),
          price: Number(f.get('price')),
        };
        const { item, error } = await upsertItem(supabase, row, editItem?.id);
        if (error || !item) {
          notify(formatError(error));
          return;
        }
        setItems((prev) =>
          editItem ? prev.map((x) => (x.id === item.id ? item : x)) : [item, ...prev],
        );
      } else {
        const payload: Item = {
          id: editItem?.id || uid(),
          name: String(f.get('name')),
          category: String(f.get('category')) as Item['category'],
          sku_batch: String(f.get('sku_batch')),
          expiration_date: String(f.get('expiration_date')) || null,
          supplier_id: String(f.get('supplier_id')) || null,
          quantity: Number(f.get('quantity')),
          min_threshold: Number(f.get('min_threshold')),
          price: Number(f.get('price')),
          created_at: editItem?.created_at || new Date().toISOString(),
          supplier_name: supplier?.name,
        };
        setItems((prev) =>
          editItem ? prev.map((x) => (x.id === editItem.id ? payload : x)) : [payload, ...prev],
        );
      }
      setModal('');
      setEditItem(null);
      notify(editItem ? 'Article mis à jour' : 'Article ajouté à l’inventaire');
    } finally {
      setBusy(false);
    }
  };
  const removeItem = async (id: string) => {
    if (!confirm('Archiver cet article de l’inventaire ?')) return;
    if (busy) return;
    setBusy(true);
    try {
      if (supabase) {
        const { error } = await archiveItem(supabase, id);
        if (error) {
          notify('Archivage impossible : ' + formatError(error));
          return;
        }
      }
      setItems((v) => v.filter((x) => x.id !== id));
      notify('Article archivé');
    } finally {
      setBusy(false);
    }
  };
  const stockMove = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const f = new FormData(e.currentTarget);
      const iid = String(f.get('item_id'));
      const qty = Number(f.get('quantity'));
      const typ = String(f.get('type')) as 'in' | 'out';
      const item = items.find((x) => x.id === iid);
      if (!item) return;
      if (typ === 'out' && qty > item.quantity) {
        notify('Stock insuffisant pour cette sortie');
        return;
      }
      const next = typ === 'in' ? item.quantity + qty : item.quantity - qty;
      const reason = String(f.get('reason'));
      const moved: Movement = {
        id: uid(),
        item_id: iid,
        type: typ,
        quantity: qty,
        reason,
        created_at: new Date().toISOString(),
        item_name: item.name,
        user_name: name,
      };
      setItems((xs) => xs.map((x) => (x.id === iid ? { ...x, quantity: next } : x)));
      setMovements((xs) => [moved, ...xs]);
      if (supabase) {
        const { movement: m, error } = await recordMovement(supabase, {
          itemId: iid,
          type: typ,
          quantity: qty,
          reason,
        });
        if (error) {
          setItems((xs) => xs.map((x) => (x.id === iid ? { ...x, quantity: item.quantity } : x)));
          setMovements((xs) => xs.filter((x) => x.id !== moved.id));
          notify('Mouvement annulé : ' + formatError(error));
          return;
        }
        if (m)
          setMovements((xs) =>
            xs.map((x) =>
              x.id === moved.id ? { ...moved, ...m, item_name: item.name, user_name: name } : x,
            ),
          );
      }
      setModal('');
      notify(typ === 'in' ? 'Entrée enregistrée' : 'Sortie enregistrée — stock mis à jour');
    } finally {
      setBusy(false);
    }
  };
  const saveSupplier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const f = new FormData(e.currentTarget);
      if (supabase) {
        const { supplier, error } = await createSupplier(supabase, {
          name: String(f.get('name')),
          contact_name: String(f.get('contact_name')),
          email: String(f.get('email')),
          phone: String(f.get('phone')),
        });
        if (error || !supplier) {
          notify(formatError(error));
          return;
        }
        setSuppliers((x) => [supplier, ...x]);
      } else {
        setSuppliers((x) => [
          {
            id: uid(),
            name: String(f.get('name')),
            contact_name: String(f.get('contact_name')),
            email: String(f.get('email')),
            phone: String(f.get('phone')),
          },
          ...x,
        ]);
      }
      setModal('');
      notify('Fournisseur ajouté au répertoire');
    } finally {
      setBusy(false);
    }
  };
  const buildOrder = (draft: PurchaseOrderDraft, id: string, amount: number): Order => ({
    id,
    reference: draft.reference,
    supplier: suppliers.find((s) => s.id === draft.supplier_id)!.name,
    items: draft.items.length,
    amount,
    status: 'En transit',
    date: new Date().toISOString().slice(0, 10),
    lines: draft.items.map((line) => ({
      item_id: line.item_id,
      description: items.find((item) => item.id === line.item_id)?.name || '',
      quantity: line.quantity,
      unit_price: line.unit_price,
    })),
  });
  const saveOrder = async (draft: PurchaseOrderDraft) => {
    if (busy) return;
    setBusy(true);
    try {
      if (
        !draft.items.length ||
        draft.items.some(
          (line) =>
            !line.item_id ||
            !Number.isInteger(line.quantity) ||
            line.quantity <= 0 ||
            !Number.isFinite(line.unit_price) ||
            line.unit_price < 0,
        )
      ) {
        notify('Vérifiez les lignes de commande.');
        return;
      }
      if (!suppliers.find((s) => s.id === draft.supplier_id)) {
        notify('Sélectionnez un fournisseur valide.');
        return;
      }
      const amount = draft.items.reduce(
        (total, line) => total + line.quantity * line.unit_price,
        0,
      );
      if (supabase) {
        const { id, error } = await createOrder(supabase, draft);
        if (error) {
          notify('Erreur : ' + formatError(error));
          return;
        }
        if (!id) {
          notify('La base n’a pas confirmé la création de la commande.');
          return;
        }
        setOrders((current) => [buildOrder(draft, id, amount), ...current]);
      } else {
        setOrders((current) => [buildOrder(draft, uid(), amount), ...current]);
      }
      setModal('');
      notify('Commande enregistrée');
    } finally {
      setBusy(false);
    }
  };
  const receiveOrder = async (o: Order) => {
    if (busy) return;
    setBusy(true);
    try {
      if (o.status !== 'En transit' || !o.lines?.length || o.lines.some((line) => !line.item_id)) {
        notify('Réception impossible : une ligne ne référence aucun article de stock.');
        return;
      }
      if (supabase) {
        const { received, error } = await receiveOrderRpc(supabase, o.id, o.lines.length);
        if (error || !received) {
          notify('Réception refusée : ' + formatError(error));
          return;
        }
        setItems((current) =>
          current.map((item) => {
            const line = received.filter((entry) => entry.item_id === item.id).pop();
            return line ? { ...item, quantity: line.quantity } : item;
          }),
        );
        setMovements((current) => [
          ...received.map((line) => ({
            ...line.movement,
            item_name:
              o.lines?.find((orderLine) => orderLine.item_id === line.item_id)?.description || '',
            user_name: name,
          })),
          ...current,
        ]);
      } else {
        const additions = o.lines.map((line) => ({
          line,
          item: items.find((entry) => entry.id === line.item_id),
        }));
        const missing = additions.find((entry) => !entry.item);
        if (missing) {
          notify(`Article introuvable : ${missing.line.description}`);
          return;
        }
        const validAdditions = additions.filter(
          (entry): entry is { line: OrderLine; item: Item } => !!entry.item,
        );
        setItems((current) =>
          current.map((item) => {
            const quantity = validAdditions
              .filter((entry) => entry.item.id === item.id)
              .reduce((total, entry) => total + entry.line.quantity, 0);
            return quantity ? { ...item, quantity: item.quantity + quantity } : item;
          }),
        );
        setMovements((current) => [
          ...validAdditions.map(({ item, line }) => ({
            id: uid(),
            item_id: item.id,
            type: 'in' as const,
            quantity: line.quantity,
            reason: 'delivery',
            created_at: new Date().toISOString(),
            item_name: item.name,
            user_name: name,
          })),
          ...current,
        ]);
      }
      setOrders((current) =>
        current.map((order) => (order.id === o.id ? { ...order, status: 'Reçue' } : order)),
      );
      notify('Commande réceptionnée : stock et mouvements mis à jour');
    } finally {
      setBusy(false);
    }
  };
  const switchPage = (p: string) => {
    setPage(p);
    setMobileOpen(false);
    setQuery('');
    setFilter('all');
  };
  const openMove = (itemId: string, type: 'in' | 'out', reason: string) => {
    setMoveItemId(itemId || items[0]?.id || '');
    setMoveType(type);
    setMoveReason(reason);
    setModal('movement');
  };
  const exportReport = () => {
    const rows = [
      [
        'Article',
        'Catégorie',
        'Lot',
        'Quantité',
        'Seuil',
        'Expiration',
        'Fournisseur',
        'Valeur XOF',
      ],
      ...items.map((i) => [
        i.name,
        categoryLabel[i.category],
        i.sku_batch,
        String(i.quantity),
        String(i.min_threshold),
        i.expiration_date || '',
        i.supplier_name || suppliers.find((s) => s.id === i.supplier_id)?.name || '',
        String(i.quantity * i.price),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => '"' + String(c).replaceAll('"', '""') + '"').join(';'))
      .join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `medistock-rapport-${dateIn(0)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    notify('Rapport CSV téléchargé');
  };
  const saveCenter = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const f = new FormData(e.currentTarget);
      const next = {
        name: String(f.get('name')),
        city: String(f.get('city')) || null,
        currency: String(f.get('currency')),
        alertDaysBefore: Number(f.get('alert_days_before')),
      };
      if (supabase) {
        const { center: updated, error } = await updateCenter(supabase, next);
        if (error || !updated) {
          notify(formatError(error));
          return;
        }
        setCenter({ ...updated, department_name: center?.department_name });
      } else if (center) {
        setCenter({ ...center, ...next, alert_days_before: next.alertDaysBefore });
      }
      notify('Préférences enregistrées');
    } finally {
      setBusy(false);
    }
  };
  if (dataError)
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <div className="auth-intro">
            <div className="auth-kicker">CHARGEMENT DES DONNÉES</div>
            <h1>Données indisponibles</h1>
            <p role="alert">{dataError}</p>
            <p>
              Aucune donnée fictive n’est affichée. Les actions sur le stock sont désactivées tant
              que les données ne peuvent pas être chargées.
            </p>
          </div>
          <button className="auth-submit" type="button" onClick={() => window.location.reload()}>
            Réessayer
          </button>
        </div>
      </main>
    );
  const dashboardProps = {
    role,
    name,
    items,
    movements,
    profileCounts,
    expenses,
    onMove: openMove,
    onNavigate: switchPage,
    onExport: exportReport,
  };
  return (
    <DashboardShell
      center={center}
      nav={nav}
      page={page}
      onNavigate={switchPage}
      lowCount={lowItems.length}
      name={name}
      role={role}
      authed={authed}
      isLive={!!supabase}
      mobileOpen={mobileOpen}
      onToggleMobile={() => setMobileOpen(!mobileOpen)}
      onBell={() =>
        notify(
          lowItems.length ? `${lowItems.length} alerte(s) de stock bas` : 'Aucune nouvelle alerte',
        )
      }
      onLoginClick={() => (supabase ? window.location.assign('/login') : setModal('login'))}
      onLogout={logout}
      overlays={
        <>
          {modal === 'item' && (
            <ItemFormModal
              editItem={editItem}
              suppliers={suppliers}
              busy={busy}
              onSubmit={saveItem}
              onClose={() => setModal('')}
              onRemove={removeItem}
            />
          )}
          {modal === 'movement' && (
            <MovementFormModal
              items={items}
              role={role}
              moveItemId={moveItemId}
              moveType={moveType}
              moveReason={moveReason}
              busy={busy}
              onSubmit={stockMove}
              onClose={() => setModal('')}
            />
          )}
          {modal === 'supplier' && (
            <SupplierFormModal busy={busy} onSubmit={saveSupplier} onClose={() => setModal('')} />
          )}
          {modal === 'order' && (
            <div
              className="modal-backdrop"
              onMouseDown={(e) => e.target === e.currentTarget && !busy && setModal('')}
            >
              <PurchaseOrderForm
                initialReference={`CMD-${new Date().getFullYear()}-${String(orders.length + 87).padStart(3, '0')}`}
                suppliers={suppliers}
                items={items}
                onSubmit={saveOrder}
                onCancel={() => setModal('')}
                busy={busy}
              />
            </div>
          )}
          {modal === 'login' && (
            <LoginModal
              isLive={!!supabase}
              email={email}
              authError={authError}
              busy={busy}
              onSubmit={doLogin}
              onClose={() => setModal('')}
            />
          )}
          {toast && (
            <div className="toast">
              <Check size={16} />
              {toast}
            </div>
          )}
          {booting && (
            <div className="dashboard-loading-overlay">
              <div className="dashboard-loading-inner">
                <DashboardSkeleton />
              </div>
            </div>
          )}
        </>
      }
    >
      {page === 'dashboard' &&
        (role === ROLES.nurse ? (
          <NurseDashboard {...dashboardProps} />
        ) : role === ROLES.pharmacist ? (
          <PharmacistDashboard {...dashboardProps} />
        ) : (
          <AdminDashboard {...dashboardProps} />
        ))}
      {page === 'finances' && role === ROLES.admin && <AdminDashboard {...dashboardProps} />}
      {page === 'inventory' && (
        <InventoryPage
          items={items}
          role={role}
          suppliers={suppliers}
          onNewItem={() => {
            setEditItem(null);
            setModal('item');
          }}
          onEditItem={(i) => {
            setEditItem(i);
            setModal('item');
          }}
          onExport={exportReport}
          onNotify={notify}
        />
      )}
      {page === 'movements' && (
        <MovementsPage
          movements={movements}
          items={items}
          name={name}
          onNewMovement={() => setModal('movement')}
        />
      )}
      {page === 'suppliers' && (
        <SuppliersPage
          query={query}
          onQueryChange={setQuery}
          suppliers={suppliers}
          items={items}
          onNewSupplier={() => setModal('supplier')}
          onNotify={notify}
        />
      )}
      {page === 'orders' && (
        <OrdersPage
          query={query}
          onQueryChange={setQuery}
          orders={orders}
          suppliers={suppliers}
          items={items}
          onNewOrder={() => setModal('order')}
          onReceive={receiveOrder}
        />
      )}
      {page === 'team' && role === ROLES.admin && <TeamManagement />}
      {page === 'settings' && (
        <SettingsPage
          key={center?.id || 'center'}
          isLive={!!supabase}
          center={center}
          busy={busy}
          onSave={saveCenter}
        />
      )}
    </DashboardShell>
  );
}
