export const dateIn = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
export const uid = () => Math.random().toString(36).slice(2, 10);
export const money = (n: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0,
  }).format(n);
export const shortDate = (s: string | null) =>
  s
    ? new Date(s + 'T12:00:00').toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '—';
export const ago = (s: string) => {
  const h = Math.max(1, Math.floor((Date.now() - new Date(s).getTime()) / 3600000));
  return h < 24 ? `Il y a ${h} h` : `Il y a ${Math.floor(h / 24)} j`;
};
