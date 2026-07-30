# Slate

A markdown note-taking app. Notes sync to the cloud when signed in; the library is browsed by smart filters and a nested tag tree derived from hashtags in note text.

## Language

**Note**:
A single markdown document — the unit of writing, storage, and sync. There is no separate title field; the note is one continuous text.
_Avoid_: Document, entry, page

**Title**:
The display label for a note in the list, derived from the first non-empty line of its text after stripping markdown syntax. Not a stored field and not a separate concept from the note body.
_Avoid_: Heading, subject line, name

**Tag**:
A path string (e.g. `work/projects`) written as a hashtag in note text. Tags are not stored or managed separately from notes — renaming or removing a tag rewrites the markdown in every note that carries it.
_Avoid_: Label, category, folder

**Tag tree**:
A derived index built from all hashtags across all notes, nested by slash segments. Parent nodes count notes tagged with that path or any descendant. A way to browse notes, not a container they live in.
_Avoid_: Folder tree, taxonomy, hierarchy
