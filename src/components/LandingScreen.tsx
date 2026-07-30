import { useEffect, useState, type ReactNode } from 'react'
import { SlateMark, CheckIcon, ChevronRight, CodeIcon, SyncIcon, TagIcon } from './Icons'
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
]

/** A miniature of the real two-pane app, typing a note to itself. */
function MockWindow() {
  const typed = useTypewriter(SNIPPET)

  return (
    <div className="lp-stage" aria-hidden="true">
      <div className="mock-window">
        <div className="mock-titlebar">
          <span className="mock-dot" data-tone="red" />
          <span className="mock-dot" data-tone="yellow" />
          <span className="mock-dot" data-tone="green" />
          <span className="mock-titlebar-title">sourdough-take-four.md</span>
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

      <span className="lp-sticker lp-sticker-sync">
        <CheckIcon size={13} />
        synced, obviously
      </span>
      <span className="lp-sticker lp-sticker-tag">
        <TagIcon size={13} />
        #recipes · 6 notes
      </span>
      <span className="lp-sticker lp-sticker-zero">
        0 folders
        <br />
        <small>required</small>
      </span>
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

const CARDS = [
  {
    tone: 'honey',
    icon: CodeIcon,
    kicker: 'the writing bit',
    title: 'Markdown that shows its work',
    body: 'Headings swell, todos sprout checkboxes, tables snap into a grid — all while the file underneath stays boring, portable text.',
    wide: true,
  },
  {
    tone: 'sky',
    icon: TagIcon,
    kicker: 'the filing bit',
    title: 'Tags, not folders',
    body: 'Drop a #tag mid-sentence. Nest them like folders if you must. One note can live in six places at once.',
    wide: false,
  },
  {
    tone: 'mint',
    icon: SyncIcon,
    kicker: 'the everywhere bit',
    title: 'Follows you around',
    body: 'Sign in once and every note turns up on the next device, mid-sentence.',
    wide: false,
  },
  {
    tone: 'grape',
    icon: SlateMark,
    kicker: 'the trust bit',
    title: 'Yours to walk away with',
    body: 'Every note exports as a plain .md file. No hostage situation, no export fee, no hard feelings — just a folder of text you can read in thirty years.',
    wide: true,
  },
] as const

function Squiggle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 24" fill="none" aria-hidden="true">
      <path
        d="M2 14c8-14 16 10 24-2s16 12 24 0 16 10 24-2 16 8 22 2"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )
}

function Star({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 1.5c.6 6 3.9 9.3 9.9 9.9v1.2c-6 .6-9.3 3.9-9.9 9.9h-1.2C10.2 16.5 6.9 13.2.9 12.6v-1.2c6-.6 9.3-3.9 9.9-9.9h1.2Z"
        fill="currentColor"
      />
    </svg>
  )
}

