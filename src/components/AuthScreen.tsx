import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { BackIcon, SlateMark } from './Icons'

export type AuthMode = 'signIn' | 'signUp'

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.95v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.95A9 9 0 0 0 0 9c0 1.45.35 2.83.95 4.03l3-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.97l3 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
      />
    </svg>
  )
}

export function AuthScreen({
  initialMode = 'signIn',
  onBack,
}: {
  initialMode?: AuthMode
  onBack?: () => void
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    setNotice(null)

    const { error: authError } =
      mode === 'signIn'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    setPending(false)
    if (authError) {
      setError(authError.message)
      return
    }
    if (mode === 'signUp') setNotice('Check your email to confirm your account, then sign in.')
  }

  async function onGoogle() {
    setError(null)
    setPending(true)
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (authError) {
      setPending(false)
      setError(authError.message)
    }
  }

  const statusId = error ? 'auth-error' : notice ? 'auth-notice' : undefined

  return (
    <div className="auth-screen">
      {onBack ? (
        <button type="button" className="auth-back" onClick={onBack}>
          <BackIcon size={14} />
          Back
        </button>
      ) : null}
      <aside className="auth-story" aria-hidden="true">
        <div className="auth-story-brand">
          <span><SlateMark size={18} /></span>
          Slate
        </div>
        <blockquote>“The page should be quieter than the thought.”</blockquote>
        <div className="auth-story-note">
          <small>FIELD NOTE / 08.05</small>
          <strong>Keep what matters.</strong>
          <p>Plain text, useful tags, and enough room to think.</p>
        </div>
      </aside>
      <form className="auth-card" onSubmit={onSubmit} aria-busy={pending || undefined}>
        <div className="auth-brand">
          <span className="auth-brand-mark">
            <SlateMark size={26} />
          </span>
          <h1>{mode === 'signIn' ? 'Welcome back' : 'Start a new slate'}</h1>
        </div>
        <p className="auth-tagline">
          {mode === 'signIn' ? 'Your notes are right where you left them.' : 'A quiet place for everything worth keeping.'}
        </p>

        <button type="button" className="button auth-google" onClick={onGoogle} disabled={pending}>
          <GoogleGlyph />
          Continue with Google
        </button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <label className="auth-label" htmlFor="auth-email">
          Email
        </label>
        <input
          id="auth-email"
          className="dialog-input"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={statusId}
        />

        <label className="auth-label" htmlFor="auth-password">
          Password
        </label>
        <input
          id="auth-password"
          className="dialog-input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
          minLength={6}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={statusId}
        />

        {error ? (
          <p id="auth-error" className="auth-error" role="alert">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p id="auth-notice" className="auth-notice" role="status">
            {notice}
          </p>
        ) : null}

        <button type="submit" className="button button-primary auth-submit" disabled={pending}>
          {pending
            ? mode === 'signIn'
              ? 'Signing in…'
              : 'Creating account…'
            : mode === 'signIn'
              ? 'Sign in'
              : 'Create account'}
        </button>

        <button
          type="button"
          className="auth-toggle"
          onClick={() => {
            setMode((current) => (current === 'signIn' ? 'signUp' : 'signIn'))
            setError(null)
            setNotice(null)
          }}
        >
          {mode === 'signIn' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </form>
    </div>
  )
}
