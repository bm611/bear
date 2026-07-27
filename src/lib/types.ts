export interface Note {
  id: string
  /** Full markdown source. The first non-empty line doubles as the title, Bear-style. */
  text: string
  createdAt: number
  updatedAt: number
  pinned: boolean
  archived: boolean
  /** Timestamp of when the note was moved to trash, or null when it is not trashed. */
  trashedAt: number | null
}

export type Filter =
  | { kind: 'all' }
  | { kind: 'untagged' }
  | { kind: 'todo' }
  | { kind: 'today' }
  | { kind: 'archive' }
  | { kind: 'trash' }
  | { kind: 'tag'; tag: string }

export type ThemeMode = 'light' | 'dark' | 'system'
export type EditorFont = 'sans' | 'serif' | 'mono'
export type SortMode = 'modified' | 'created' | 'title'

export interface Preferences {
  theme: ThemeMode
  font: EditorFont
  fontSize: number
  sort: SortMode
  sidebarVisible: boolean
  listVisible: boolean
}

/** A node in the nested tag tree derived from every `#tag` in every note. */
export interface TagNode {
  /** Full path, e.g. `work/projects`. */
  path: string
  /** Last path segment, e.g. `projects`. */
  name: string
  children: TagNode[]
  /** Notes carrying this exact tag or any descendant of it. */
  count: number
}
