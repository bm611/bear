import { Marked, type Token, type Tokens, type TokenizerAndRendererExtension } from 'marked'
import DOMPurify from 'dompurify'

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** True when the previous inline token ends mid-word, e.g. the `#` in `a#b`. */
function precededByWord(tokens: Token[] | undefined): boolean {
  const previous = tokens?.[tokens.length - 1]
  if (!previous || typeof previous.raw !== 'string' || !previous.raw) return false
  return !/[\s>("'«]$/.test(previous.raw)
}

interface HashtagToken extends Tokens.Generic {
  type: 'hashtag'
  raw: string
  tag: string
}

const hashtag: TokenizerAndRendererExtension = {
  name: 'hashtag',
  level: 'inline',
  start: (src: string) => src.indexOf('#'),
  tokenizer(src, tokens) {
    if (precededByWord(tokens)) return undefined
    const multi = /^#([^\s#][^#\n]*?)#(?=[\s.,;:!?)\]}"'»]|$)/.exec(src)
    const single = multi ?? /^#([^\s#]+)/.exec(src)
    if (!single) return undefined
    const tag = single[1].replace(/[.,;:!?*_~)\]}'"»/]+$/, '')
    if (!tag || !/[\p{L}\p{N}]/u.test(tag)) return undefined
    const raw = multi ? single[0] : `#${tag}`
    const token: HashtagToken = { type: 'hashtag', raw, tag }
    return token
  },
  renderer(token) {
    return `<span class="md-hashtag">#${escapeHtml((token as HashtagToken).tag)}</span>`
  },
}

interface HighlightToken extends Tokens.Generic {
  type: 'highlight'
  raw: string
  text: string
  tokens: Token[]
}

/** The `==highlighted==` syntax. */
const highlight: TokenizerAndRendererExtension = {
  name: 'highlight',
  level: 'inline',
  start: (src: string) => src.indexOf('=='),
  tokenizer(src) {
    const match = /^==(?=\S)([\s\S]*?\S)==/.exec(src)
    if (!match) return undefined
    const token: HighlightToken = {
      type: 'highlight',
      raw: match[0],
      text: match[1],
      tokens: this.lexer.inlineTokens(match[1]),
    }
    return token
  },
  renderer(token) {
    return `<mark>${this.parser.parseInline((token as HighlightToken).tokens)}</mark>`
  },
}

const marked = new Marked({ gfm: true, breaks: true }).use({
  extensions: [hashtag, highlight],
})

/** Markdown → sanitised HTML for standalone HTML export. */
export function renderMarkdown(text: string): string {
  const html = marked.parse(text, { async: false })
  if (typeof window === 'undefined') return html
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })
}

const EXPORT_CSS = `
:root { color-scheme: light dark; }
body {
  margin: 0 auto; padding: 3rem 1.5rem; max-width: 44rem;
  font: 16px/1.65 "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  color: #1a1a1a; background: #fdf6e3; overflow-wrap: break-word;
}
h1, h2, h3, h4 { line-height: 1.2; margin: 1.8em 0 .6em; font-weight: 800; letter-spacing: -.015em }
h1 { font-size: 1.9rem } h2 { font-size: 1.5rem } h3 { font-size: 1.25rem }
a { color: #2e63d8; text-decoration-thickness: 2px; text-underline-offset: 2px }
blockquote { margin: 1em 0; padding: .2em 0 .2em 1em; border-left: 3px solid #1a1a1a; color: rgba(26,26,26,.64) }
code { font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .88em;
  background: #f5ead0; padding: .15em .35em; border-radius: 4px }
pre { background: #f5ead0; padding: 1em; border: 2px solid #1a1a1a; border-radius: 10px; overflow-x: auto }
pre code { background: none; padding: 0 }
mark { background: #ffd93d; padding: 0 .15em }
hr { border: none; border-top: 2px solid #1a1a1a; margin: 2em 0 }
img { max-width: 100% }
table { border-collapse: collapse; width: 100%; border: 2px solid #1a1a1a; border-radius: 8px }
th, td { border: 1px solid rgba(26,26,26,.2); padding: .45em .7em; text-align: left }
th { background: #f5ead0 }
ul.contains-task-list { list-style: none; padding-left: 1.1em }
.md-hashtag { background: #5b9dff; color: #1a1a1a; border: 1.5px solid #1a1a1a; border-radius: 6px;
  padding: 0 .3em; font-weight: 700 }
@media (prefers-color-scheme: dark) {
  body { color: #f5ead0; background: #17140e }
  a { color: #9abdff }
  blockquote { border-color: #f5ead0; color: rgba(245,234,208,.64) }
  code, pre { background: #2c2617 } pre { border-color: #f5ead0 }
  mark { background: rgba(255,217,61,.35) }
  hr { border-color: #f5ead0 }
  table { border-color: #f5ead0 }
  th, td { border-color: rgba(245,234,208,.2) }
  th { background: #2c2617 }
}
`.trim()

/** A standalone HTML document for a single note. */
export function exportNoteHtml(title: string, text: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${EXPORT_CSS}</style>
</head>
<body>
${renderMarkdown(text)}
</body>
</html>
`
}

/** Filesystem-safe file name derived from a note title. */
export function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return slug || 'note'
}
