import './globals.css';
import './auth.css';
import './dashboard-role.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'MediStock — Gestion des stocks', description: 'Gestion des stocks et inventaires pour votre centre de santé.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="fr"><body>{children}</body></html>; }
