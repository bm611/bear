import type { Filter, Note, Preferences } from './types'

const STORAGE_KEY = 'bear.library.v1'
const SCHEMA_VERSION = 1

export const defaultPreferences: Preferences = {
  theme: 'system',
  font: 'sans',
  fontSize: 17,
  sort: 'modified',
  sidebarVisible: true,
  listVisible: true,
}

export interface PersistedLibrary {
  version: number
  notes: Note[]
  preferences: Preferences
  filter: Filter
  selectedId: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function coerceNote(value: unknown): Note | null {
  if (!isRecord(value)) return null
  const { id, text, createdAt, updatedAt } = value
  if (typeof id !== 'string' || typeof text !== 'string') return null
  const created = typeof createdAt === 'number' ? createdAt : Date.now()
  return {
    id,
    text,
    createdAt: created,
    updatedAt: typeof updatedAt === 'number' ? updatedAt : created,
    pinned: value.pinned === true,
    archived: value.archived === true,
    trashedAt: typeof value.trashedAt === 'number' ? value.trashedAt : null,
  }
}

function coerceFilter(value: unknown): Filter {
  if (!isRecord(value) || typeof value.kind !== 'string') return { kind: 'all' }
  if (value.kind === 'tag') {
    return typeof value.tag === 'string' && value.tag ? { kind: 'tag', tag: value.tag } : { kind: 'all' }
  }
  const kinds = ['all', 'untagged', 'todo', 'today', 'archive', 'trash'] as const
  const kind = kinds.find((candidate) => candidate === value.kind)
  return kind ? { kind } : { kind: 'all' }
}

function coercePreferences(value: unknown): Preferences {
  if (!isRecord(value)) return { ...defaultPreferences }
  const themes = ['light', 'dark', 'system'] as const
  const fonts = ['sans', 'serif', 'mono'] as const
  const sorts = ['modified', 'created', 'title'] as const
  const size = typeof value.fontSize === 'number' ? value.fontSize : defaultPreferences.fontSize
  return {
    theme: themes.find((t) => t === value.theme) ?? defaultPreferences.theme,
    font: fonts.find((f) => f === value.font) ?? defaultPreferences.font,
    fontSize: Math.min(24, Math.max(13, Math.round(size))),
    sort: sorts.find((s) => s === value.sort) ?? defaultPreferences.sort,
    sidebarVisible: value.sidebarVisible !== false,
    listVisible: value.listVisible !== false,
  }
}

export function loadLibrary(): PersistedLibrary | null {
  if (typeof localStorage === 'undefined') return null
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
  if (!raw) return null

  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || !Array.isArray(parsed.notes)) return null
    const notes = parsed.notes.map(coerceNote).filter((note): note is Note => note !== null)
    return {
      version: SCHEMA_VERSION,
      notes,
      preferences: coercePreferences(parsed.preferences),
      filter: coerceFilter(parsed.filter),
      selectedId: typeof parsed.selectedId === 'string' ? parsed.selectedId : null,
    }
  } catch {
    return null
  }
}

export function saveLibrary(library: Omit<PersistedLibrary, 'version'>): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: SCHEMA_VERSION, ...library }))
  } catch {
    // Quota exceeded or private-mode storage — the session stays usable in memory.
  }
}

export function exportLibrary(notes: Note[]): string {
  return JSON.stringify({ version: SCHEMA_VERSION, exportedAt: Date.now(), notes }, null, 2)
}

/** Reads a `bear-notes.json` backup back into a list of notes. */
export function parseLibraryFile(contents: string): Note[] {
  const parsed: unknown = JSON.parse(contents)
  const list = isRecord(parsed) && Array.isArray(parsed.notes) ? parsed.notes : parsed
  if (!Array.isArray(list)) throw new Error('Unrecognised backup file')
  const notes = list.map(coerceNote).filter((note): note is Note => note !== null)
  if (notes.length === 0) throw new Error('No notes found in backup')
  return notes
}
