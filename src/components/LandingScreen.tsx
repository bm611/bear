import { useEffect, useState, type ReactNode } from 'react'
import { SlateMark } from './Icons'
import type { AuthMode } from './AuthScreen'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

const SNIPPET = [
  '# Sourdough, take four',
  'Crumb was **almost** right. Less water next time.',
  '',
  '- [x] Feed the starter',
  '- [ ] Bulk rise, 5h',
  '- [ ] Bake at 250°C',
  '',
  '#recipes #baking',
].join('\n')

/** Types the snippet character by character, holds it, then starts over. */
function useTypewriter(text: string) {
  const [length, setLength] = useState(0)

  useEffect(() => {
    if (prefersReducedMotion()) {
      setLength(text.length)
      return
    }
    let index = 0
    let timer = 0
    const step = () => {
      index += 1
      setLength(index)
      if (index >= text.length) {
        timer = window.setTimeout(() => {
          index = 0
          setLength(0)
          timer = window.setTimeout(step, 900)
        }, 6000)
        return
      }
      const delay = text[index - 1] === '\n' ? 400 : 24 + Math.random() * 44
      timer = window.setTimeout(step, delay)
    }
    timer = window.setTimeout(step, 800)
    return () => window.clearTimeout(timer)
  }, [text])

  return text.slice(0, length)
}

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

/** Renders typed text the way the editor does: **bold** and #tags get live styling. */
function inlineNodes(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = []
  let bold = false
  text.split('**').forEach((segment, segmentIndex) => {
    if (segment) {
      const tagPattern = /(^|\s)(#[\p{L}\p{N}_/-]+)/gu
      let last = 0
      let match: RegExpExecArray | null
      let part = 0
      const pushText = (value: string) => {
        if (!value) return
        nodes.push(
          bold ? <strong key={`${keyBase}-${segmentIndex}-${part++}`}>{value}</strong> : value,
        )
      }
      while ((match = tagPattern.exec(segment))) {
        pushText(segment.slice(last, match.index) + match[1])
        nodes.push(
          <span key={`${keyBase}-tag-${segmentIndex}-${part++}`} className="mock-tag">
            {match[2]}
          </span>,
        )
        last = match.index + match[0].length
      }
      pushText(segment.slice(last))
    }
    bold = !bold
  })
  return nodes
}

function MockEditorText({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, index) => {
        const caret = index === lines.length - 1 ? <span className="mock-caret" /> : null
        if (line.startsWith('# ')) {
          return (
            <div className="mock-h1" key={index}>
              {inlineNodes(line.slice(2), `h${index}`)}
              {caret}
            </div>
          )
        }
        const todo = /^- \[([ x])\] ?(.*)$/.exec(line)
        if (todo) {
          return (
            <div className="mock-line mock-todo" key={index}>
              <span className="mock-box" data-checked={todo[1] === 'x'}>
                {todo[1] === 'x' ? '✓' : ''}
              </span>
              <span>
                {inlineNodes(todo[2], `t${index}`)}
                {caret}
              </span>
            </div>
          )
        }
        return (
          <div className="mock-line" key={index}>
            {inlineNodes(line, `l${index}`)}
            {caret}
          </div>
        )
      })}
    </>
  )
}

const LIST_NOTES = [
  { title: 'Sourdough, take four', meta: 'Just now', width: '82%', active: true },
  { title: 'Reading list', meta: 'Tuesday', width: '64%', active: false },
  { title: 'Weekly review', meta: 'Sunday', width: '74%', active: false },
  { title: 'Trip packing', meta: 'Mar 14', width: '58%', active: false },
  { title: 'Book notes — Piranesi', meta: 'Mar 9', width: '71%', active: false },
]

/** Crosshair plus-marks pinned to the four corners of a blueprint frame. */
function CornerMarks() {
  return (
    <span className="lp-marks" aria-hidden="true">
      <i /> <i /> <i /> <i />
    </span>
  )
}

/** Thin wireframe orbit sphere — the "everything is connected" illustration. */
function OrbitSphere({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <circle cx="60" cy="60" r="42" stroke="currentColor" strokeWidth="1.4" />
      <ellipse cx="60" cy="60" rx="56" ry="18" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
      <ellipse cx="60" cy="60" rx="18" ry="56" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
      <circle cx="60" cy="18" r="3" fill="currentColor" />
      <circle cx="104" cy="72" r="3" fill="currentColor" />
      <circle cx="22" cy="86" r="3" fill="currentColor" />
      <line x1="60" y1="18" x2="104" y2="72" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 3" />
      <line x1="60" y1="18" x2="22" y2="86" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 3" />
    </svg>
  )
}

