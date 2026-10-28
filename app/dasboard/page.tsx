import { redirect } from 'next/navigation';

// Compatibilité avec l’ancienne URL mal orthographiée « /dasboard ».
export default function LegacyDashboardRedirect() {
  redirect('/dashboard');
}
