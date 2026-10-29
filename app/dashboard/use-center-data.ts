'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatError } from '@/lib/errors';
import type { Item, Movement, Order, Supplier } from '@/lib/dashboard/types';
import { initialMovements, loadDemo, makeItems, orderSeed, saveDemo, suppliersSeed } from '@/lib/dashboard/demo';
import { listItems } from '@/lib/services/inventory';
import { listSuppliers } from '@/lib/services/suppliers';
import { listMovements, listExpenseRows } from '@/lib/services/movements';
import { listOrders, listOrderLines } from '@/lib/services/orders';
import { getOwnProfile, listProfileRoles } from '@/lib/services/profiles';

export function useCenterData() {
  const [items, setItems] = useState<Item[]>(() => (supabase ? [] : makeItems()));
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => (supabase ? [] : suppliersSeed));
  const [movements, setMovements] = useState<Movement[]>(() => (supabase ? [] : initialMovements));
  const [orders, setOrders] = useState<Order[]>(() => (supabase ? [] : orderSeed));
  const [role, setRole] = useState('pharmacist');
  const [name, setName] = useState('Aïcha Koné');
  const [email, setEmail] = useState('');
  const [authed, setAuthed] = useState(false);
  const [booting, setBooting] = useState(true);
  const [dataError, setDataError] = useState('');
  const [profileCounts, setProfileCounts] = useState({ admin: 0, pharmacist: 0, nurse: 0 });
  const [expenses, setExpenses] = useState<{ label: string; value: number }[]>(() =>
    Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - 5 + i);
      return { label: d.toLocaleDateString('fr-FR', { month: 'short' }), value: 0 };
    }),
  );
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (supabase) {
          const {
            data: { session: initialSession },
            error: sessionError,
          } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          let session = initialSession;
          if (!session) {
            const { data: refreshData, error } = await supabase.auth.refreshSession();
            if (error) throw error;
            session = refreshData.session;
          }
          if (!session) {
            window.location.replace('/login?error=session');
            return;
          }
          setAuthed(true);
          setEmail(session.user.email || '');
          const { profile: p, error: profileError } = await getOwnProfile(
            supabase,
            session.user.id,
          );
          if (profileError)
            throw new Error(`Chargement du profil impossible : ${profileError.message}`);
          if (p?.access_status !== 'approved') {
            window.location.replace('/pending');
            return;
          }
          if (!p) throw new Error('Profil utilisateur introuvable.');
          setName(p.full_name || session.user.email || 'Utilisateur');
          setRole(p.role || 'nurse');
          const nextProfileCounts = { admin: 0, pharmacist: 0, nurse: 0 };
          let nextExpenses = expenses;
          if (p.role === 'admin') {
            const firstMonth = new Date();
            firstMonth.setDate(1);
            firstMonth.setMonth(firstMonth.getMonth() - 5);
            firstMonth.setHours(0, 0, 0, 0);
            const [rolesResult, outRows] = await Promise.all([
              listProfileRoles(supabase),
              listExpenseRows(supabase, firstMonth.toISOString()),
            ]);
            if (rolesResult.error)
              throw new Error(`Chargement des profils impossible : ${rolesResult.error.message}`);
            rolesResult.roles.forEach((u) => {
              if (u.role in nextProfileCounts)
                nextProfileCounts[u.role as keyof typeof nextProfileCounts]++;
            });
            const series = Array.from({ length: 6 }, (_, i) => {
              const d = new Date();
              d.setDate(1);
              d.setMonth(d.getMonth() - 5 + i);
              return {
                key: `${d.getFullYear()}-${d.getMonth()}`,
                label: d.toLocaleDateString('fr-FR', { month: 'short' }),
                value: 0,
              };
            });
            outRows.forEach((r) => {
              const d = new Date(r.created_at);
              const entry = series.find((s) => s.key === `${d.getFullYear()}-${d.getMonth()}`);
              if (entry) entry.value += Number(r.quantity) * Number(r.unit_price || 0);
            });
            nextExpenses = series.map(({ label, value }) => ({ label, value }));
          }
          const [it, sp, mv, od] = await Promise.all([
            listItems(supabase),
            listSuppliers(supabase),
            listMovements(supabase),
            listOrders(supabase),
          ]);
          if (!active) return;
          setProfileCounts(nextProfileCounts);
          setExpenses(nextExpenses);
          setItems(it);
          setSuppliers(sp);
          setMovements(mv);
          setOrders(od);
        } else {
          const saved = loadDemo();
          if (saved) {
            setItems(saved.items);
            setSuppliers(saved.suppliers);
            setMovements(saved.movements);
            setOrders(saved.orders);
          }
        }
      } catch (error) {
        if (!active) return;
        setItems([]);
        setSuppliers([]);
        setMovements([]);
        setOrders([]);
        setDataError(formatError(error));
      } finally {
        if (active) setBooting(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (supabase || booting || dataError) return;
    try {
      saveDemo({ items, suppliers, movements, orders });
    } catch (error) {
      queueMicrotask(() =>
        setDataError('Enregistrement de la démo impossible : ' + formatError(error)),
      );
    }
  }, [items, suppliers, movements, orders, booting, dataError]);
  useEffect(() => {
    const client = supabase;
    if (!client || booting || dataError) return;
    let active = true;
    const loadLines = async () => {
      const linesByOrder = await listOrderLines(client);
      if (!active) return;
      setOrders((current) =>
        current.map((order) => ({ ...order, lines: linesByOrder.get(order.id) || [] })),
      );
    };
    void loadLines().catch((error) => {
      if (active)
        setDataError(
          error instanceof Error
            ? formatError(error)
            : 'Chargement des lignes de commande impossible.',
        );
    });
    return () => {
      active = false;
    };
  }, [booting, dataError]);
  return {
    items,
    setItems,
    suppliers,
    setSuppliers,
    movements,
    setMovements,
    orders,
    setOrders,
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
    setDataError,
  };
}
