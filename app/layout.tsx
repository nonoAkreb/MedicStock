import './globals.css';
import './auth.css';
import './dashboard-role.css';
import type { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'MediStock — Gestion des stocks pour centres de santé',
  description:
    'MediStock aide les centres de santé à suivre leurs stocks, lots, mouvements et échéances en temps réel. Moins de ruptures, moins de gaspillage, plus de temps pour les patients.',
  keywords: [
    'gestion de stock',
    'inventaire médical',
    'pharmacie',
    'centre de santé',
    'Afrique francophone',
  ],
  openGraph: {
    title: 'MediStock — Gestion des stocks pour centres de santé',
    description:
      'Suivi des lots, alertes de péremption et mouvements de stock pour les centres de santé.',
    type: 'website',
    locale: 'fr_FR',
  },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
