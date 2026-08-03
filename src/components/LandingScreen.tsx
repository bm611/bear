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
            <SlateMark size={18} />
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
          <button type="button" className="lp-btn lp-btn-sm" onClick={() => onLaunch('signUp')}>
            Get started
          </button>
        </div>
      </header>

      <main className="lp-main" id="top">
        <section className="lp-hero">
          <div className="lp-hero-copy">
            <span className="lp-eyebrow">Markdown notes with a pulse</span>

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

        <section className="lp-section" id="syntax">
          <div className="lp-section-head">
            <span className="lp-eyebrow">Syntax → render</span>
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

        <section className="lp-dark" id="features">
          <div className="lp-dark-inner">
            <div className="lp-section-head">
              <span className="lp-eyebrow lp-eyebrow-dark">The spec sheet</span>
              <h2 className="lp-h2 lp-h2-dark">Four things, done properly</h2>
              <p className="lp-section-sub lp-sub-dark">
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
          </div>
        </section>

        <section className="lp-closer">
          <div className="lp-closer-inner">
            <span className="lp-eyebrow">Step one — open a note</span>
            <h2 className="lp-closer-title">Go on, write something down.</h2>
            <p className="lp-closer-sub">
              It takes about nine seconds to make an account, and roughly zero to start typing.
            </p>
            <div className="lp-cta-group lp-cta-center">
              <button type="button" className="lp-btn lp-btn-lg" onClick={() => onLaunch('signUp')}>
                Open a blank note
              </button>
              <button
                type="button"
                className="lp-btn lp-btn-outline lp-btn-lg"
                onClick={() => onLaunch('signIn')}
              >
                Sign in
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-foot">
        <div className="lp-foot-row">
          <span className="lp-foot-brand">
            <SlateMark size={15} />
            Slate — v0.1.0
          </span>
          <span className="lp-foot-tagline">Built for people who think in plain text.</span>
          <button type="button" className="lp-link" onClick={() => onLaunch('signUp')}>
            Get started →
          </button>
        </div>
      </footer>
    </div>
  )
}
