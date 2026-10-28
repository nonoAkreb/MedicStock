'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Activity, ArrowRight, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { GoogleButton } from '@/components/auth/google-button';
import { supabase } from '@/lib/supabase/client';
import type { Session } from '@supabase/supabase-js';

export default function LoginPage(){
 const router=useRouter();
 const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 useEffect(()=>{const message=new URLSearchParams(window.location.search).get('error');if(message)setError(message==='oauth'?'La connexion Google a échoué. Veuillez réessayer.':message==='session'?'Votre session a expiré ou n’a pas été conservée. Reconnectez-vous pour ouvrir le tableau de bord.':'Une erreur de connexion s’est produite. Réessayez.');if(supabase)supabase.auth.getSession().then(({data})=>{if(data.session)router.replace('/dashboard')})},[router]);
 const submit=async(e:React.FormEvent)=>{e.preventDefault();setError('');if(!supabase){setError('La connexion Supabase n’est pas configurée.');return}setBusy(true);const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error){setError('Adresse e-mail ou mot de passe invalide.');setBusy(false);return}let session:Session|null=data.session;if(!session){const {data:current}=await supabase.auth.getSession();session=current.session}if(!session){const {data:refresh}=await supabase.auth.refreshSession();session=refresh.session}if(!session){setError('Connexion acceptée, mais la session n’a pas été établie. Réessayez, ou utilisez Continuer avec Google.');setBusy(false);return}router.replace('/dashboard');router.refresh()};
 return <main className="auth-shell"><div className="auth-card"><Link className="auth-brand" href="/"><span className="auth-brand-icon"><Activity size={20} strokeWidth={2.5}/></span><span>MediStock<small>CLINIQUE DU LAGON</small></span></Link><div className="auth-intro"><div className="auth-kicker">ESPACE PROFESSIONNEL</div><h1>Ravi de vous revoir</h1><p>Connectez-vous pour accéder à la gestion des stocks de votre centre.</p></div>
 <GoogleButton label="Continuer avec Google"/><div className="auth-divider"><span>ou avec votre e-mail</span></div>
 <form className="auth-form" onSubmit={submit}><label htmlFor="email">Adresse e-mail</label><div className="auth-input"><Mail size={16}/><input id="email" type="email" autoComplete="email" required placeholder="vous@clinique.ci" value={email} onChange={e=>setEmail(e.target.value)}/></div><div className="auth-password-label"><label htmlFor="password">Mot de passe</label><Link href="/forgot-password">Oublié ?</Link></div><div className="auth-input"><KeyRound size={16}/><input id="password" type="password" autoComplete="current-password" required placeholder="Votre mot de passe" value={password} onChange={e=>setPassword(e.target.value)}/></div>{error&&<p className="auth-error" role="alert">{error}</p>}<button className="auth-submit" type="submit" disabled={busy}>{busy?'Connexion…':'Se connecter'}{!busy&&<ArrowRight size={16}/>}</button></form>
 <div className="auth-bottom">Vous n’avez pas encore de compte ? <Link href="/register">Demander un accès <ArrowRight size={13}/></Link></div><div className="auth-secure"><ShieldCheck size={14}/> Connexion sécurisée · Données protégées par Supabase</div></div><div className="auth-copyright">© 2026 MediStock · Clinique du Lagon</div></main>
}
