'use client';
import Link from 'next/link';
import { useState } from 'react';
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarClock,
  Check,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  HeartPulse,
  Lock,
  Menu,
  Package,
  PackageCheck,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
  TriangleAlert,
  Truck,
  Users,
  X,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const contactEmail = 'nonoakreb@gmail.com';
const contactMailto = `mailto:${contactEmail}?subject=${encodeURIComponent('Demande de démonstration MediStock')}`;

const problems = [
  {
    icon: TriangleAlert,
    title: 'Ruptures de stock au mauvais moment',
    text: 'Un produit manquant pendant une consultation ou une urgence, c’est un soin retardé ou dégradé.',
  },
  {
    icon: CalendarClock,
    title: 'Péremptions qui passent inaperçues',
    text: 'Sans suivi des lots et des dates, des médicaments et des consommables partent à la destruction.',
  },
  {
    icon: ClipboardList,
    title: 'Inventaires manuels et chronophages',
    text: 'Cahiers, tableurs et comptages papier mobilisent les équipes et multiplient les erreurs de saisie.',
  },
  {
    icon: Search,
    title: 'Aucune visibilité en temps réel',
    text: 'Impossible de savoir qui a sorti quoi, quand, et pour quel motif — ni d’anticiper le réapprovisionnement.',
  },
];

const journeys = [
  {
    step: 'Créer un article',
    text: 'Nom, catégorie, numéro de lot, seuil d’alerte, prix et fournisseur : la fiche produit est prête en une minute.',
  },
  {
    step: 'Enregistrer un mouvement',
    text: 'Livraison, dispensation patient, transfert ou destruction : le stock se met à jour instantanément, avec le motif et l’utilisateur.',
  },
  {
    step: 'Recevoir les alertes',
    text: 'Stock bas ou date d’expiration proche : les articles à surveiller remontent dans le tableau de bord.',
  },
  {
    step: 'Commander et réceptionner',
    text: 'Créez une commande fournisseur, réceptionnez-la : les quantités et les prix d’achat sont intégrés au stock.',
  },
];

const benefits = [
  {
    icon: CalendarClock,
    title: 'Anticiper plutôt que subir',
    text: 'Suivi des lots et des dates d’expiration : les produits à risque sont visibles avant d’être perdus.',
    tone: 'mint',
  },
  {
    icon: ArrowDownRight,
    title: 'Tracer chaque mouvement',
    text: 'Livraisons, dispensations, transferts et destructions sont horodatés, motivés et rattachés à un utilisateur.',
    tone: 'blue',
  },
  {
    icon: Bell,
    title: 'Rester alerté sans surveiller',
    text: 'Seuils de réapprovisionnement et échéances remontent en alerte — pas besoin de vérifier chaque ligne.',
    tone: 'amber',
  },
  {
    icon: Truck,
    title: 'Fluidifier l’approvisionnement',
    text: 'Répertoire fournisseurs, commandes et réceptions suivies du statut « en transit » à « reçue ».',
    tone: 'violet',
  },
  {
    icon: Users,
    title: 'Adapter l’accès à chaque rôle',
    text: 'Administrateur, pharmacien et infirmier voient et agissent selon leur fonction dans le centre.',
    tone: 'mint',
  },
  {
    icon: ClipboardCheck,
    title: 'Piloter par les chiffres',
    text: 'Valeur du stock, dépenses mensuelles et mouvements par article : un tableau de bord par rôle.',
    tone: 'blue',
  },
];

const howItWorks = [
  {
    n: '1',
    title: 'Contactez l’équipe',
    text: 'Une démonstration ou un devis par e-mail, puis l’accès est préparé pour votre centre.',
  },
  {
    n: '2',
    title: 'Votre centre vous approuve',
    text: 'L’administrateur valide votre rôle : vous ne voyez que les données de votre centre.',
  },
  {
    n: '3',
    title: 'Chargez votre inventaire',
    text: 'Ajoutez vos articles, lots, seuils et fournisseurs — ou importez au fil de l’usage.',
  },
  {
    n: '4',
    title: 'Suivez au quotidien',
    text: 'Mouvements en un clic, alertes automatiques, commandes : le stock reste à jour.',
  },
];

