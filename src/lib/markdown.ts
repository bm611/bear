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
  font: 16px/1.65 "Anybody", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  color: #3b3742; background: #fff; overflow-wrap: break-word;
}
h1, h2, h3, h4 { line-height: 1.25; margin: 1.8em 0 .6em; }
h1 { font-size: 1.9rem } h2 { font-size: 1.5rem } h3 { font-size: 1.25rem }
a { color: #7b6cd6 }
blockquote { margin: 1em 0; padding: .2em 0 .2em 1em; border-left: 3px solid #e6e2da; color: #6b6577 }
code { font-family: "Space Mono", ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .9em;
  background: #f1edf9; padding: .15em .35em; border-radius: 4px }
pre { background: #f1edf9; padding: 1em; border-radius: 8px; overflow-x: auto }
pre code { background: none; padding: 0 }
mark { background: #faf0da; padding: 0 .15em }
hr { border: none; border-top: 1px solid #e6e2da; margin: 2em 0 }
img { max-width: 100% }
table { border-collapse: collapse; width: 100% }
th, td { border: 1px solid #e6e2da; padding: .45em .7em; text-align: left }
ul.contains-task-list { list-style: none; padding-left: 1.1em }
.md-hashtag { color: #7b6cd6; font-weight: 500 }
@media (prefers-color-scheme: dark) {
  body { color: #f2eff7; background: #191720 }
  code, pre { background: #2a2540 } mark { background: #4d4430; color: #fff }
  blockquote { border-color: #3a3547; color: #bcb5cc }
  th, td, hr { border-color: #3a3547 }
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
