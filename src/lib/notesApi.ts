import { supabase } from './supabaseClient'
import type { Note } from './types'

interface NoteRow {
  id: string
  user_id: string
  text: string
  created_at: string
  updated_at: string
  pinned: boolean
  archived: boolean
  trashed_at: string | null
}

function rowToNote(row: NoteRow): Note {
  return {
    id: row.id,
    text: row.text,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
    pinned: row.pinned,
    archived: row.archived,
    trashedAt: row.trashed_at ? new Date(row.trashed_at).getTime() : null,
  }
}

function noteToRow(note: Note, userId: string): NoteRow {
  return {
    id: note.id,
    user_id: userId,
    text: note.text,
    created_at: new Date(note.createdAt).toISOString(),
    updated_at: new Date(note.updatedAt).toISOString(),
    pinned: note.pinned,
    archived: note.archived,
    trashed_at: note.trashedAt ? new Date(note.trashedAt).toISOString() : null,
  }
}

export async function fetchNotes(userId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as NoteRow[]).map(rowToNote)
}

/** Seeds a brand new account with the welcome notes; returns them with server-assigned timestamps. */
export async function insertNotes(notes: Note[], userId: string): Promise<Note[]> {
  const rows = notes.map((note) => noteToRow(note, userId))
  const { data, error } = await supabase.from('notes').insert(rows).select()
  if (error) throw error
  return (data as NoteRow[]).map(rowToNote)
}

export async function upsertNotes(notes: Note[], userId: string): Promise<void> {
  if (notes.length === 0) return
  const rows = notes.map((note) => noteToRow(note, userId))
  const { error } = await supabase.from('notes').upsert(rows)
  if (error) throw error
}

export async function deleteNotes(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const { error } = await supabase.from('notes').delete().in('id', ids)
  if (error) throw error
}
