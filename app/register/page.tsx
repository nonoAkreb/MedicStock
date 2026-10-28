import Link from 'next/link';
import { Activity, ArrowLeft, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  return (
    <main className="auth-shell">
      <div className="auth-card">
        <Link className="auth-brand" href="/">
          <span className="auth-brand-icon"><Activity size={20} strokeWidth={2.5} /></span>
          <span>MediStock<small>GESTION DES CENTRES DE SANTÉ</small></span>
        </Link>
        <div className="auth-intro">
          <div className="auth-kicker">DEMANDE D’ACCÈS</div>
          <h1>Accès sur approbation</h1>
          <p>Les comptes sont créés et rattachés à un centre de santé par un administrateur autorisé.</p>
        </div>
        <div className="auth-success">
          <div className="auth-success-icon"><ShieldCheck size={22} /></div>
          <h2>Inscription libre désactivée</h2>
          <p>Contactez l’administrateur de votre centre pour demander la création de votre compte. Votre accès devra être approuvé avant de consulter les données.</p>
        </div>
        <div className="auth-bottom">
          <Link href="/login"><ArrowLeft size={13} /> Retour à la connexion</Link>
        </div>
        <div className="auth-secure"><ShieldCheck size={14} /> Accès protégé par approbation et contrôle des rôles</div>
      </div>
      <div className="auth-copyright">© 2026 MediStock</div>
    </main>
  );
}