/** A miniature of the real two-pane app, typing a note to itself. */
function MockWindow() {
  const typed = useTypewriter(SNIPPET)

  return (
    <div className="lp-stage" aria-hidden="true">
      <span className="lp-fig">FIG.01 — the whole app, actual size</span>
      <div className="mock-window">
        <div className="mock-titlebar">
          <span className="mock-dot" data-tone="one" />
          <span className="mock-dot" data-tone="two" />
          <span className="mock-dot" data-tone="three" />
          <span className="mock-titlebar-title">~/notes/sourdough-take-four.md</span>
        </div>
        <div className="mock-body">
          <div className="mock-list">
            <span className="mock-list-brand">
              <SlateMark size={12} />
              Slate
            </span>
            <span className="mock-search" />
            {LIST_NOTES.map((note) => (
              <span className="mock-note" data-active={note.active} key={note.title}>
                <span className="mock-note-title">{note.title}</span>
                <span className="mock-note-line" style={{ width: note.width }} />
                <span className="mock-note-meta">{note.meta}</span>
              </span>
            ))}
          </div>

          <div className="mock-editor">
            <MockEditorText text={typed} />
          </div>
        </div>
      </div>

      <span className="lp-pin lp-pin-sync">
        <span className="lp-pin-dot" />
        SYNC://OK
      </span>
      <span className="lp-leader lp-leader-sync" />
      <span className="lp-pin lp-pin-tag">#recipes · 6 notes</span>
      <span className="lp-leader lp-leader-tag" />
      <span className="lp-note-hand">
        0 folders required
        <svg viewBox="0 0 40 28" fill="none" aria-hidden="true">
          <path
            d="M36 4C26 2 12 4 6 20m0 0 6-4m-6 4-4-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <span className="lp-pixel lp-pixel-a" />
      <span className="lp-pixel lp-pixel-b" />
      <OrbitSphere className="lp-orbit" />
    </div>
  )
}

const MARQUEE = [
  'plain text forever',
  'markdown native',
  'tags beat folders',
  'keyboard first',
  'no lock-in',
  'export anytime',
]

