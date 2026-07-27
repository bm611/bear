import { create } from 'zustand'
import type { Filter, Note, Preferences, SortMode } from '../lib/types'
import { createNote, isEmptyNote, sortNotes } from '../lib/notes'
import { matchesFilter } from '../lib/search'
import { removeTagFromText, renameTagInText } from '../lib/tags'
import { defaultPreferences, loadLibrary, saveLibrary } from '../lib/storage'
import { welcomeNotes } from '../lib/welcome'
import { deleteNotes, fetchNotes, insertNotes, upsertNotes } from '../lib/notesApi'

export interface StoreState {
  notes: Note[]
  filter: Filter
  selectedId: string | null
  query: string
  preferences: Preferences
  /** Transient toast message shown in the bottom-right corner. */
  toast: { id: number; message: string } | null
  /** Whether `notes` reflects the signed-in user's Supabase data yet. Gates sync-back writes. */
  notesHydrated: boolean

  hydrateNotes: (userId: string) => Promise<void>
  resetNotes: () => void
  newNote: (text?: string) => string
  updateNoteText: (id: string, text: string) => void
  selectNote: (id: string | null) => void
  setFilter: (filter: Filter) => void
  setQuery: (query: string) => void

  togglePin: (id: string) => void
  toggleArchive: (id: string) => void
  trashNote: (id: string) => void
  restoreNote: (id: string) => void
  deleteForever: (id: string) => void
  emptyTrash: () => void
  duplicateNote: (id: string) => void

  renameTag: (from: string, to: string) => void
  deleteTag: (tag: string) => void

  setPreferences: (patch: Partial<Preferences>) => void
  importNotes: (notes: Note[]) => number
  showToast: (message: string) => void
  dismissToast: () => void
}

const persisted = loadLibrary()

/** A brand new note inherits the tag you are currently browsing, like Bear does. */
function seedTextForFilter(filter: Filter): string {
  return filter.kind === 'tag' ? `# \n\n#${filter.tag}` : '# '
}

function touch(note: Note, text: string): Note {
  return { ...note, text, updatedAt: Date.now() }
}

export const useStore = create<StoreState>((set, get) => ({
  notes: [],
  filter: persisted?.filter ?? { kind: 'all' },
  selectedId: persisted?.selectedId ?? null,
  query: '',
  preferences: persisted?.preferences ?? { ...defaultPreferences },
  toast: null,
  notesHydrated: false,

  hydrateNotes: async (userId) => {
    let notes = await fetchNotes(userId)
    if (notes.length === 0) notes = await insertNotes(welcomeNotes(), userId)
    currentUserId = userId
    markSynced(notes)
    set((state) => ({
      notes,
      notesHydrated: true,
      selectedId: notes.some((note) => note.id === state.selectedId) ? state.selectedId : (notes[0]?.id ?? null),
    }))
  },

  resetNotes: () => {
    currentUserId = null
    markSynced([])
    set({ notes: [], notesHydrated: false, selectedId: null })
  },

  newNote: (text) => {
    const seeded = text ?? seedTextForFilter(get().filter)
    const note = createNote(seeded)
    set((state) => ({
      notes: [note, ...discardEmptyDraft(state.notes, state.selectedId)],
      selectedId: note.id,
      query: '',
    }))
    return note.id
  },

  updateNoteText: (id, text) =>
    set((state) => {
      const current = state.notes.find((note) => note.id === id)
      // Programmatic re-syncs must not bump `updatedAt` and reshuffle the list.
      if (!current || current.text === text) return state
      return { notes: state.notes.map((note) => (note.id === id ? touch(note, text) : note)) }
    }),

  selectNote: (id) =>
    set((state) => ({
      notes: id === state.selectedId ? state.notes : discardEmptyDraft(state.notes, state.selectedId),
      selectedId: id,
    })),

  setFilter: (filter) =>
    set((state) => {
      const notes = discardEmptyDraft(state.notes, state.selectedId)
      const current = notes.find((note) => note.id === state.selectedId)
      // Stay on the open note when it belongs to the new list — clicking one of
      // its own hashtags should not navigate away — otherwise open the first.
      const keep = current && matchesFilter(current, filter)
      return {
        filter,
        notes,
        selectedId: keep ? state.selectedId : firstMatch(notes, filter, state.preferences.sort),
      }
    }),

  setQuery: (query) => set({ query }),

  togglePin: (id) =>
    set((state) => ({
      notes: state.notes.map((note) => (note.id === id ? { ...note, pinned: !note.pinned } : note)),
    })),

  toggleArchive: (id) =>
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, archived: !note.archived, trashedAt: null } : note,
      ),
    })),

  trashNote: (id) =>
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, trashedAt: Date.now(), pinned: false } : note,
      ),
      selectedId:
        state.selectedId === id ? nextSelection(state.notes, id, state.filter) : state.selectedId,
    })),

  restoreNote: (id) =>
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, trashedAt: null, archived: false } : note,
      ),
    })),

  deleteForever: (id) =>
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
      selectedId:
        state.selectedId === id ? nextSelection(state.notes, id, state.filter) : state.selectedId,
    })),

  emptyTrash: () =>
    set((state) => {
      const kept = state.notes.filter((note) => note.trashedAt === null)
      const selectionSurvives = kept.some((note) => note.id === state.selectedId)
      return { notes: kept, selectedId: selectionSurvives ? state.selectedId : (kept[0]?.id ?? null) }
    }),

  duplicateNote: (id) =>
    set((state) => {
      const source = state.notes.find((note) => note.id === id)
      if (!source) return state
      const copy = createNote(source.text)
      return { notes: [copy, ...state.notes], selectedId: copy.id }
    }),

  renameTag: (from, to) => {
    const target = to.trim().replace(/^#+/, '').replace(/\s+/g, '-')
    if (!target || target === from) return
    set((state) => ({
      notes: state.notes.map((note) => {
        const text = renameTagInText(note.text, from, target)
        return text === note.text ? note : touch(note, text)
      }),
      filter: state.filter.kind === 'tag' && state.filter.tag === from ? { kind: 'tag', tag: target } : state.filter,
    }))
    get().showToast(`Renamed #${from} to #${target}`)
  },

  deleteTag: (tag) => {
    set((state) => ({
      notes: state.notes.map((note) => {
        const text = removeTagFromText(note.text, tag)
        return text === note.text ? note : touch(note, text)
      }),
      filter: state.filter.kind === 'tag' && state.filter.tag === tag ? { kind: 'all' } : state.filter,
    }))
    get().showToast(`Removed #${tag} from all notes`)
  },

  setPreferences: (patch) => set((state) => ({ preferences: { ...state.preferences, ...patch } })),

  importNotes: (incoming) => {
    const existing = new Set(get().notes.map((note) => note.id))
    const fresh = incoming.map((note) => (existing.has(note.id) ? { ...note, id: createNote().id } : note))
    set((state) => ({ notes: [...fresh, ...state.notes], selectedId: fresh[0]?.id ?? state.selectedId }))
    return fresh.length
  },

  showToast: (message) => set({ toast: { id: Date.now(), message } }),
  dismissToast: () => set({ toast: null }),
}))

