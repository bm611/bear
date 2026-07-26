import { describe, expect, it } from 'vitest'
import { matchesFilter, matchesQuery, parseQuery, visibleNotes } from './search'
import { createNote, noteTitle, startOfToday } from './notes'
import type { Note } from './types'

function note(text: string, overrides: Partial<Note> = {}): Note {
  return { ...createNote(text), ...overrides }
}

describe('parseQuery', () => {
  it('splits terms, quoted phrases and tags', () => {
    expect(parseQuery('milk "shopping list" #errands')).toEqual({
      terms: ['milk', 'shopping list'],
      tags: ['errands'],
    })
  })

  it('accepts the closing hash of a multi-word tag', () => {
    expect(parseQuery('#reading#').tags).toEqual(['reading'])
  })
})

describe('matchesQuery', () => {
  const target = note('Weekend plans\nBuy coffee beans #errands #shopping')

  it('requires every term', () => {
    expect(matchesQuery(target, parseQuery('coffee beans'))).toBe(true)
    expect(matchesQuery(target, parseQuery('coffee tea'))).toBe(false)
  })

  it('is case insensitive', () => {
    expect(matchesQuery(target, parseQuery('WEEKEND'))).toBe(true)
  })

  it('filters by tag, including nested tags', () => {
    expect(matchesQuery(target, parseQuery('#errands'))).toBe(true)
    expect(matchesQuery(target, parseQuery('#work'))).toBe(false)
    expect(matchesQuery(note('#work/admin'), parseQuery('#work'))).toBe(true)
  })
})

describe('matchesFilter', () => {
  const now = Date.now()
  const plain = note('Plain note')
  const tagged = note('Tagged #work')
  const archived = note('Archived', { archived: true })
  const trashed = note('Trashed', { trashedAt: now })
  const todo = note('Todo\n- [ ] open')
  const doneTodo = note('Done\n- [x] closed')
  const old = note('Old', { updatedAt: startOfToday(now) - 1 })

  it('hides archived and trashed notes from the main list', () => {
    expect(matchesFilter(plain, { kind: 'all' }, now)).toBe(true)
    expect(matchesFilter(archived, { kind: 'all' }, now)).toBe(false)
    expect(matchesFilter(trashed, { kind: 'all' }, now)).toBe(false)
  })

  it('shows archived notes only in the archive', () => {
    expect(matchesFilter(archived, { kind: 'archive' }, now)).toBe(true)
    expect(matchesFilter(plain, { kind: 'archive' }, now)).toBe(false)
  })

  it('shows trashed notes only in the trash', () => {
    expect(matchesFilter(trashed, { kind: 'trash' }, now)).toBe(true)
    expect(matchesFilter(archived, { kind: 'trash' }, now)).toBe(false)
  })

  it('collects untagged notes', () => {
    expect(matchesFilter(plain, { kind: 'untagged' }, now)).toBe(true)
    expect(matchesFilter(tagged, { kind: 'untagged' }, now)).toBe(false)
  })

  it('collects notes with an open todo', () => {
    expect(matchesFilter(todo, { kind: 'todo' }, now)).toBe(true)
    expect(matchesFilter(doneTodo, { kind: 'todo' }, now)).toBe(false)
  })

  it('collects notes edited today', () => {
    expect(matchesFilter(plain, { kind: 'today' }, now)).toBe(true)
    expect(matchesFilter(old, { kind: 'today' }, now)).toBe(false)
  })

  it('matches a tag filter through the hierarchy', () => {
    expect(matchesFilter(note('#work/admin'), { kind: 'tag', tag: 'work' }, now)).toBe(true)
    expect(matchesFilter(tagged, { kind: 'tag', tag: 'home' }, now)).toBe(false)
  })
})

describe('visibleNotes', () => {
  const notes = [note('Coffee #errands'), note('Tea #errands'), note('Archived coffee', { archived: true })]

  it('combines filter and search', () => {
    expect(visibleNotes(notes, { kind: 'tag', tag: 'errands' }, 'coffee').map(noteTitle)).toEqual([
      'Coffee #errands',
    ])
  })

  it('returns everything when the query is blank', () => {
    expect(visibleNotes(notes, { kind: 'all' }, '   ')).toHaveLength(2)
  })
})