const CHEATS: { raw: string; render: ReactNode }[] = [
  { raw: '# Big idea', render: <span className="lp-cheat-h1">Big idea</span> },
  { raw: '**important**', render: <strong>important</strong> },
  {
    raw: '- [ ] milk',
    render: (
      <span className="lp-cheat-todo">
        <span className="lp-cheat-box" />
        milk
      </span>
    ),
  },
  { raw: '#recipes', render: <span className="lp-cheat-pill">#recipes</span> },
]

const FEATURES = [
  {
    index: '01',
    title: 'Markdown that shows its work',
    body: 'Headings swell, todos sprout checkboxes, tables snap into a grid — all while the file underneath stays boring, portable text.',
  },
  {
    index: '02',
    title: 'Tags, not folders',
    body: 'Drop a #tag mid-sentence. Nest them like folders if you must — one note can live in six places at once.',
  },
  {
    index: '03',
    title: 'Follows you around',
    body: 'Sign in once and every note turns up on the next device, mid-sentence.',
  },
  {
    index: '04',
    title: 'Yours to walk away with',
    body: 'Every note exports as a plain .md file. No hostage situation, no export fee — just a folder of text you can read in thirty years.',
  },
] as const

export function LandingScreen({ onLaunch }: { onLaunch: (mode: AuthMode) => void }) {
  const wordIndex = useRotatingWord(SLATE_WORDS)

  return (
    <div className="lp">
      <header className="lp-nav">
        <a className="lp-logo" href="#top">
          <span className="lp-logo-mark">
            <SlateMark size={20} />
          </span>
          <span className="lp-logo-word">Slate</span>
        </a>
        <nav className="lp-nav-links" aria-label="Sections">
          <a href="#syntax">Syntax</a>
          <a href="#features">Features</a>
        </nav>
        <div className="lp-nav-actions">
          <button type="button" className="lp-link" onClick={() => onLaunch('signIn')}>
            Sign in
          </button>
          <button
            type="button"
            className="lp-btn lp-btn-solid lp-btn-sm"
            onClick={() => onLaunch('signUp')}
          >
            <span>Get started</span>
          </button>
        </div>
      </header>

      <main className="lp-main" id="top">
        <section className="lp-hero">
          <div className="lp-hero-copy">
            <span className="lp-eyebrow lp-pop" style={{ animationDelay: '40ms' }}>
              [ markdown notes with a pulse ]
            </span>

            <h1 className="lp-title lp-pop" style={{ animationDelay: '110ms' }}>
              <span className="lp-title-line">A clean slate for your</span>
              {/* Every word is rendered into the same grid cell, so the chip is
                  sized by the longest of them and holds still as they swap. */}
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

            <p className="lp-lede lp-pop" style={{ animationDelay: '190ms' }}>
              Slate is a fast little markdown notebook that doesn't nag, sync-spin, or hide your
              words behind a database. Type. Tag. Close the laptop. It'll all still be there.
            </p>

            <div className="lp-cta-group lp-pop" style={{ animationDelay: '260ms' }}>
              <button
                type="button"
                className="lp-btn lp-btn-notch lp-btn-lg"
                onClick={() => onLaunch('signUp')}
              >
                <span>Start writing — free&nbsp;→</span>
              </button>
              <button
                type="button"
                className="lp-btn lp-btn-slate lp-btn-lg"
                onClick={() => onLaunch('signIn')}
              >
                <span>I've been here before</span>
              </button>
            </div>

            <ul className="lp-ticks lp-pop" style={{ animationDelay: '330ms' }}>
              <li>no credit card</li>
              <li>no onboarding tour</li>
              <li>no folders, ever</li>
            </ul>
          </div>

          <div className="lp-hero-shot lp-pop" style={{ animationDelay: '400ms' }}>
            <MockWindow />
          </div>
        </section>

        <div className="lp-marquee" aria-hidden="true">
          <div className="lp-marquee-track">
            {[0, 1].map((copy) => (
              <div className="lp-marquee-group" key={copy}>
                {MARQUEE.map((item) => (
                  <span className="lp-marquee-item" key={item}>
                    {item}
                    <i>+</i>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <section className="lp-section" id="syntax">
          <div className="lp-section-head">
            <span className="lp-eyebrow">[ syntax → render ]</span>
            <h2 className="lp-h2">Type this, get that</h2>
            <p className="lp-section-sub">
              Type the markdown you already half-remember — headings, todos, and tags light up as
              you go.
            </p>
          </div>

          <div className="lp-grid-frame lp-cheat-grid">
            <CornerMarks />
            {CHEATS.map((cheat, index) => (
              <div className="lp-cheat" key={cheat.raw}>
                <span className="lp-cell-index">ex.{String(index + 1).padStart(2, '0')}</span>
                <code className="lp-cheat-raw">{cheat.raw}</code>
                <span className="lp-cheat-arrow" aria-hidden="true">
                  -&gt;
                </span>
                <span className="lp-cheat-out">{cheat.render}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-dark" id="features">
          <span className="lp-pill">Learn more</span>
          <div className="lp-dark-inner">
            <div className="lp-section-head">
              <span className="lp-eyebrow lp-eyebrow-sea">[ the spec sheet ]</span>
              <h2 className="lp-h2 lp-h2-dark">Four things, done properly</h2>
              <p className="lp-section-sub lp-sub-dark">
                Instead of forty things done in a settings panel nobody opens.
              </p>
            </div>

            <div className="lp-grid-frame lp-feat-grid">
              <CornerMarks />
              {FEATURES.map((feature) => (
                <article className="lp-feature" key={feature.index}>
                  <span className="lp-feat-index">{feature.index}</span>
                  <h3 className="lp-h3">{feature.title}</h3>
                  <p className="lp-feature-body">{feature.body}</p>
                </article>
              ))}
            </div>
          </div>

          <span className="lp-pixel lp-pixel-c" />
          <span className="lp-pixel lp-pixel-d" />
          <OrbitSphere className="lp-orbit-dark" />
          <div className="lp-tear" aria-hidden="true" />
        </section>

        <section className="lp-closer">
          <div className="lp-closer-inner lp-frame-corners">
            <CornerMarks />
            <span className="lp-eyebrow">[ step 01 — open a note ]</span>
            <h2 className="lp-closer-title">Go on, write something down.</h2>
            <p className="lp-closer-sub">
              It takes about nine seconds to make an account, and roughly zero to start typing.
            </p>
            <div className="lp-cta-group lp-cta-center">
              <button
                type="button"
                className="lp-btn lp-btn-notch lp-btn-lg"
                onClick={() => onLaunch('signUp')}
              >
                <span>Open a blank note&nbsp;→</span>
              </button>
              <button
                type="button"
                className="lp-btn lp-btn-outline lp-btn-lg"
                onClick={() => onLaunch('signIn')}
              >
                <span>Sign in</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-foot">
        <div className="lp-foot-row">
          <span className="lp-foot-brand">
            <SlateMark size={16} />
            Slate — v0.1.0
          </span>
          <span>Built for people who think in plain text.</span>
          <button type="button" className="lp-link" onClick={() => onLaunch('signUp')}>
            Get started →
          </button>
        </div>
        <span className="lp-foot-giant" aria-hidden="true">
          Slate
        </span>
      </footer>
    </div>
  )
}
