import { beforeEach, describe, expect, it } from 'vitest'
import { defaultPreferences, exportLibrary, loadLibrary, parseLibraryFile, saveLibrary } from './storage'
import { createNote } from './notes'

const KEY = 'slate.library.v1'
const LEGACY_KEY = 'bear.library.v1'

describe('loadLibrary', () => {
  beforeEach(() => localStorage.clear())

  it('returns null when nothing is stored', () => {
    expect(loadLibrary()).toBeNull()
  })

  it('round-trips saved preferences, filter and selection', () => {
    saveLibrary({
      preferences: { ...defaultPreferences, theme: 'dark', fontSize: 19 },
      filter: { kind: 'tag', tag: 'work' },
      selectedId: 'some-note-id',
    })

    const loaded = loadLibrary()
    expect(loaded?.preferences.theme).toBe('dark')
    expect(loaded?.preferences.fontSize).toBe(19)
    expect(loaded?.filter).toEqual({ kind: 'tag', tag: 'work' })
    expect(loaded?.selectedId).toBe('some-note-id')
  })

  it('survives corrupt JSON', () => {
    localStorage.setItem(KEY, '{not json')
    expect(loadLibrary()).toBeNull()
  })

  it('repairs malformed preferences and filter', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        preferences: { theme: 'chartreuse', fontSize: 900, sort: 'nonsense' },
        filter: { kind: 'tag' },
      }),
    )

    const loaded = loadLibrary()
    // Unknown values fall back to the defaults, sizes are clamped.
    expect(loaded?.preferences.theme).toBe(defaultPreferences.theme)
    expect(loaded?.preferences.sort).toBe(defaultPreferences.sort)
    expect(loaded?.preferences.fontSize).toBe(24)
    expect(loaded?.filter).toEqual({ kind: 'all' })
  })

  it('adopts preferences left under the pre-rename key', () => {
    localStorage.setItem(
      LEGACY_KEY,
      JSON.stringify({ preferences: { ...defaultPreferences, theme: 'dark' }, filter: { kind: 'all' } }),
    )

    expect(loadLibrary()?.preferences.theme).toBe('dark')
    // The value moves across, so the old key stops shadowing later writes.
    expect(localStorage.getItem(KEY)).not.toBeNull()
    expect(localStorage.getItem(LEGACY_KEY)).toBeNull()
  })

  it('carries a v1 sidebar flag through to the reinstated preference', () => {
    // v1 stored a pinned-sidebar flag, v2 retired it, v3 brought it back. A
    // v1 payload's explicit choice survives; the rest coerces as before.
    localStorage.setItem(
      KEY,
      JSON.stringify({ version: 1, preferences: { ...defaultPreferences, sidebarVisible: false, font: 'serif' } }),
    )

    const loaded = loadLibrary()
    expect(loaded?.preferences.sidebarVisible).toBe(false)
    expect(loaded?.preferences.font).toBe('sans')
  })

  it('shows the sidebar and note list when their preferences were never stored', () => {
    localStorage.setItem(KEY, JSON.stringify({ version: 2, preferences: { theme: 'dark' } }))
    expect(loadLibrary()?.preferences.listVisible).toBe(true)
    expect(loadLibrary()?.preferences.sidebarVisible).toBe(true)
  })

  it('prefers the current key when both are present', () => {
    localStorage.setItem(LEGACY_KEY, JSON.stringify({ preferences: { theme: 'dark' } }))
    localStorage.setItem(KEY, JSON.stringify({ preferences: { theme: 'light' } }))

    expect(loadLibrary()?.preferences.theme).toBe('light')
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

  it('drops malformed notes and repairs missing fields', () => {
    const parsed = parseLibraryFile(
      JSON.stringify({ notes: [{ id: 'a', text: 'kept' }, { text: 'no id' }, null, 42] }),
    )
    expect(parsed).toHaveLength(1)
    expect(parsed[0]).toMatchObject({ id: 'a', text: 'kept', pinned: false, trashedAt: null })
    expect(typeof parsed[0].createdAt).toBe('number')
  })

  it('rejects files with no usable notes', () => {
    expect(() => parseLibraryFile('{"notes":[]}')).toThrow()
    expect(() => parseLibraryFile('"nope"')).toThrow()
  })
})