const securityPoints = [
  {
    icon: Lock,
    title: 'Isolation des données par centre',
    text: 'Chaque centre n’accède qu’à ses propres données : l’isolation est appliquée au niveau de la base (règles d’accès par ligne), pas seulement dans l’interface.',
  },
  {
    icon: Users,
    title: 'Accès par rôle et par approbation',
    text: 'Un nouveau compte doit être approuvé par l’administrateur du centre avant de voir la moindre donnée. Admin, pharmacien et infirmier ont des droits distincts.',
  },
  {
    icon: ClipboardCheck,
    title: 'Traçabilité des mouvements',
    text: 'Chaque entrée et sortie conserve son motif, sa date, sa quantité et son auteur : l’historique est consultable et les articles archivés gardent leur trace.',
  },
];

const faqItems = [
  {
    q: 'Comment se passe l’installation ?',
    a: 'MediStock est une application web : aucun serveur à installer. Votre compte est créé et rattaché à votre centre par un administrateur, qui valide votre accès. La prise en main se fait le jour même.',
  },
  {
    q: 'Mes données sont-elles en sécurité ?',
    a: 'Chaque centre est isolé des autres au niveau de la base de données : un utilisateur ne lit que les données de son centre. Les nouveaux comptes doivent être approuvés par l’administrateur avant tout accès, et chaque rôle dispose de droits limités à sa fonction.',
  },
  {
    q: 'Faut-il former les équipes ?',
    a: 'L’interface est pensée pour les usages quotidiens : enregistrer un mouvement prend quelques clics. Une courte prise en main suffit pour la plupart des équipes ; nous pouvons accompagner votre centre lors du démarrage.',
  },
  {
    q: 'Combien coûte MediStock ?',
    a: 'Le tarif dépend de la taille et des besoins de votre centre. Demandez une démonstration ou un accès : nous construisons ensemble une proposition adaptée, en FCFA.',
  },
  {
    q: 'Que se passe-t-il si j’ai un problème ?',
    a: 'Écrivez-nous à nonoakreb@gmail.com ou passez par votre contact centre. Nous répondons aux questions de prise en main et aux demandes d’évolution.',
  },
];

