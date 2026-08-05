import type { AuthMode } from './AuthScreen'
import { SlateMark } from './Icons'

const NOTES = ['Field notes / August', 'A better weekly review', 'Books to revisit', 'Sourdough, take five']

function ProductPreview() {
  return (
    <div className="lp-product" aria-label="Preview of the Slate editor">
      <aside className="lp-product-nav">
        <span className="lp-product-brand"><SlateMark size={15} /> Slate</span>
        <span className="lp-product-new">＋ New note</span>
        <span className="lp-product-label">Notes</span>
        <span>All notes</span><span>Pinned</span><span>Todo</span>
        <span className="lp-product-label">Tags</span>
        <span>#writing</span><span>#recipes</span>
      </aside>
      <div className="lp-product-list">
        <span className="lp-product-search">Search notes</span>
        {NOTES.map((note, index) => (
          <span className="lp-product-note" data-active={index === 0 ? 'true' : undefined} key={note}>
            <strong>{note}</strong><small>{index === 0 ? 'Just now' : `${index + 1} days ago`}</small>
          </span>
        ))}
      </div>
      <article className="lp-product-editor">
        <span className="lp-product-meta">NOTES / JUST NOW</span>
        <h2>Field notes / August</h2>
        <p>The best ideas rarely arrive finished. Give them somewhere quiet to become clear.</p>
        <p><strong>Things worth keeping:</strong></p>
        <p className="lp-product-todo">✓ A sentence from the train</p>
        <p className="lp-product-todo">□ The shape of the next project</p>
        <p><mark>#writing</mark> <mark>#ideas</mark></p>
        <span className="lp-product-saved">● Saved</span>
      </article>
    </div>
  )
}

export function LandingScreen({ onLaunch }: { onLaunch: (mode: AuthMode) => void }) {
  return (
    <div className="lp" id="top">
      <header className="lp-nav">
        <a className="lp-logo" href="#top"><span className="lp-logo-mark"><SlateMark /></span><span>Slate</span></a>
        <nav className="lp-nav-links" aria-label="Main navigation"><a href="#principles">Principles</a><a href="#markdown">Markdown</a></nav>
        <div className="lp-nav-actions"><button className="lp-link" onClick={() => onLaunch('signIn')}>Sign in</button><button className="lp-btn lp-btn-sm" onClick={() => onLaunch('signUp')}>Start writing</button></div>
      </header>

      <main>
        <section className="lp-hero">
          <div className="lp-hero-copy">
            <p className="lp-kicker">A private place for unfinished thoughts</p>
            <h1 className="lp-title">Notes without<br /><em>the noise.</em></h1>
            <p className="lp-lede">A fast, focused notebook for plain-text people. Write in Markdown, organize with tags, and find every thought when you need it.</p>
            <div className="lp-cta-group"><button className="lp-btn lp-btn-lg" onClick={() => onLaunch('signUp')}>Start writing — it’s free</button><button className="lp-text-btn" onClick={() => onLaunch('signIn')}>I already have an account →</button></div>
            <p className="lp-fineprint">No credit card. No onboarding maze. Your notes stay yours.</p>
          </div>
          <div className="lp-hero-index" aria-hidden="true"><span>SLATE / 01</span><span>WRITE FIRST</span></div>
        </section>

        <section className="lp-preview-wrap"><ProductPreview /></section>

        <section className="lp-principles" id="principles">
          <div className="lp-section-intro"><p className="lp-kicker">The essentials</p><h2>Everything a notebook needs.<br />Nothing it doesn’t.</h2></div>
          <div className="lp-principle-grid">
            <article><span>01</span><h3>Plain text, always</h3><p>Your writing remains portable Markdown—not a proprietary format waiting to become obsolete.</p></article>
            <article><span>02</span><h3>Tags over filing</h3><p>Add a hashtag while you write. One note can belong wherever your thinking takes it.</p></article>
            <article><span>03</span><h3>Quietly in sync</h3><p>Open another device and continue mid-sentence. Save state is always visible, never mysterious.</p></article>
          </div>
        </section>

        <section className="lp-markdown" id="markdown">
          <div><p className="lp-kicker">Markdown, made human</p><h2>The source and the page are the same thing.</h2><p>Headings grow, todos become checkboxes, and tags become navigation—all while your note stays editable plain text.</p></div>
          <div className="lp-syntax-card"><code># A useful thought</code><strong>A useful thought</strong><code>- [ ] Follow the thread</code><span>□ Follow the thread</span><code>#research</code><mark>#research</mark></div>
        </section>

        <section className="lp-closer"><p className="lp-kicker">Begin anywhere</p><h2>Make room for the next thought.</h2><button className="lp-btn lp-btn-light lp-btn-lg" onClick={() => onLaunch('signUp')}>Open a blank note</button></section>
      </main>

      <footer className="lp-foot"><span className="lp-logo"><span className="lp-logo-mark"><SlateMark /></span><span>Slate</span></span><span>Plain text · Thoughtfully kept</span><button onClick={() => onLaunch('signIn')}>Sign in</button></footer>
    </div>
  )
}