export function LandingScreen({ onLaunch }: { onLaunch: (mode: AuthMode) => void }) {
  const wordIndex = useRotatingWord(SLATE_WORDS)

  return (
    <div className="lp">
      <div className="lp-paper" aria-hidden="true" />
      <div className="lp-blobs" aria-hidden="true">
        <span className="lp-blob lp-blob-a" />
        <span className="lp-blob lp-blob-b" />
        <span className="lp-blob lp-blob-c" />
      </div>

      <header className="lp-nav">
        <a className="lp-logo" href="#top">
          <span className="lp-logo-mark">
            <SlateMark size={20} />
          </span>
          <span className="lp-logo-word">Slate</span>
        </a>
        <nav className="lp-nav-actions">
          <button type="button" className="lp-link" onClick={() => onLaunch('signIn')}>
            Sign in
          </button>
          <button
            type="button"
            className="lp-btn lp-btn-primary lp-btn-sm"
            onClick={() => onLaunch('signUp')}
          >
            Get started
          </button>
        </nav>
      </header>

      <main className="lp-main" id="top">
        <section className="lp-hero">
          <div className="lp-hero-copy">
            <span className="lp-badge lp-pop" style={{ animationDelay: '40ms' }}>
              <Star className="lp-badge-star" />
              markdown notes with a pulse
            </span>

            <h1 className="lp-title lp-pop" style={{ animationDelay: '110ms' }}>
              <span className="lp-title-line">A clean slate</span>
              <span className="lp-title-line lp-title-line-2">for your</span>
              <span className="lp-rotor">
                <span key={wordIndex} className="lp-rotor-word">
                  {SLATE_WORDS[wordIndex]}
                </span>
              </span>
            </h1>

            <p className="lp-lede lp-pop" style={{ animationDelay: '190ms' }}>
              Slate is a fast little markdown notebook that doesn't nag, sync-spin, or hide your
              words behind a database. Type. Tag. Close the laptop. It'll all still be there.
            </p>

            <div className="lp-cta-row lp-pop" style={{ animationDelay: '260ms' }}>
              <button
                type="button"
                className="lp-btn lp-btn-primary lp-btn-lg"
                onClick={() => onLaunch('signUp')}
              >
                Start writing — free
                <ChevronRight size={17} />
              </button>
              <button
                type="button"
                className="lp-btn lp-btn-ghost lp-btn-lg"
                onClick={() => onLaunch('signIn')}
              >
                I've been here before
              </button>
            </div>

            <ul className="lp-ticks lp-pop" style={{ animationDelay: '330ms' }}>
              <li>
                <CheckIcon size={14} /> no credit card
              </li>
              <li>
                <CheckIcon size={14} /> no onboarding tour
              </li>
              <li>
                <CheckIcon size={14} /> no folders, ever
              </li>
            </ul>
          </div>

          <div className="lp-pop lp-pop-art" style={{ animationDelay: '220ms' }}>
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
                    <Star className="lp-marquee-star" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <section className="lp-section lp-cheatsheet">
          <div className="lp-section-head">
            <h2 className="lp-h2">
              Type this
              <Squiggle className="lp-squiggle" />
              get that
            </h2>
            <p className="lp-section-sub">
              Type the markdown you already half-remember — headings, todos, and tags light up as you
              go.
            </p>
          </div>

          <div className="lp-cheat-grid">
            {CHEATS.map((cheat) => (
              <div className="lp-cheat" key={cheat.raw}>
                <code className="lp-cheat-raw">{cheat.raw}</code>
                <span className="lp-cheat-arrow" aria-hidden="true">
                  →
                </span>
                <span className="lp-cheat-out">{cheat.render}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-section">
          <div className="lp-section-head">
            <h2 className="lp-h2">Four things, done properly</h2>
            <p className="lp-section-sub">
              Instead of forty things done in a settings panel nobody opens.
            </p>
          </div>

          <div className="lp-cards">
            {CARDS.map((card) => (
              <article className="lp-card" data-tone={card.tone} data-wide={card.wide} key={card.title}>
                <span className="lp-card-icon">
                  <card.icon size={20} />
                </span>
                <span className="lp-card-kicker">{card.kicker}</span>
                <h3 className="lp-card-title">{card.title}</h3>
                <p className="lp-card-body">{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-closer">
          <div className="lp-closer-inner">
            <span className="lp-closer-mark">
              <SlateMark size={44} />
            </span>
            <h2 className="lp-closer-title">Go on, write something down.</h2>
            <p className="lp-closer-sub">
              It takes about nine seconds to make an account, and roughly zero to start typing.
            </p>
            <button
              type="button"
              className="lp-btn lp-btn-honey lp-btn-lg"
              onClick={() => onLaunch('signUp')}
            >
              Open a blank note
              <ChevronRight size={17} />
            </button>
          </div>
        </section>
      </main>

      <footer className="lp-foot">
        <span className="lp-foot-brand">
          <SlateMark size={15} />
          Slate
        </span>
        <span>Built for people who think in plain text.</span>
      </footer>
    </div>
  )
}