const stockRows = [
  {
    name: 'Amoxicilline 500 mg',
    lot: 'Lot AMX-2408-B12',
    qty: '124 boîtes',
    status: 'Expire dans 21 j',
    kind: 'amber',
    icon: <Syringe size={15} />,
  },
  {
    name: 'Gants chirurgicaux',
    lot: 'Lot GCS-2409-L04',
    qty: '42 boîtes',
    status: 'Stock bas',
    kind: 'red',
    icon: <ShieldCheck size={15} />,
  },
  {
    name: 'Seringues 5 ml',
    lot: 'Lot SRG-2410-A27',
    qty: '86 boîtes',
    status: 'En stock',
    kind: 'green',
    icon: <PackageCheck size={15} />,
  },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  return (
    <div className="min-h-screen overflow-hidden bg-white text-slate-800 selection:bg-emerald-100 selection:text-emerald-900">
      <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5" aria-label="MediStock, accueil">
            <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-emerald-600 text-white shadow-lg shadow-emerald-700/15">
              <Activity size={21} strokeWidth={2.7} />
            </span>
            <span className="font-[Manrope,sans-serif] text-[17px] font-extrabold tracking-tight text-[#183344]">
              MediStock
              <span className="ml-1.5 align-middle text-[9px] font-bold tracking-[.16em] text-emerald-700">
                SANTÉ
              </span>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex" aria-label="Navigation principale">
            <a
              className="text-[13px] font-medium text-slate-600 transition hover:text-emerald-700"
              href="#fonctionnalites"
            >
              Fonctionnalités
            </a>
            <a
              className="text-[13px] font-medium text-slate-600 transition hover:text-emerald-700"
              href="#securite"
            >
              Sécurité
            </a>
            <a
              className="text-[13px] font-medium text-slate-600 transition hover:text-emerald-700"
              href="#tarifs"
            >
              Tarifs
            </a>
            <a
              className="text-[13px] font-medium text-slate-600 transition hover:text-emerald-700"
              href="#faq"
            >
              FAQ
            </a>
          </nav>
          <div className="hidden items-center gap-2.5 md:flex">
            <Link
              href="/login"
              className={buttonVariants({
                variant: 'outline',
                className: 'px-4 py-2.5 text-xs',
              })}
            >
              Connexion
            </Link>
            <Link href="/register" className={buttonVariants({ className: 'px-4 py-2.5 text-xs' })}>
              Demander un accès <ArrowRight size={14} />
            </Link>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/register"
              className={buttonVariants({ className: 'px-3.5 py-2.5 text-xs' })}
            >
              Demander un accès
            </Link>
            <button
              aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
              className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t border-slate-100 bg-white px-5 py-3 shadow-lg md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1" aria-label="Navigation mobile">
              <a
                onClick={closeMenu}
                className="rounded-lg px-3 py-3 text-sm text-slate-600 hover:bg-slate-50"
                href="#fonctionnalites"
              >
                Fonctionnalités
              </a>
              <a
                onClick={closeMenu}
                className="rounded-lg px-3 py-3 text-sm text-slate-600 hover:bg-slate-50"
                href="#securite"
              >
                Sécurité
              </a>
              <a
                onClick={closeMenu}
                className="rounded-lg px-3 py-3 text-sm text-slate-600 hover:bg-slate-50"
                href="#tarifs"
              >
                Tarifs
              </a>
              <a
                onClick={closeMenu}
                className="rounded-lg px-3 py-3 text-sm text-slate-600 hover:bg-slate-50"
                href="#faq"
              >
                FAQ
              </a>
              <Link
                onClick={closeMenu}
                className="rounded-lg px-3 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                href="/login"
              >
                Connexion
              </Link>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* 1 — Hero */}
        <section className="relative isolate px-5 pb-14 pt-14 sm:px-8 sm:pb-20 sm:pt-20 lg:pt-24">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[700px] bg-[radial-gradient(ellipse_at_50%_0%,rgba(213,242,235,.58),transparent_65%)]" />
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[.94fr_1.06fr] lg:gap-10">
            <div className="max-w-[570px] animate-[fadeup_.65s_ease-out_both]">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-3.5 py-2 text-[11px] font-semibold text-emerald-800 shadow-sm">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100">
                  <Sparkles size={12} />
                </span>{' '}
                L’inventaire de santé, enfin serein
              </div>
              <h1 className="font-[Manrope,sans-serif] text-[40px] font-extrabold leading-[1.08] tracking-[-1.8px] text-[#153448] sm:text-[50px] lg:text-[56px]">
                Moins de ruptures, moins de gaspillage.
                <br />
                <span className="text-emerald-600">Plus de temps pour vos patients.</span>
              </h1>
              <p className="mt-6 max-w-[500px] text-[15px] leading-7 text-slate-600 sm:text-base">
                L’inventaire médical intelligent, fluide et sécurisé pour les centres de santé.
                Gardez le contrôle de chaque lot, chaque mouvement et chaque échéance.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={contactMailto}
                  className={buttonVariants({
                    className: 'min-h-[50px] px-6 text-sm shadow-lg shadow-emerald-700/15',
                  })}
                >
                  Demander une démo <ArrowRight size={17} />
                </a>
                <Link
                  href="/register"
                  className={buttonVariants({
                    variant: 'outline',
                    className: 'min-h-[50px] px-6 text-sm',
                  })}
                >
                  Demander un accès <ArrowUpRight size={16} />
                </Link>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-medium text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Check size={13} className="text-emerald-600" /> Sans carte bancaire
                </span>
                <span className="flex items-center gap-1.5">
                  <Check size={13} className="text-emerald-600" /> Mise en route rapide
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-600" /> Données isolées par centre
                </span>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-[610px] animate-[fadeup_.8s_.12s_ease-out_both]">
              <div className="absolute -left-8 top-14 h-32 w-32 rounded-full bg-cyan-200/40 blur-3xl" />
              <div className="absolute -right-10 bottom-10 h-36 w-36 rounded-full bg-emerald-200/50 blur-3xl" />
              <div className="relative rounded-[24px] border border-slate-200/80 bg-white p-3 shadow-[0_34px_90px_-35px_rgba(22,62,75,.32)] sm:p-4">
                <div className="flex items-center justify-between border-b border-slate-100 px-2 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-8 w-8 place-items-center rounded-[10px] bg-emerald-50 text-emerald-700">
                      <Activity size={17} />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-800">Aperçu des stocks</div>
                      <div className="mt-0.5 text-[9px] text-slate-400">
                        Exemple d’interface · données d’illustration
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[9px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Données à jour
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5 p-2 pt-4 sm:gap-3 sm:p-3 sm:pt-4">
                  <div className="rounded-2xl border border-slate-100 bg-[#fbfdfd] p-3.5 sm:p-4">
                    <div className="flex items-center justify-between text-[9px] font-semibold text-slate-500 sm:text-[10px]">
                      Valeur du stock{' '}
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-cyan-50 text-cyan-700">
                        <Activity size={14} />
                      </span>
                    </div>
                    <div className="mt-2 text-xl font-extrabold tracking-tight text-[#183849] sm:text-2xl">
                      4,82 M <span className="text-[10px] font-semibold text-slate-400">FCFA</span>
                    </div>
                    <div className="mt-1 text-[9px] text-emerald-700">Inventaire consolidé</div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-[#fbfdfd] p-3.5 sm:p-4">
                    <div className="flex items-center justify-between text-[9px] font-semibold text-slate-500 sm:text-[10px]">
                      Articles suivis{' '}
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
                        <PackageCheck size={14} />
                      </span>
                    </div>
                    <div className="mt-2 text-xl font-extrabold tracking-tight text-[#183849] sm:text-2xl">
                      248
                    </div>
                    <div className="mt-1 text-[9px] text-slate-400">Toutes catégories</div>
                  </div>
                </div>
                <div className="mx-2 mb-3 rounded-2xl border border-slate-100 p-3 sm:mx-3 sm:p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-700">
                        Mouvements de stock
                      </div>
                      <div className="mt-1 text-[9px] text-slate-400">
                        Entrées et sorties cette semaine
                      </div>
                    </div>
                    <span className="rounded-md bg-slate-50 px-2 py-1 text-[8px] font-medium text-slate-500">
                      7 jours <ChevronDown size={10} className="ml-1 inline" />
                    </span>
                  </div>
                  <div className="relative h-[112px] overflow-hidden">
                    <div className="absolute inset-0 flex flex-col justify-between">
                      {[1, 2, 3, 4].map((x) => (
                        <div key={x} className="border-t border-dashed border-slate-100" />
                      ))}
                    </div>
                    <div className="absolute inset-0 flex items-end justify-around gap-2 px-2">
                      {[48, 68, 52, 83, 62, 76, 58].map((n, i) => (
                        <div
                          key={i}
                          className="relative flex h-full flex-1 items-end justify-center gap-[3px]"
                        >
                          <div
                            className="w-[7px] rounded-t bg-cyan-100 sm:w-[9px]"
                            style={{ height: `${Math.max(n - 24, 20)}%` }}
                          />
                          <div
                            className="w-[7px] rounded-t bg-emerald-500 sm:w-[9px]"
                            style={{ height: `${n}%` }}
                          />
                          <span className="absolute -bottom-4 text-[8px] text-slate-400">
                            {['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-4 text-[8px] text-slate-500">
                    <span>
                      <i className="mr-1 inline-block h-2 w-2 rounded-sm bg-emerald-500" />
                      Entrées
                    </span>
                    <span>
                      <i className="mr-1 inline-block h-2 w-2 rounded-sm bg-cyan-100" />
                      Sorties
                    </span>
                  </div>
                </div>
                <div className="mx-2 overflow-hidden rounded-2xl border border-slate-100 sm:mx-3">
                  <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
                    <div className="text-[10px] font-bold text-slate-700">À surveiller</div>
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-[8px] font-semibold text-amber-700">
                      2 alertes
                    </span>
                  </div>
                  {stockRows.map((r, i) => (
                    <div
                      key={r.name}
                      className={`flex items-center gap-2.5 px-3 py-2.5 ${i < stockRows.length - 1 ? 'border-b border-slate-50' : ''}`}
                    >
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-500">
                        {r.icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[9px] font-semibold text-slate-700">
                          {r.name}
                        </div>
                        <div className="mt-0.5 text-[8px] text-slate-400">
                          {r.lot} · {r.qty}
                        </div>
                      </div>
                      <span
                        className={`whitespace-nowrap rounded-full px-2 py-1 text-[8px] font-semibold ${r.kind === 'amber' ? 'bg-amber-50 text-amber-700' : r.kind === 'red' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}
                      >
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mx-2 mb-1 mt-3 flex items-center justify-between px-1 text-[8px] text-slate-400 sm:mx-3">
                  <span>Suivi transparent, équipe sereine.</span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={10} className="text-emerald-600" /> Accès sécurisé
                  </span>
                </div>
              </div>
              <div className="absolute -left-5 top-[44%] hidden items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-lg shadow-slate-900/5 sm:flex">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-rose-50 text-rose-600">
                  <Bell size={14} />
                </span>
                <span className="text-[9px] font-semibold text-slate-700">Alerte de stock bas</span>
              </div>
              <div className="absolute -right-4 bottom-[10%] hidden items-center gap-2 rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-lg shadow-slate-900/5 sm:flex">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Check size={14} />
                </span>
                <span className="text-[9px] font-semibold text-slate-700">
                  Mouvement enregistré
                </span>
              </div>
            </div>
          </div>
          <div className="mx-auto mt-14 flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-3 border-t border-slate-100 pt-6 text-[10px] font-medium text-slate-400 sm:mt-16">
            <span className="uppercase tracking-[.16em]">Conçu pour les équipes de santé</span>
            <span className="flex items-center gap-1.5">
              <Stethoscope size={14} className="text-cyan-700" /> Centres de santé
            </span>
            <span className="flex items-center gap-1.5">
              <HeartPulse size={14} className="text-emerald-600" /> Pharmacies cliniques
            </span>
            <span className="flex items-center gap-1.5">
              <Truck size={14} className="text-slate-500" /> Approvisionnement
            </span>
          </div>
        </section>

        {/* 2 — Problèmes */}
        <section className="border-t border-slate-100 px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex rounded-full bg-rose-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-rose-600">
                Le quotidien sans visibilité
              </span>
              <h2 className="mt-4 font-[Manrope,sans-serif] text-3xl font-extrabold tracking-[-1px] text-[#16384a] sm:text-4xl">
                Ce que coûte un stock géré à l’aveugle.
              </h2>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {problems.map((p) => (
                <Card key={p.title} className="border-slate-200/80">
                  <CardContent className="p-6">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-rose-50 text-rose-600">
                      <p.icon size={20} />
                    </div>
                    <h3 className="mt-5 font-[Manrope,sans-serif] text-[15px] font-bold tracking-tight text-[#183849]">
                      {p.title}
                    </h3>
                    <p className="mt-2.5 text-[12px] leading-6 text-slate-500">{p.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 3 — Parcours réels */}
        <section className="bg-[#f7faf9] px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-emerald-700">
                Le produit en action
              </span>
              <h2 className="mt-4 font-[Manrope,sans-serif] text-3xl font-extrabold tracking-[-1px] text-[#16384a] sm:text-4xl">
                Vos parcours de tous les jours, tels qu’ils existent dans l’application.
              </h2>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-2">
              {journeys.map((j, i) => (
                <div
                  key={j.step}
                  className="flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-6"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-600 font-[Manrope,sans-serif] text-sm font-extrabold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-[Manrope,sans-serif] text-[15px] font-bold text-[#183849]">
                      {j.step}
                    </h3>
                    <p className="mt-1.5 text-[12px] leading-6 text-slate-500">{j.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4 — Fonctionnalités par bénéfices */}
        <section
          id="fonctionnalites"
          className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-emerald-700">
                Une gestion plus simple
              </span>
              <h2 className="mt-4 font-[Manrope,sans-serif] text-3xl font-extrabold tracking-[-1px] text-[#16384a] sm:text-4xl">
                Tout votre inventaire.
                <br className="sm:hidden" /> Sous contrôle.
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                Les bons outils pour sécuriser vos stocks, réduire les oublis et laisser plus de
                place au soin.
              </p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map((f) => (
                <Card
                  key={f.title}
                  className="group border-slate-200/80 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-900/5"
                >
                  <CardContent className="p-6">
                    <div
                      className={`grid h-12 w-12 place-items-center rounded-2xl transition-transform duration-300 group-hover:scale-105 ${f.tone === 'mint' ? 'bg-emerald-50 text-emerald-700' : f.tone === 'blue' ? 'bg-cyan-50 text-cyan-800' : f.tone === 'amber' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'}`}
                    >
                      <f.icon size={21} />
                    </div>
                    <h3 className="mt-5 font-[Manrope,sans-serif] text-[16px] font-bold tracking-tight text-[#183849]">
                      {f.title}
                    </h3>
                    <p className="mt-2.5 text-[12px] leading-6 text-slate-500">{f.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 5 — Comment ça marche */}
        <section className="border-t border-slate-100 bg-[#f7faf9] px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex rounded-full bg-cyan-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-cyan-800">
                Comment ça marche
              </span>
              <h2 className="mt-4 font-[Manrope,sans-serif] text-3xl font-extrabold tracking-[-1px] text-[#16384a] sm:text-4xl">
                Opérationnel en quatre étapes.
              </h2>
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {howItWorks.map((s) => (
                <div key={s.n} className="relative">
                  <span className="font-[Manrope,sans-serif] text-5xl font-extrabold tracking-tight text-emerald-100">
                    {s.n}
                  </span>
                  <h3 className="mt-2 font-[Manrope,sans-serif] text-[15px] font-bold text-[#183849]">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-[12px] leading-6 text-slate-500">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6 — Sécurité */}
        <section id="securite" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.15em] text-emerald-700">
                <Lock size={14} /> Sécurité et fiabilité
              </span>
              <h2 className="mt-4 font-[Manrope,sans-serif] text-3xl font-extrabold leading-tight tracking-[-1px] text-[#16384a] sm:text-4xl">
                Vos données, isolées et tracées — par conception.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-slate-500">
                Les protections ci-dessous sont celles réellement implémentées dans l’application :
                pas de promesse vague, seulement ce qui est vérifiable.
              </p>
            </div>
            <div className="grid gap-4">
              {securityPoints.map((s) => (
                <div
                  key={s.title}
                  className="flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-5"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                    <s.icon size={19} />
                  </span>
                  <div>
                    <h3 className="font-[Manrope,sans-serif] text-[14px] font-bold text-[#183849]">
                      {s.title}
                    </h3>
                    <p className="mt-1 text-[12px] leading-6 text-slate-500">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7 — Tarifs */}
        <section
          id="tarifs"
          className="scroll-mt-24 border-y border-slate-100 bg-[#f7faf9] px-5 py-16 sm:px-8"
        >
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-7 md:flex-row md:items-center">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[.15em] text-emerald-700">
                Tarification
              </span>
              <h2 className="mt-2 font-[Manrope,sans-serif] text-2xl font-extrabold tracking-tight text-[#16384a] sm:text-3xl">
                Un devis adapté à votre centre.
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Le tarif dépend de la taille de votre structure et de vos besoins. Demandez une
                démonstration : nous vous adressons une proposition en FCFA, sans engagement.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <a href={contactMailto} className={buttonVariants()}>
                Demander une démo <ArrowRight size={16} />
              </a>
              <Link href="/register" className={buttonVariants({ variant: 'outline' })}>
                Demander un accès
              </Link>
            </div>
          </div>
        </section>

        {/* 8 — Pilote */}
        <section id="pilote" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-10 rounded-[28px] border border-emerald-100 bg-emerald-50/40 px-6 py-12 sm:px-12 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.15em] text-emerald-700">
                <Stethoscope size={14} /> Programme pilote
              </span>
              <h2 className="mt-4 font-[Manrope,sans-serif] text-3xl font-extrabold tracking-[-1px] text-[#16384a] sm:text-4xl">
                Ouvert aux premiers centres partenaires.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                MediStock se déploie auprès de centres de santé pilotes en Afrique francophone. En
                rejoignant le programme, vous bénéficiez d’un accompagnement personnalisé pour la
                prise en main et influencez directement la feuille de route produit.
              </p>
            </div>
            <Link
              href="/register"
              className={`${buttonVariants({ className: 'px-6 py-3 text-sm' })} !no-underline`}
            >
              Rejoindre le programme <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* 9 — FAQ */}
        <section id="faq" className="scroll-mt-24 border-t border-slate-100 px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.14em] text-emerald-700">
                Questions fréquentes
              </span>
              <h2 className="mt-4 font-[Manrope,sans-serif] text-3xl font-extrabold tracking-[-1px] text-[#16384a] sm:text-4xl">
                Ce que les équipes nous demandent.
              </h2>
            </div>
            <div className="mt-10 divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white">
              {faqItems.map((f) => (
                <details key={f.q} className="group px-6 py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-[Manrope,sans-serif] text-[14px] font-bold text-[#183849] marker:hidden [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <ChevronDown
                      size={17}
                      className="shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
                    />
                  </summary>
                  <p className="mt-3 text-[13px] leading-6 text-slate-500">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 10 — CTA final */}
        <section id="contact" className="scroll-mt-20 px-5 py-16 sm:px-8 sm:py-20">
          <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-[#123148] px-6 py-12 text-center shadow-2xl shadow-[#123148]/15 sm:px-12 sm:py-16">
            <div className="pointer-events-none absolute -left-28 -top-40 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-48 -right-24 h-96 w-96 rounded-full bg-emerald-400/15 blur-3xl" />
            <div className="relative mx-auto max-w-2xl">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-white/10 text-emerald-300">
                <HeartPulse size={23} />
              </div>
              <h2 className="mt-5 font-[Manrope,sans-serif] text-3xl font-extrabold tracking-[-1px] text-white sm:text-4xl">
                Prêt à reprendre le contrôle de votre stock&nbsp;?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-slate-300">
                Demandez une démonstration ou un devis par e-mail&nbsp;: nous vous répondons avec une
                proposition adaptée à votre centre.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href={contactMailto}
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-emerald-500 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-300/50"
                >
                  Demander une démo <ArrowRight size={17} />
                </a>
                <Link
                  href="/register"
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-3 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
                >
                  Demander un accès
                </Link>
              </div>
              <div className="mt-4 text-[10px] text-slate-400">
                Démo et devis&nbsp;:{' '}
                <a href={`mailto:${contactEmail}`} className="underline underline-offset-2">
                  {contactEmail}
                </a>{' '}
                · <Link href="/login" className="underline underline-offset-2">Se connecter</Link>
                {' '}· accès après approbation par votre centre
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-slate-100 px-5 py-7 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Link href="/" className="flex items-center gap-2 text-sm font-extrabold text-[#183344]">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-emerald-600 text-white">
              <Activity size={16} />
            </span>
            MediStock
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-5 text-[10px] font-medium text-slate-500">
            <a href="#fonctionnalites" className="hover:text-emerald-700">
              Fonctionnalités
            </a>
            <a href="#securite" className="hover:text-emerald-700">
              Sécurité
            </a>
            <a href="#tarifs" className="hover:text-emerald-700">
              Tarifs
            </a>
            <a href="#faq" className="hover:text-emerald-700">
              FAQ
            </a>
            <Link href="/login" className="hover:text-emerald-700">
              Connexion
            </Link>
          </div>
          <div className="text-[9px] text-slate-400">© 2026 MediStock · Abidjan, Côte d’Ivoire</div>
        </div>
      </footer>
      <style jsx global>{`
        @keyframes fadeup {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}
