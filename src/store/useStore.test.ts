import { beforeEach, describe, expect, it } from 'vitest'
import { useStore } from './useStore'
import { createNote, noteTitle } from '../lib/notes'
import type { Note } from '../lib/types'

function reset(notes: Note[] = []) {
  useStore.setState({
    notes,
    filter: { kind: 'all' },
    selectedId: notes[0]?.id ?? null,
    query: '',
    toast: null,
  })
}

const get = () => useStore.getState()

describe('note lifecycle', () => {
  beforeEach(() => reset())

  it('creates and selects a note', () => {
    const id = get().newNote('Hello')
    expect(get().notes).toHaveLength(1)
    expect(get().selectedId).toBe(id)
  })

  it('starts a blank note with an H1 title line', () => {
    get().newNote()
    expect(get().notes[0].text).toBe('# ')
  })

  it('seeds a new note with the tag being browsed', () => {
    get().setFilter({ kind: 'tag', tag: 'work/admin' })
    get().newNote()
    expect(get().notes[0].text).toContain('#work/admin')
  })

  it('discards a blank draft when another note is opened', () => {
    const kept = createNote('Real note')
    reset([kept])
    const draftId = get().newNote()
    expect(get().notes).toHaveLength(2)

    get().selectNote(kept.id)
    expect(get().notes.map((note) => note.id)).not.toContain(draftId)
  })

  it('keeps a draft that has content', () => {
    const kept = createNote('Real note')
    reset([kept])
    const draftId = get().newNote()
    get().updateNoteText(draftId, 'now it has words')
    get().selectNote(kept.id)
    expect(get().notes.map((note) => note.id)).toContain(draftId)
  })

  it('ignores a no-op text update so the list does not reshuffle', () => {
    const note = createNote('Same')
    reset([note])
    const before = get().notes[0]
    get().updateNoteText(note.id, 'Same')
    expect(get().notes[0]).toBe(before)
  })

  it('bumps updatedAt on a real edit', () => {
    const note = { ...createNote('Old'), updatedAt: 1_000 }
    reset([note])
    get().updateNoteText(note.id, 'New')
    expect(get().notes[0].updatedAt).toBeGreaterThan(1_000)
  })
})

describe('changing filter', () => {
  it('keeps the open note when it belongs to the new list', () => {
    const tagged = createNote('Open me #work')
    const other = createNote('Something else #work')
    reset([other, tagged])
    useStore.setState({ selectedId: tagged.id })

    get().setFilter({ kind: 'tag', tag: 'work' })
    expect(get().selectedId).toBe(tagged.id)
  })

  it('opens the first note of the new list when the open one does not belong', () => {
    const home = createNote('Home note #home')
    const work = createNote('Work note #work')
    reset([home, work])
    useStore.setState({ selectedId: home.id })

    get().setFilter({ kind: 'tag', tag: 'work' })
    expect(get().selectedId).toBe(work.id)
  })

  it('selects nothing when the new list is empty', () => {
    const note = createNote('Only note')
    reset([note])
    get().setFilter({ kind: 'trash' })
    expect(get().selectedId).toBeNull()
  })
})

describe('trash and archive', () => {
  it('moves a note to trash, unpinning it, then restores it', () => {
    const note = { ...createNote('Doomed'), pinned: true }
    reset([note])

    get().trashNote(note.id)
    expect(get().notes[0].trashedAt).not.toBeNull()
    expect(get().notes[0].pinned).toBe(false)

    get().restoreNote(note.id)
    expect(get().notes[0].trashedAt).toBeNull()
  })

  it('selects a neighbour after trashing the open note', () => {
    const first = createNote('First')
    const second = createNote('Second')
    reset([first, second])

    get().trashNote(first.id)
    expect(get().selectedId).toBe(second.id)
  })

  it('empties the trash but keeps live notes', () => {
    const live = createNote('Live')
    const dead = { ...createNote('Dead'), trashedAt: Date.now() }
    reset([live, dead])

    get().emptyTrash()
    expect(get().notes.map(noteTitle)).toEqual(['Live'])
    expect(get().selectedId).toBe(live.id)
  })

  it('un-trashes a note when archiving it', () => {
    const note = { ...createNote('Both'), trashedAt: Date.now() }
    reset([note])
    get().toggleArchive(note.id)
    expect(get().notes[0]).toMatchObject({ archived: true, trashedAt: null })
  })

  it('deletes permanently', () => {
    const note = createNote('Gone')
    reset([note])
    get().deleteForever(note.id)
    expect(get().notes).toHaveLength(0)
    expect(get().selectedId).toBeNull()
  })
})

describe('tag maintenance', () => {
  it('renames a tag across every note and follows the filter', () => {
    reset([createNote('a #work'), createNote('b #work/admin'), createNote('c #home')])
    get().setFilter({ kind: 'tag', tag: 'work' })
    get().renameTag('work', 'job')

    expect(get().notes.map((note) => note.text)).toEqual(['a #job', 'b #job/admin', 'c #home'])
    expect(get().filter).toEqual({ kind: 'tag', tag: 'job' })
  })

  it('normalises a renamed tag', () => {
    reset([createNote('a #work')])
    get().renameTag('work', '  #day job ')
    expect(get().notes[0].text).toBe('a #day-job')
  })

  it('removes a tag from every note and resets the filter', () => {
    reset([createNote('keep me #work'), createNote('untouched #home')])
    get().setFilter({ kind: 'tag', tag: 'work' })
    get().deleteTag('work')

    expect(get().notes[0].text).toBe('keep me')
    expect(get().notes[1].text).toBe('untouched #home')
    expect(get().filter).toEqual({ kind: 'all' })
  })
})

describe('import', () => {
  it('re-ids colliding notes so nothing is overwritten', () => {
    const existing = createNote('Existing')
    reset([existing])
    const added = get().importNotes([{ ...existing, text: 'Imported copy' }])

    expect(added).toBe(1)
    expect(get().notes).toHaveLength(2)
    expect(new Set(get().notes.map((note) => note.id)).size).toBe(2)
  })
})
