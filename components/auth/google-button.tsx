'use client';
import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export function GoogleButton({
  next = '/dashboard',
  label = 'Continuer avec Google',
}: {
  next?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const connect = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    if (!supabase) {
      setError('La connexion Supabase n’est pas configurée.');
      setLoading(false);
      return;
    }
    const callback = new URL('/auth/callback', window.location.origin);
    callback.searchParams.set('next', next);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callback.toString(),
        queryParams: { access_type: 'offline', prompt: 'select_account' },
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  };
  return (
    <div className="google-button-wrap">
      <button
        className="google-button"
        type="button"
        onClick={connect}
        disabled={loading}
        aria-busy={loading}
      >
        {loading ? <LoaderCircle className="spin" size={19} /> : <GoogleMark />}
        <span>{loading ? 'Redirection vers Google…' : label}</span>
      </button>
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
function GoogleMark() {
  return (
    <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.74 7.18l7.73 6C44.43 38.06 46.98 31.84 46.98 24.55z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59A14.5 14.5 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.95 23.95 0 0 0 0 24c0 3.88.93 7.55 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.91 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
