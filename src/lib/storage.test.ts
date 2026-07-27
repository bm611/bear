import { beforeEach, describe, expect, it } from 'vitest'
import { defaultPreferences, exportLibrary, loadLibrary, parseLibraryFile, saveLibrary } from './storage'
import { createNote } from './notes'

const KEY = 'bear.library.v1'

describe('loadLibrary', () => {
  beforeEach(() => localStorage.clear())

  it('returns null when nothing is stored', () => {
    expect(loadLibrary()).toBeNull()
  })

  it('round-trips a saved library', () => {
    const notes = [createNote('One'), createNote('Two')]
    saveLibrary({
      notes,
      preferences: { ...defaultPreferences, theme: 'dark', fontSize: 19 },
      filter: { kind: 'tag', tag: 'work' },
      selectedId: notes[1].id,
    })

    const loaded = loadLibrary()
    expect(loaded?.notes.map((note) => note.text)).toEqual(['One', 'Two'])
    expect(loaded?.preferences.theme).toBe('dark')
    expect(loaded?.preferences.fontSize).toBe(19)
    expect(loaded?.filter).toEqual({ kind: 'tag', tag: 'work' })
    expect(loaded?.selectedId).toBe(notes[1].id)
  })

  it('survives corrupt JSON', () => {
    localStorage.setItem(KEY, '{not json')
    expect(loadLibrary()).toBeNull()
  })

  it('drops malformed notes and repairs missing fields', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        notes: [{ id: 'a', text: 'kept' }, { text: 'no id' }, null, 42],
        preferences: { theme: 'chartreuse', fontSize: 900, sort: 'nonsense' },
        filter: { kind: 'tag' },
      }),
    )

    const loaded = loadLibrary()
    expect(loaded?.notes).toHaveLength(1)
    expect(loaded?.notes[0]).toMatchObject({ id: 'a', text: 'kept', pinned: false, trashedAt: null })
    expect(typeof loaded?.notes[0].createdAt).toBe('number')
    // Unknown values fall back to the defaults, sizes are clamped.
    expect(loaded?.preferences.theme).toBe(defaultPreferences.theme)
    expect(loaded?.preferences.sort).toBe(defaultPreferences.sort)
    expect(loaded?.preferences.fontSize).toBe(24)
    expect(loaded?.filter).toEqual({ kind: 'all' })
  })

  it('remembers an empty library instead of re-seeding it', () => {
    saveLibrary({ notes: [], preferences: defaultPreferences, filter: { kind: 'all' }, selectedId: null })
    expect(loadLibrary()?.notes).toEqual([])
  })
})

describe('backup files', () => {
  it('exports and re-imports notes', () => {
    const notes = [createNote('Backed up')]
    const parsed = parseLibraryFile(exportLibrary(notes))
    expect(parsed.map((note) => note.text)).toEqual(['Backed up'])
  })

  it('accepts a bare array of notes', () => {
    expect(parseLibraryFile(JSON.stringify([{ id: 'x', text: 'bare' }]))).toHaveLength(1)
  })

  it('rejects files with no usable notes', () => {
    expect(() => parseLibraryFile('{"notes":[]}')).toThrow()
    expect(() => parseLibraryFile('"nope"')).toThrow()
  })
})
