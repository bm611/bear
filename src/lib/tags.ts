import type { Note, TagNode } from './types'

/**
 * Text that should never be scanned for hashtags: fenced code blocks, inline
 * code, markdown link/image targets and bare URLs (so `example.com/a#b` and
 * `[spec](https://x/#anchor)` do not invent tags). Blanking rather than
 * removing keeps the result index-aligned with the original text.
 */
export function scannableText(text: string): string {
  const lines = text.split('\n')
  const out: string[] = []
  let fence: string | null = null

  const blank = (value: string) => ' '.repeat(value.length)

  for (const line of lines) {
    const fenceMatch = /^\s{0,3}(`{3,}|~{3,})/.exec(line)
    if (fence) {
      if (fenceMatch && fenceMatch[1].startsWith(fence)) fence = null
      out.push(blank(line))
      continue
    }
    if (fenceMatch) {
      fence = fenceMatch[1].slice(0, 3)
      out.push(blank(line))
      continue
    }
    out.push(
      line
        .replace(/`[^`]*`/g, blank)
        .replace(/\]\([^)\n]*\)/g, (m) => ']' + blank(m.slice(1)))
        .replace(/<[^>\s]+>/g, blank)
        .replace(/\b[a-z][a-z0-9+.-]*:\/\/\S+/gi, blank),
    )
  }
  return out.join('\n')
}

/**
 * Matches both hashtag flavours:
 *   `#tag`, `#nested/tag`   — a single run of non-space characters
 *   `#multi word tag#`      — spaces allowed when closed by a second `#`
 */
const TAG_RE = /(^|[\s>("'«])#(?:([^\s#][^#\n]*?)#(?=[\s.,;:!?)\]}"'»]|$)|([^\s#]+))/gu

const TRAILING_JUNK = /[.,;:!?*_~)\]}'"»/]+$/

export interface TagMatch {
  tag: string
  /** Offset of the opening `#`. */
  from: number
  /** Offset just past the tag (past the closing `#` for multi-word tags). */
  to: number
  multiWord: boolean
}

function normalizeTag(raw: string): string | null {
  const cleaned = raw.trim().replace(TRAILING_JUNK, '').replace(/\/{2,}/g, '/')
  if (!cleaned) return null
  // A tag needs at least one letter or digit — `#---` is not a tag.
  if (!/[\p{L}\p{N}]/u.test(cleaned)) return null
  return cleaned
}

/**
 * Locates every hashtag in `text` with its exact offsets. Pass text that has
 * already been through {@link scannableText} unless the caller knows by other
 * means (e.g. a syntax tree) that there is no code in it.
 */
export function matchTagRanges(text: string): TagMatch[] {
  const matches: TagMatch[] = []
  for (const match of text.matchAll(TAG_RE)) {
    const multiWord = match[2] !== undefined
    const raw = match[2] ?? match[3] ?? ''
    const tag = normalizeTag(raw)
    if (!tag) continue
    // Trailing punctuation belongs to the prose, not the tag.
    const body = multiWord ? raw : raw.replace(TRAILING_JUNK, '')
    const from = match.index + match[1].length
    matches.push({ tag, from, to: from + 1 + body.length + (multiWord ? 1 : 0), multiWord })
  }
  return matches
}

/** Every tag written in a note, in document order, without duplicates. */
export function parseTags(text: string): string[] {
  const found: string[] = []
  const seen = new Set<string>()
  for (const { tag } of matchTagRanges(scannableText(text))) {
    const key = tag.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    found.push(tag)
  }
  return found
}

/** `work/projects/slate` → [`work`, `work/projects`, `work/projects/slate`]. */
export function tagWithAncestors(tag: string): string[] {
  const parts = tag.split('/').filter(Boolean)
  return parts.map((_, i) => parts.slice(0, i + 1).join('/'))
}

/** True when `tag` is `filter` itself or nested underneath it. */
export function tagMatches(tag: string, filter: string): boolean {
  const a = tag.toLowerCase()
  const b = filter.toLowerCase()
  return a === b || a.startsWith(b + '/')
}

export function noteHasTag(note: Note, filter: string): boolean {
  return parseTags(note.text).some((tag) => tagMatches(tag, filter))
}

/**
 * Builds the nested sidebar tree. Counts include notes tagged with any
 * descendant, so `#work` shows everything filed under `work/*` too.
 */
export function buildTagTree(notes: Note[]): TagNode[] {
  const counts = new Map<string, { path: string; count: number }>()

  for (const note of notes) {
    const paths = new Set<string>()
    for (const tag of parseTags(note.text)) {
      for (const ancestor of tagWithAncestors(tag)) paths.add(ancestor)
    }
    for (const path of paths) {
      const key = path.toLowerCase()
      const entry = counts.get(key)
      if (entry) entry.count += 1
      else counts.set(key, { path, count: 1 })
    }
  }

  const nodes = new Map<string, TagNode>()
  const roots: TagNode[] = []

  for (const { path, count } of [...counts.values()].sort((a, b) => a.path.localeCompare(b.path))) {
    const segments = path.split('/')
    const node: TagNode = { path, name: segments[segments.length - 1], children: [], count }
    nodes.set(path.toLowerCase(), node)
    const parentPath = segments.slice(0, -1).join('/').toLowerCase()
    const parent = parentPath ? nodes.get(parentPath) : undefined
    if (parent) parent.children.push(node)
    else roots.push(node)
  }

  const sortTree = (list: TagNode[]) => {
    list.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
    for (const child of list) sortTree(child.children)
  }
  sortTree(roots)
  return roots
}

/** Rewrites `#from` (and everything nested under it) to `#to` inside a note. */
export function renameTagInText(text: string, from: string, to: string): string {
  return replaceTags(text, (tag) => (tagMatches(tag, from) ? to + tag.slice(from.length) : tag))
}

/** Strips `#from` and its descendants from a note, leaving the surrounding prose. */
export function removeTagFromText(text: string, target: string): string {
  return replaceTags(text, (tag) => (tagMatches(tag, target) ? null : tag))
}

/** Applies `map` to every hashtag in `text`; returning `null` deletes the tag. */
function replaceTags(text: string, map: (tag: string) => string | null): string {
  let result = ''
  let cursor = 0

  for (const match of matchTagRanges(scannableText(text))) {
    const next = map(match.tag)
    result += text.slice(cursor, match.from)
    if (next !== null) result += match.multiWord ? `#${next}#` : `#${next}`
    cursor = match.to
  }

  return (result + text.slice(cursor)).replace(/[ \t]+(\n|$)/g, '$1')
}
