import { ROLES, roleLabel, type Role } from '@/lib/dashboard/roles';
import { useState } from 'react';
import {
  Bell,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Hospital,
  LogOut,
  Menu,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import { pageTitle } from '@/lib/dashboard/constants';
import type { Center } from '@/lib/dashboard/types';

export function DashboardShell({
  center,
  nav,
  page,
  onNavigate,
  lowCount,
  name,
  role,
  authed,
  isLive,
  mobileOpen,
  onToggleMobile,
  onBell,
  onLoginClick,
  onLogout,
  children,
  overlays,
}: {
  center: Center | null;
  nav: { title: string; links: [string, string, LucideIcon][] }[];
  page: string;
  onNavigate: (p: string) => void;
  lowCount: number;
  name: string;
  role: string;
  authed: boolean;
  isLive: boolean;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  onBell: () => void;
  onLoginClick: () => void;
  onLogout: () => void;
  children: React.ReactNode;
  overlays: React.ReactNode;
}) {
  const [today] = useState(() => new Date(new Date().toDateString()));
  return (
    <div className="app-shell">
      <aside className={'sidebar ' + (mobileOpen ? 'open' : '')}>
        <div className="brand">
          <div className="brand-mark">
            <Plus size={22} strokeWidth={3} />
          </div>
          <div>
            MediStock<small>{(center?.name || 'Centre de santé').toUpperCase()}</small>
          </div>
        </div>
        {nav.map((group) => (
          <div key={group.title}>
            <div className="nav-label">{group.title}</div>
            {group.links.map(([id, label, Icon]) => (
              <button
                key={id}
                className={'nav-item ' + (page === id ? 'active' : '')}
                onClick={() => onNavigate(id)}
              >
                <Icon size={17} />
                {label}
                {id === 'inventory' && lowCount > 0 && (
                  <span className="nav-badge">{lowCount}</span>
                )}
              </button>
            ))}
          </div>
        ))}
        <div className="sidebar-bottom">
          <div className="clinic-card">
            <div className="clinic-icon">
              <Hospital size={17} />
            </div>
            <div>
              <b>{center?.name || 'Centre de santé'}</b>
              <span>{center?.city || center?.department_name || '—'}</span>
            </div>
            <ChevronDown size={14} color="#9cb0b3" style={{ marginLeft: 'auto' }} />
          </div>
          <div className="profile">
            <div className="avatar">
              {name
                .split(' ')
                .map((x) => x[0])
                .slice(0, 2)
                .join('')
                .toUpperCase()}
            </div>
            <div>
              <b>{name}</b>
              <small>
                {role === 'admin'
                  ? 'Administrateur'
                  : role === 'pharmacist'
                    ? 'Pharmacien'
                    : 'Infirmier'}
              </small>
            </div>
            <button
              className="profile-menu"
              aria-label="Déconnexion"
              onClick={onLogout}
              style={{ background: 'none', border: 0 }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <button className="icon-btn mobile-menu" onClick={onToggleMobile}>
              <Menu size={17} />
            </button>
            <div className="breadcrumb">
              Centre de santé&nbsp; / &nbsp;<b>{pageTitle[page]}</b>
            </div>
          </div>
          <div className="top-actions">
            <div className="online">
              <i />
              {isLive ? (authed ? 'Connecté' : 'Authentification requise') : 'Mode démonstration'}
            </div>
            <button
              className="icon-btn"
              onClick={onBell}
            >
              <Bell size={16} />
              {lowCount > 0 && <span className="dot" />}
            </button>
            {!authed && (
              <button
                className="btn secondary"
                style={{ padding: '8px 11px' }}
                onClick={() => onLoginClick()}
              >
                Connexion
              </button>
            )}
          </div>
        </header>
        <main className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">CENTRE DE SANTÉ · ABIDJAN</div>
              <h1>
                {page === 'dashboard' ? 'Bonjour, ' + name.split(' ')[0] + ' 👋' : pageTitle[page]}
              </h1>
              <p>
                {page === 'dashboard'
                  ? 'Voici l’état de vos stocks et les points à surveiller aujourd’hui.'
                  : page === 'inventory'
                    ? 'Gérez les médicaments, consommables et équipements du centre.'
                    : page === 'movements'
                      ? 'Suivez chaque entrée et sortie de vos stocks.'
                      : page === 'suppliers'
                        ? 'Vos partenaires d’approvisionnement en un seul endroit.'
                        : page === 'orders'
                          ? 'Suivez les commandes et livraisons en cours.'
                          : page === 'finances'
                            ? 'Supervisez la valeur du stock et les dépenses mensuelles.'
                            : 'Gérez les accès et préférences du centre.'}
              </p>
            </div>
            {page === 'dashboard' ? (
              <button className="date-chip">
                <CalendarDays size={14} />
                {today.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </button>
            ) : null}
          </div>
          {children}
          <footer
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '22px 2px 0',
              color: '#a0acad',
              fontSize: 9,
            }}
          >
            <span>© 2026 MediStock · {center?.name || 'Centre de santé'}</span>
            <span style={{ display: 'flex', gap: 14 }}>
              <span>
                <CircleHelp size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                Centre d’aide
              </span>
              <span>Version 1.0.0</span>
            </span>
          </footer>
        </main>
      </div>
      {overlays}
    </div>
  );
}
