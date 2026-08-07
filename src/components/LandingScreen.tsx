import { useEffect, useState } from 'react'
import { MotifMark, SlateMark } from './Icons'
import type { AuthMode } from './AuthScreen'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const SLATE_WORDS = [
  'half-baked ideas',
  'grocery lists',
  '3am epiphanies',
  'plot twists',
  'grand plans',
  'sourdough notes',
]

/** Cycles the headline's last word so the hero never sits perfectly still. */
function useRotatingWord(words: string[]) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % words.length)
    }, 2400)
    return () => window.clearInterval(timer)
  }, [words])

  return index
}

/**
 * One viewport, one message. The nav and a centered hero — nothing below the
 * fold, nothing to scroll to.
 */
export function LandingScreen({ onLaunch }: { onLaunch: (mode: AuthMode) => void }) {
  const wordIndex = useRotatingWord(SLATE_WORDS)

  return (
    <div className="lp">
      <div className="lp-nav-wrap">
        <header className="lp-nav">
          <span className="lp-logo">
            <span className="lp-logo-mark">
              <SlateMark size={18} />
            </span>
            <span className="lp-logo-word">Slate</span>
          </span>
          <div className="lp-nav-actions">
            <button type="button" className="lp-link" onClick={() => onLaunch('signIn')}>
              Sign in
            </button>
            <button type="button" className="lp-btn lp-btn-sm" onClick={() => onLaunch('signUp')}>
              Sign up
            </button>
          </div>
        </header>
      </div>

      <main className="lp-main">
        <section className="lp-hero">
          <div className="lp-hero-glow" aria-hidden="true" />
          <div className="lp-hero-copy">
            <MotifMark className="lp-motif" size={64} />

            <h1 className="lp-title">
              A clean slate for your
              <span className="lp-rotor">
                {SLATE_WORDS.map((word, index) => (
                  <span
                    className="lp-rotor-word"
                    data-active={index === wordIndex}
                    aria-hidden={index === wordIndex ? undefined : true}
                    key={word}
                  >
                    {word}
                  </span>
                ))}
              </span>
            </h1>

            <p className="lp-lede">
              Slate is a fast little markdown notebook that doesn't nag, sync-spin, or hide your
              words behind a database. Type. Tag. Close the laptop. It'll all still be there.
            </p>

            <div className="lp-cta-group">
              <button type="button" className="lp-btn lp-btn-lg" onClick={() => onLaunch('signUp')}>
                Start writing — free
              </button>
              <button
                type="button"
                className="lp-btn lp-btn-outline lp-btn-lg"
                onClick={() => onLaunch('signIn')}
              >
                I've been here before
              </button>
            </div>

            <ul className="lp-ticks">
              <li>No credit card</li>
              <li>No onboarding tour</li>
              <li>No folders, ever</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  )
}