/** Notes are throwaway until you type something, so blank drafts self-destruct. */
function discardEmptyDraft(notes: Note[], draftId: string | null): Note[] {
  if (!draftId) return notes
  const draft = notes.find((note) => note.id === draftId)
  if (!draft || !isEmptyNote(draft)) return notes
  return notes.filter((note) => note.id !== draftId)
}

/** The first note of a filter, in the order the list shows them. */
function firstMatch(notes: Note[], filter: Filter, sort: SortMode): string | null {
  const matching = notes.filter((note) => matchesFilter(note, filter))
  return sortNotes(matching, sort)[0]?.id ?? null
}

/** After removing a note, fall back to its neighbour in the same list. */
function nextSelection(notes: Note[], removedId: string, filter: Filter): string | null {
  const siblings = notes.filter((note) => matchesFilter(note, filter))
  const index = siblings.findIndex((note) => note.id === removedId)
  const remaining = siblings.filter((note) => note.id !== removedId)
  if (remaining.length === 0) return null
  return (remaining[index] ?? remaining[remaining.length - 1]).id
}

let saveTimer: ReturnType<typeof setTimeout> | undefined
let notesSyncTimer: ReturnType<typeof setTimeout> | undefined
let currentUserId: string | null = null
let lastSyncedNotes: Note[] = []

/** Marks `notes` as already reflecting Supabase, so the sync-back effect skips it. */
function markSynced(notes: Note[]) {
  lastSyncedNotes = notes
}

useStore.subscribe((state) => {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveLibrary({
      preferences: state.preferences,
      filter: state.filter,
      selectedId: state.selectedId,
    })
  }, 400)

  if (!state.notesHydrated || !currentUserId || state.notes === lastSyncedNotes) return
  const notes = state.notes
  const userId = currentUserId
  clearTimeout(notesSyncTimer)
  notesSyncTimer = setTimeout(() => {
    const previous = lastSyncedNotes
    const currentIds = new Set(notes.map((note) => note.id))
    const removedIds = previous.filter((note) => !currentIds.has(note.id)).map((note) => note.id)
    const changed = notes.filter((note) => previous.find((prev) => prev.id === note.id) !== note)
    markSynced(notes)
    void Promise.all([deleteNotes(removedIds), upsertNotes(changed, userId)]).catch((error) => {
      console.error('Failed to sync notes to Supabase', error)
    })
  }, 400)
})

export function selectedNote(state: StoreState): Note | null {
  return state.notes.find((note) => note.id === state.selectedId) ?? null
}
