import type { Filter, Note } from './types'
import { hasOpenTodo, noteTags, noteTitle, startOfToday } from './notes'
import { tagMatches } from './tags'

export interface ParsedQuery {
  terms: string[]
  tags: string[]
}

/** Splits a query into bare terms, `"quoted phrases"` and `#tag` filters. */
export function parseQuery(query: string): ParsedQuery {
  const terms: string[] = []
  const tags: string[] = []
  const tokens = query.match(/"[^"]*"|\S+/g) ?? []

  for (const token of tokens) {
    if (token.startsWith('#') && token.length > 1) {
      tags.push(token.slice(1).replace(/#$/, '').toLowerCase())
      continue
    }
    const value = token.startsWith('"') ? token.replace(/"/g, '') : token
    if (value.trim()) terms.push(value.toLowerCase())
  }
  return { terms, tags }
}

export function matchesQuery(note: Note, query: ParsedQuery): boolean {
  const haystack = note.text.toLowerCase()
  if (!query.terms.every((term) => haystack.includes(term))) return false
  if (query.tags.length === 0) return true
  const tags = noteTags(note)
  return query.tags.every((wanted) => tags.some((tag) => tagMatches(tag, wanted)))
}

export function matchesFilter(note: Note, filter: Filter, now = Date.now()): boolean {
  const trashed = note.trashedAt !== null
  if (filter.kind === 'trash') return trashed
  if (trashed) return false
  if (filter.kind === 'archive') return note.archived
  if (note.archived) return false

  switch (filter.kind) {
    case 'all':
      return true
    case 'untagged':
      return noteTags(note).length === 0
    case 'todo':
      return hasOpenTodo(note.text)
    case 'today':
      return note.updatedAt >= startOfToday(now)
    case 'tag':
      return noteTags(note).some((tag) => tagMatches(tag, filter.tag))
    default:
      return true
  }
}

/** Notes visible for the current library selection and search box. */
export function visibleNotes(notes: Note[], filter: Filter, query: string, now = Date.now()): Note[] {
  const parsed = parseQuery(query)
  const searching = parsed.terms.length > 0 || parsed.tags.length > 0
  return notes.filter((note) => {
    if (!matchesFilter(note, filter, now)) return false
    return !searching || matchesQuery(note, parsed)
  })
}

/** Ranks a search hit — title matches float to the top. */
export function searchScore(note: Note, query: ParsedQuery): number {
  if (query.terms.length === 0) return 0
  const title = noteTitle(note).toLowerCase()
  return query.terms.reduce((score, term) => {
    if (title.startsWith(term)) return score + 3
    if (title.includes(term)) return score + 2
    return score
  }, 0)
}
