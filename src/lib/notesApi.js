import { supabase } from './supabaseClient';
function rowToNote(row) {
    return {
        id: row.id,
        text: row.text,
        createdAt: new Date(row.created_at).getTime(),
        updatedAt: new Date(row.updated_at).getTime(),
        pinned: row.pinned,
        archived: row.archived,
        trashedAt: row.trashed_at ? new Date(row.trashed_at).getTime() : null,
    };
}
function noteToRow(note, userId) {
    return {
        id: note.id,
        user_id: userId,
        text: note.text,
        created_at: new Date(note.createdAt).toISOString(),
        updated_at: new Date(note.updatedAt).toISOString(),
        pinned: note.pinned,
        archived: note.archived,
        trashed_at: note.trashedAt ? new Date(note.trashedAt).toISOString() : null,
    };
}
export async function fetchNotes(userId) {
    const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data.map(rowToNote);
}
/** Seeds a brand new account with the welcome notes; returns them with server-assigned timestamps. */
export async function insertNotes(notes, userId) {
    const rows = notes.map((note) => noteToRow(note, userId));
    const { data, error } = await supabase.from('notes').insert(rows).select();
    if (error)
        throw error;
    return data.map(rowToNote);
}
export async function upsertNotes(notes, userId) {
    if (notes.length === 0)
        return;
    const rows = notes.map((note) => noteToRow(note, userId));
    const { error } = await supabase.from('notes').upsert(rows);
    if (error)
        throw error;
}
export async function deleteNotes(ids) {
    if (ids.length === 0)
        return;
    const { error } = await supabase.from('notes').delete().in('id', ids);
    if (error)
        throw error;
}
