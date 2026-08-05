import { useEffect, useState, type ReactNode } from 'react'
import { MotifMark, SlateMark } from './Icons'
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

/** A miniature of the real two-pane app, typing a note to itself. */
function MockWindow() {
  const typed = useTypewriter(SNIPPET)

  return (
    <div className="lp-stage" aria-hidden="true">
      <div className="mock-window">
        <div className="mock-titlebar">
          <span className="mock-dot" />
          <span className="mock-dot" />
          <span className="mock-dot" />
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
    </div>
  )
}

/** What the marquee loops: the everyday kinds of notes people keep. */
const MARQUEE_ITEMS = [
  'Grocery lists',
  '3am epiphanies',
  'Book notes',
  'Novel drafts',
  'Meeting minutes',
  'Gravy recipes',
  'Workout logs',
  'Dream journals',
  'Code snippets',
  'Lecture notes',
  'Packing lists',
  'Standup notes',
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

const PILLARS = [
  {
    index: '01',
    title: 'Plain text, always',
    body: 'Every note is a markdown file a thirty-year-old editor could open. No database, no proprietary soup, no export ritual.',
  },
  {
    index: '02',
    title: 'Quiet on purpose',
    body: 'No badges, no nudges, no tour. The interface steps back so the sentence you are writing is the loudest thing on screen.',
  },
  {
    index: '03',
    title: 'Yours, end to end',
    body: 'Sign in for sync across devices; walk away with a folder of text whenever you like. Leaving is a feature, not a complaint.',
  },
] as const

const METRICS = [
  { value: '1', label: 'File format — plain markdown' },
  { value: '0', label: 'Folders, databases, lock-in' },
  { value: '∞', label: 'Shelf life of plain text' },
] as const

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
      <div className="lp-nav-wrap">
        <header className="lp-nav">
          <a className="lp-logo" href="#top" aria-label="Slate — home">
            <span className="lp-logo-mark">
              <SlateMark size={18} />
            </span>
            <span className="lp-logo-word">Slate</span>
          </a>
          <nav className="lp-nav-links" aria-label="Sections">
            <a href="#syntax">Syntax</a>
            <a href="#why">Why Slate</a>
            <a href="#features">Features</a>
          </nav>
          <div className="lp-nav-actions">
            <span className="lp-nav-divider" aria-hidden="true" />
            <button type="button" className="lp-link" onClick={() => onLaunch('signIn')}>
              Sign in
            </button>
            <button type="button" className="lp-btn lp-btn-sm" onClick={() => onLaunch('signUp')}>
              Sign up
            </button>
          </div>
        </header>
      </div>

      <main className="lp-main" id="top">
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

          <div className="lp-hero-shot">
            <MockWindow />
          </div>
        </section>

        <div className="lp-marquee" aria-hidden="true">
          <p className="lp-marquee-label">One home for everything you write down</p>
          <div className="lp-marquee-mask">
            <div className="lp-marquee-track">
              {[0, 1].map((group) => (
                <div className="lp-marquee-group" key={group}>
                  {MARQUEE_ITEMS.map((item) => (
                    <span className="lp-marquee-item" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="lp-section" id="syntax">
          <div className="lp-section-head">
            <p className="lp-kicker">Syntax → render</p>
            <h2 className="lp-h2">Type this, get that</h2>
            <p className="lp-section-sub">
              Type the markdown you already half-remember — headings, todos, and tags light up as
              you go.
            </p>
          </div>

          <div className="lp-cheat-grid">
            {CHEATS.map((cheat, index) => (
              <div className="lp-cheat" key={cheat.raw}>
                <span className="lp-cell-index">{String(index + 1).padStart(2, '0')}</span>
                <code className="lp-cheat-raw">{cheat.raw}</code>
                <span className="lp-cheat-arrow" aria-hidden="true">
                  →
                </span>
                <span className="lp-cheat-out">{cheat.render}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-statement">
          <div className="lp-statement-inner">
            <p className="lp-kicker lp-kicker-dark">The bet</p>
            <h2 className="lp-statement-title">Plain text outlives every app.</h2>
            <p className="lp-statement-sub">
              Apps come and go. Formats get acquired. A folder of markdown files just keeps
              reading — yours, readable, thirty years from now.
            </p>
            <div className="lp-cta-group">
              <button
                type="button"
                className="lp-btn lp-btn-light lp-btn-lg"
                onClick={() => onLaunch('signUp')}
              >
                Start your library
              </button>
              <a className="lp-btn lp-btn-ghost lp-btn-lg" href="#syntax">
                See how it reads
              </a>
            </div>
          </div>
        </section>

        <section className="lp-section" id="why">
          <div className="lp-section-head">
            <p className="lp-kicker">Why Slate</p>
            <h2 className="lp-h2">Three convictions, held firmly</h2>
            <p className="lp-section-sub">
              Everything in the app is downstream of these. When in doubt, the quieter option
              wins.
            </p>
          </div>

          <div className="lp-pillar-grid">
            {PILLARS.map((pillar) => (
              <article className="lp-pillar" key={pillar.index}>
                <span className="lp-pillar-index">{pillar.index}</span>
                <h3 className="lp-h3">{pillar.title}</h3>
                <p className="lp-pillar-body">{pillar.body}</p>
              </article>
            ))}
          </div>

          <p className="lp-audience">
            <span>For writers</span>
            <span>Thinkers</span>
            <span>The chronically curious</span>
          </p>

          <div className="lp-metric-row">
            {METRICS.map((metric) => (
              <div className="lp-metric" key={metric.label}>
                <span className="lp-metric-value">{metric.value}</span>
                <span className="lp-metric-label">{metric.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-section" id="features">
          <div className="lp-section-head">
            <p className="lp-kicker">The spec sheet</p>
            <h2 className="lp-h2">Four things, done properly</h2>
            <p className="lp-section-sub">
              Instead of forty things done in a settings panel nobody opens.
            </p>
          </div>

          <div className="lp-feat-grid">
            {FEATURES.map((feature) => (
              <article className="lp-feature" key={feature.index}>
                <span className="lp-feat-index">{feature.index}</span>
                <h3 className="lp-h3">{feature.title}</h3>
                <p className="lp-feature-body">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-closer">
          <div className="lp-closer-inner">
            <p className="lp-kicker">Step one — open a note</p>
            <h2 className="lp-closer-title">Go on, write something down.</h2>
            <p className="lp-closer-sub">
              It takes about nine seconds to make an account, and roughly zero to start typing.
            </p>
            <div className="lp-cta-group">
              <button
                type="button"
                className="lp-btn lp-btn-light lp-btn-lg"
                onClick={() => onLaunch('signUp')}
              >
                Open a blank note
              </button>
              <button
                type="button"
                className="lp-btn lp-btn-ghost lp-btn-lg"
                onClick={() => onLaunch('signIn')}
              >
                Sign in
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-foot">
        <div className="lp-foot-grid">
          <div className="lp-foot-brand">
            <span className="lp-foot-brand-row">
              <span className="lp-logo-mark">
                <SlateMark size={16} />
              </span>
              Slate
            </span>
            <span className="lp-foot-tagline">Built for people who think in plain text.</span>
          </div>

          <div className="lp-foot-col">
            <h4>Product</h4>
            <a href="#syntax">Syntax</a>
            <a href="#why">Why Slate</a>
            <a href="#features">Features</a>
          </div>

          <div className="lp-foot-col">
            <h4>Account</h4>
            <button type="button" onClick={() => onLaunch('signUp')}>
              Create account
            </button>
            <button type="button" onClick={() => onLaunch('signIn')}>
              Sign in
            </button>
          </div>

          <div className="lp-foot-col">
            <h4>This page</h4>
            <a href="#top">Back to top</a>
          </div>
        </div>

        <div className="lp-foot-legal">
          <span>Slate — v0.1.0</span>
          <span>Plain text · No folders · No lock-in</span>
        </div>
      </footer>
    </div>
  )
}
