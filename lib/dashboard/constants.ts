import { t } from '@/lib/i18n';
export const categoryLabel: Record<string, string> = { ...t.category };
export const pageTitle: Record<string, string> = {
  dashboard: t.nav.dashboard,
  inventory: t.nav.inventory,
  movements: t.nav.movements,
  suppliers: t.nav.suppliers,
  orders: t.nav.orders,
  finances: t.nav.finances,
  team: t.nav.team,
  settings: t.nav.settings,
};
export const reasonLabel: Record<string, string> = { ...t.reason };
